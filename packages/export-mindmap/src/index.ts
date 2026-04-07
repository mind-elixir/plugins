import { MindElixirInstance } from 'mind-elixir'
import { convertToHtml, HtmlExportOptions } from './html'
import { convertToMd } from './markdown'
import { domToObjectURL, Options } from './scst'
import iconUrl from './icon.png'

export const downloadUrl = async (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
}

const isDarkColor = (color?: string): boolean => {
  if (!color) return false
  let r, g, b
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else {
      r = parseInt(hex.slice(0, 2), 16)
      g = parseInt(hex.slice(2, 4), 16)
      b = parseInt(hex.slice(4, 6), 16)
    }
  } else if (color.startsWith('rgb')) {
    const matches = color.match(/\d+/g)
    if (matches && matches.length >= 3) {
      r = parseInt(matches[0])
      g = parseInt(matches[1])
      b = parseInt(matches[2])
    }
  }
  if (r === undefined || g === undefined || b === undefined) return false
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
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

export const exportImage = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp', options?: Options & { watermarkEnabled?: boolean }) => {
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

  console.log('marginL', marginL, 'marginR', marginR)
  // mei.nodes has no transform on it (transform is on mei.map, the parent).
  // Use scrollWidth/scrollHeight to get the full content size including overflowing children.
  let width = mei.nodes.offsetWidth
  console.log('width', width)
  if (marginL > 0) width += marginL + 10
  if (marginR > 0) width += marginR + 10
  let height = mei.nodes.offsetHeight
  console.log('height', height)
  const url = await domToObjectURL(mei.nodes, format, {
    height,
    width,
    onClone: clone => {
      clone.style.transformOrigin = '0 0'
      if (marginL > 0) {
        clone.style.transform = `translateX(${marginL + 10}px)`
      }

      if (watermarkEnabled && clone instanceof HTMLElement) {
        const bgColor = mei.theme.cssVar['--bgcolor']
        const isDark = isDarkColor(bgColor)
        const watermarkColor = isDark ? '#f6f6f6' : '#1a1a1a'

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
        clone.appendChild(watermark)
      }
    },
    backgroundColor: mei.theme.cssVar['--bgcolor'],
    quality: format === 'png' ? 1 : 0.7,
    ...rest,
  })
  return url
}

export const downloadImage = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp') => {
  const url = await exportImage(mei, format)
  downloadUrl(url, mei.nodeData.topic + '.' + format)
}

export const exportHtml = (mei: MindElixirInstance, options?: HtmlExportOptions) => {
  const data = mei.getData()
  const html = convertToHtml(data, options)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  return url
}

export const downloadHtml = (mei: MindElixirInstance, options?: HtmlExportOptions) => {
  const url = exportHtml(mei, options)
  downloadUrl(url, mei.nodeData.topic + '.html')
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
}

export const exportMethodList = [
  {
    type: 'HTML',
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
