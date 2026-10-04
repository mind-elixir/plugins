import { MindElixirInstance } from 'mind-elixir'
import { convertToHtml, HtmlExportOptions } from './html'
import { convertToMd } from './markdown'
import { domToBlob, Options } from './scst'
import iconUrl from './icon.png'

export const downloadUrl = async (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
}

/** Revoke a blob URL after the browser has started the download */
const revokeAfterDownload = (url: string) => {
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

const getOffsetLT = (parent: HTMLElement, child: HTMLElement) => {
  let offsetLeft = 0
  let offsetTop = 0
  while (child && child !== parent) {
    offsetLeft += child.offsetLeft
    offsetTop += child.offsetTop
    child = child.offsetParent as HTMLElement
  }
  return { offsetLeft, offsetTop }
}

/**
 * A declared background that paints nothing (`transparent`, `rgba(0,0,0,0)`,
 * empty) is NOT a usable export canvas: it flows through `??`-style guards
 * untouched and produces a transparent PNG — light text on a white viewer,
 * the exact bug this resolver exists to prevent. Treat it as "no value".
 */
const isUsableBg = (value: string | undefined | null): value is string =>
  !!value &&
  value.trim() !== '' &&
  value.trim().toLowerCase() !== 'transparent' &&
  !/^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0\s*\)$/.test(value.trim())

/**
 * Base-theme canvas colors, mirroring mind-elixir's built-in themes
 * (`THEME.cssVar['--bgcolor']` / `DARK_THEME.cssVar['--bgcolor']`).
 * Used only when every declared value is absent or transparent.
 */
const BASE_BG = { dark: '#252526', light: '#f6f6f6' } as const

/**
 * Resolve the map's real background color.
 *
 * `changeTheme` always writes the fully-merged cssVar onto the container, so
 * the computed `--bgcolor` is the single source of truth — it already accounts
 * for the base theme, partial overrides, and any `cssVar` the caller never
 * declared. `theme.type` is NOT a reliable signal: it only selects the base
 * layer (`{...(type==='dark'?DARK:LIGHT).cssVar, ...theme.cssVar}`), which a
 * custom `--bgcolor` is free to contradict.
 *
 * A caller may deliberately set `--bgcolor: transparent` on screen (e.g. to
 * let the map blend into a page card). For export that value is unusable
 * (see `isUsableBg`), so resolution falls through to the declared theme value
 * and finally to the base-theme color for `theme.type` — callers never need
 * to pass `backgroundColor` just to work around transparency.
 */
export const resolveExportBackground = (mei: MindElixirInstance): string => {
  const container = mei.container
  const cssVarBg = container
    ? getComputedStyle(container).getPropertyValue('--bgcolor').trim()
    : ''
  if (isUsableBg(cssVarBg)) return cssVarBg

  // Fall back to the declared value only if the DOM has nothing usable
  // (e.g. the instance was never attached, or --bgcolor was set to transparent).
  const declared = mei.theme?.cssVar?.['--bgcolor']
  if (isUsableBg(declared)) return declared

  // Every layer says "transparent": the screen intent cannot be exported.
  // Fall back to the base theme color for this theme's type.
  return mei.theme?.type === 'dark' ? BASE_BG.dark : BASE_BG.light
}

/**
 * Pick a foreground color that stays legible on `background`.
 *
 * This is a pure computation, not a fallback: it derives the watermark color
 * from the background it will actually be drawn on, using the WCAG relative
 * luminance formula. Unlike the old `theme.type === 'dark'` check, it stays
 * correct when a custom `--bgcolor` contradicts the theme's declared type.
 *
 * Throws on an unparseable color rather than defaulting — an unreadable
 * watermark should be a loud failure, not a silent one.
 */
export const contrastColor = (background: string): '#f6f6f6' | '#1a1a1a' => {
  let r: number
  let g: number
  let b: number
  const value = String(background || '').trim()
  if (value.startsWith('#')) {
    const hex = value.slice(1)
    const full =
      hex.length === 3 || hex.length === 4
        ? hex
            .split('')
            .slice(0, 3)
            .map(c => c + c)
            .join('')
        : hex
    r = parseInt(full.slice(0, 2), 16)
    g = parseInt(full.slice(2, 4), 16)
    b = parseInt(full.slice(4, 6), 16)
  } else {
    const parts = value.match(/[\d.]+/g)
    if (!parts || parts.length < 3) {
      throw new Error(`[export-mindmap] Cannot parse background color: ${JSON.stringify(background)}`)
    }
    r = parseFloat(parts[0])
    g = parseFloat(parts[1])
    b = parseFloat(parts[2])
  }
  if ([r, g, b].some(n => Number.isNaN(n))) {
    throw new Error(`[export-mindmap] Cannot parse background color: ${JSON.stringify(background)}`)
  }
  const srgb = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const luminance = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
  return luminance < 0.4 ? '#f6f6f6' : '#1a1a1a'
}

export const exportImageBlob = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp', options?: Options & { watermarkEnabled?: boolean }) => {
  const { watermarkEnabled = true, ...rest } = options || {}
  const labels = mei.nodes.querySelectorAll('.svg-label')
  let marginL = 0
  let marginR = 0
  labels.forEach(el => {
    const htmlEl = el as HTMLElement
    const { offsetLeft } = getOffsetLT(mei.nodes as HTMLElement, htmlEl)
    const relativeLeft = -offsetLeft
    const relativeRight = offsetLeft + htmlEl.offsetWidth - (mei.nodes as HTMLElement).offsetWidth
    if (relativeLeft > marginL) marginL = relativeLeft
    if (relativeRight > marginR) marginR = relativeRight
  })

  // mei.nodes has no transform on it (transform is on mei.map, the parent).
  // Use scrollWidth/scrollHeight to get the full content size including overflowing children.
  let width = mei.nodes.offsetWidth
  if (marginL > 0) width += marginL + 10
  if (marginR > 0) width += marginR + 10
  const height = mei.nodes.offsetHeight

  // Resolve once, then let an explicit caller override win.
  const resolvedBg = resolveExportBackground(mei)

  const blob = await domToBlob(mei.nodes, format, {
    height,
    width,
    onClone: clone => {
      if (marginL > 0) {
        clone.style.marginLeft = `${marginL + 10}px`
      }
    },
    onHost: host => {
      if (watermarkEnabled) {
        // Derive the watermark color from the ACTUAL background, not theme.type —
        // a custom theme can pair light canvas with dark text (or vice versa).
        const watermarkColor = contrastColor(rest.backgroundColor ?? resolvedBg)

        // Create watermark container
        const watermark = document.createElement('div')
        watermark.style.cssText = `
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 16px;
          color: ${watermarkColor};
          font-family: system-ui, -apple-system, sans-serif;
          font-weight: 500;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 9999999;
          pointer-events: none;
        `

        // Create icon element
        const icon = document.createElement('img')
        icon.src = iconUrl
        icon.style.cssText = `
          width: 22px;
          height: 22px;
        `

        // Create text element
        const text = document.createElement('span')
        text.textContent = 'MIND ELIXIR'

        watermark.appendChild(icon)
        watermark.appendChild(text)
        host.appendChild(watermark)
      }
    },
    // Resolved from the live DOM, so partial/overridden themes can't leave the
    // canvas transparent (which makes light text invisible on white viewers).
    // An explicit caller-provided backgroundColor still wins.
    backgroundColor: resolvedBg,
    quality: format === 'png' ? 1 : 0.7,
    ...rest,
  })
  return blob
}

export const exportImage = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp', options?: Options & { watermarkEnabled?: boolean }) => {
  const blob = await exportImageBlob(mei, format, options)
  return URL.createObjectURL(blob)
}

export const downloadImage = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp') => {
  const url = await exportImage(mei, format)
  downloadUrl(url, mei.nodeData.topic + '.' + format)
  revokeAfterDownload(url)
}

/**
 * @deprecated HTML export is deprecated and will be removed in a future release.
 */
export const exportHtml = (mei: MindElixirInstance, options?: HtmlExportOptions) => {
  const data = mei.getData()
  const html = convertToHtml(data, options)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  return url
}

/**
 * @deprecated HTML export is deprecated and will be removed in a future release.
 */
export const downloadHtml = (mei: MindElixirInstance, options?: HtmlExportOptions) => {
  const url = exportHtml(mei, options)
  downloadUrl(url, mei.nodeData.topic + '.html')
  revokeAfterDownload(url)
}

export const exportJson = (mei: MindElixirInstance) => {
  const data = mei.getData()
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  return url
}

export const downloadJson = (mei: MindElixirInstance) => {
  const url = exportJson(mei)
  downloadUrl(url, mei.nodeData.topic + '.json')
  revokeAfterDownload(url)
}

export const exportMarkdown = (mei: MindElixirInstance) => {
  const data = mei.getData()
  const md = convertToMd(data.nodeData)
  const blob = new Blob([md], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  return url
}

export const downloadMarkdown = (mei: MindElixirInstance) => {
  const url = exportMarkdown(mei)
  downloadUrl(url, mei.nodeData.topic + '.md')
  revokeAfterDownload(url)
}

export const exportMethodList = [
  {
    type: 'HTML',
    /**
     * @deprecated HTML export is deprecated and will be removed in a future release.
     */
    export(mei: MindElixirInstance, options?: HtmlExportOptions) {
      return exportHtml(mei, options)
    },
  },
  {
    type: 'JSON',
    export: exportJson,
  },
  {
    type: 'PNG',
    export(mei: MindElixirInstance, options?: Options) {
      return exportImage(mei, 'png', options)
    },
  },
  {
    type: 'JPEG',
    export(mei: MindElixirInstance, options?: Options) {
      return exportImage(mei, 'jpeg', options)
    },
  },
  {
    type: 'WEBP',
    export(mei: MindElixirInstance, options?: Options) {
      return exportImage(mei, 'webp', options)
    },
  },
  {
    type: 'Markdown',
    export: exportMarkdown,
  },
] as const

export const downloadMethodList = [
  {
    type: 'HTML',
    /**
     * @deprecated HTML export is deprecated and will be removed in a future release.
     */
    download(mei: MindElixirInstance, options?: HtmlExportOptions) {
      return downloadHtml(mei, options)
    },
  },
  {
    type: 'JSON',
    download: downloadJson,
  },
  {
    type: 'PNG',
    download(mei: MindElixirInstance) {
      downloadImage(mei, 'png')
    },
  },
  {
    type: 'JPEG',
    download(mei: MindElixirInstance) {
      downloadImage(mei, 'jpeg')
    },
  },
  {
    type: 'WEBP',
    download(mei: MindElixirInstance) {
      downloadImage(mei, 'webp')
    },
  },
  {
    type: 'Markdown',
    download: downloadMarkdown,
  },
] as const

export { convertToHtml, convertToMd, type Options as ImageOptions, type HtmlExportOptions }
export * from './scst'
