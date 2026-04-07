/**
 * SCST
 * A lightweight, opinionated, high-performance DOM-to-image library
 * Uses SVG <foreignObject> + canvas as the core rendering pipeline.
 *
 * Pipeline:
 *   1. Clone the target DOM node
 *   2. Inline all computed styles onto cloned nodes
 *   3. Convert external resources (images, fonts) to data URIs
 *   4. Serialize the clone into an SVG <foreignObject> string
 *   5. Draw the SVG onto a canvas, then export as blob/dataURL
 */

export interface Options {
  /** Override rendered width (defaults to element's offsetWidth) */
  width?: number
  /** Override rendered height (defaults to element's offsetHeight) */
  height?: number
  /** Canvas pixel ratio, defaults to window.devicePixelRatio */
  scale?: number
  /** Background color to fill behind the element */
  backgroundColor?: string
  /** Output image quality for jpeg/webp, 0-1 */
  quality?: number
  /** Called on the cloned root node before rendering — apply any DOM tweaks here */
  onClone?: (clone: HTMLElement) => void
  /** Called on the host <div> that contains the clone — apply any overall tweaks here (e.g. watermarks) */
  onHost?: (host: HTMLElement) => void
  /** CSS properties to skip inlining (for perf; skip non-visual props) */
  skipProperties?: string[]
  /** Filter nodes to include in the screenshot */
  filter?: (node: Element) => boolean
}

// Properties that are essential for visual fidelity
const WHITELIST = [
  'box-sizing',
  'display',
  'position',
  'top',
  'right',
  'bottom',
  'left',
  'width',
  'height',
  'min-width',
  'min-height',
  'max-width',
  'max-height',
  'flex',
  'flex-basis',
  'flex-direction',
  'flex-grow',
  'flex-shrink',
  'flex-wrap',
  'align-content',
  'align-items',
  'align-self',
  'justify-content',
  'justify-items',
  'justify-self',
  'order',
  'float',
  'clear',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'border',
  'border-top',
  'border-right',
  'border-bottom',
  'border-left',
  'border-width',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  'border-style',
  'border-top-style',
  'border-right-style',
  'border-bottom-style',
  'border-left-style',
  'border-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'background',
  'background-color',
  'background-image',
  'background-repeat',
  'background-size',
  'background-position',
  'color',
  'font',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'text-align',
  'text-decoration',
  'text-transform',
  'text-shadow',
  'text-overflow',
  'white-space',
  'word-break',
  'word-wrap',
  'vertical-align',
  'opacity',
  'visibility',
  'transform',
  'transform-origin',
  'box-shadow',
  'outline',
  'z-index',
  'overflow',
  'overflow-x',
  'overflow-y',
  // SVG specific
  'fill',
  'stroke',
  'stroke-width',
  // RTL and layout
  'direction',
  'unicode-bidi',
  'writing-mode',
]

/** Fetch a URL and return a base64 data URI */
async function toDataURI(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await blobToDataURL(blob)
  } catch {
    return url // fallback to original if fetch fails
  }
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Inline computed styles from the live node onto the cloned node */
function inlineStyles(live: Element, clone: Element, skipProps: Set<string>): void {
  if (!(live instanceof HTMLElement || live instanceof SVGElement) || !(clone instanceof HTMLElement || clone instanceof SVGElement)) return
  const computed = window.getComputedStyle(live)
  const style = clone.style

  for (const prop of WHITELIST) {
    if (skipProps.has(prop)) continue
    const value = computed.getPropertyValue(prop)
    if (value) {
      style.setProperty(prop, value, computed.getPropertyPriority(prop))
    }
  }
}

/** Recursively walk two trees (live DOM + cloned DOM) together to inline styles */
function walkAndInline(live: Element, clone: Element, skipProps: Set<string>, filter?: (node: Element) => boolean): void {
  inlineStyles(live, clone, skipProps)
  const liveChildren = Array.from(live.children)
  const cloneChildren = Array.from(clone.children)
  for (let i = 0; i < liveChildren.length; i++) {
    const liveChild = liveChildren[i]
    const cloneChild = cloneChildren[i]
    if (filter && !filter(liveChild)) {
      cloneChild.remove()
      continue
    }
    if (cloneChild) {
      walkAndInline(liveChild, cloneChild, skipProps, filter)
    }
  }
}

/** Replace all <img> src attributes in the clone with data URIs */
async function inlineImages(clone: Element): Promise<void> {
  const imgs = Array.from(clone.querySelectorAll('img'))
  await Promise.all(
    imgs.map(async img => {
      const src = img.getAttribute('src')
      if (src && !src.startsWith('data:')) {
        try {
          img.setAttribute('src', await toDataURI(src))
        } catch {
          // keep original
        }
      }
    })
  )
}

/** Encode an SVGElement to a data URI */
function svgToDataURI(svg: SVGSVGElement): string {
  const xml = new XMLSerializer().serializeToString(svg)
  // Use UTF-8 safe encoding: encodeURIComponent handles non-ASCII chars
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml)
}

/** Wait for an HTMLImageElement to fully load */
function waitForImage(img: HTMLImageElement): Promise<void> {
  if (img.complete && img.naturalWidth > 0) return Promise.resolve()
  return new Promise(resolve => {
    const done = () => {
      img.removeEventListener('load', done)
      img.removeEventListener('error', done)
      resolve()
    }
    img.addEventListener('load', done)
    img.addEventListener('error', done)
  })
}

/**
 * Serialize a DOM element into an SVG foreignObject data URI.
 * All styles are inlined; images are converted to data URIs.
 */
async function domToSvgDataURI(element: HTMLElement, width: number, height: number, options: Options): Promise<string> {
  // 1. Clone the node (deep clone)
  const clone = element.cloneNode(true) as HTMLElement

  // 2. Inline computed styles first (walk live DOM alongside clone)
  //    Must run BEFORE onClone so the caller's overrides take effect last.
  const skipProps = new Set(options.skipProperties ?? [])
  walkAndInline(element, clone, skipProps, options.filter)

  // Reset the clone root's own positioning.
  // Its computed top/left/transform were relative to ancestors that aren't
  // in the clone — we want it to start flush at (0,0) inside host.
  clone.style.position = 'relative'
  clone.style.top = '0'
  clone.style.left = '0'
  clone.style.transform = 'none'

  // 3. Let caller apply overrides on the already-inlined clone.
  //    Important: this runs AFTER walkAndInline so nothing overwrites e.g. transform:none.
  options.onClone?.(clone)

  // 4. Don't force width/height on the clone itself — it may use flexbox/flow layout
  //    and overriding those would break child positioning.
  //    Instead wrap it in a host <div> that is exactly the target size, so the
  //    foreignObject viewport is well-defined while the clone lays out naturally.
  clone.style.overflow = 'visible'

  const host = document.createElement('div')
  host.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml')
  host.style.cssText = [
    `width:${width}px`,
    `height:${height}px`,
    'overflow:visible',
    'position:relative',
    ...(options.backgroundColor ? [`background:${options.backgroundColor}`] : []),
  ].join(';')
  host.appendChild(clone)
  options.onHost?.(host)

  // 5. Inline images inside the entire host (including possible watermarks from onHost)
  await inlineImages(host)

  // 6. Build the SVG wrapper
  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg') as SVGSVGElement
  svg.setAttribute('xmlns', svgNS)
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

  // 7. Wrap host in <foreignObject>
  const fo = document.createElementNS(svgNS, 'foreignObject')
  fo.setAttribute('x', '0')
  fo.setAttribute('y', '0')
  fo.setAttribute('width', String(width))
  fo.setAttribute('height', String(height))
  fo.appendChild(host)
  svg.appendChild(fo)

  return svgToDataURI(svg)
}

/**
 * Capture a DOM element and return a Blob.
 *
 * @param element  - The element to capture
 * @param format   - 'png' | 'jpeg' | 'webp'
 * @param options  - Rendering options
 */
export async function domToBlob(element: HTMLElement, format: 'png' | 'jpeg' | 'webp' = 'png', options: Options = {}): Promise<Blob> {
  const width = options.width ?? element.offsetWidth
  const height = options.height ?? element.offsetHeight
  const scale = options.scale ?? window.devicePixelRatio ?? 1
  const quality = options.quality ?? (format === 'png' ? 1 : 0.85)

  const svgDataURI = await domToSvgDataURI(element, width, height, options)

  // Draw SVG onto canvas
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)

  const ctx = canvas.getContext('2d')!
  if (options.backgroundColor) {
    ctx.fillStyle = options.backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.scale(scale, scale)

  const img = new Image()
  img.src = svgDataURI

  await waitForImage(img)

  ctx.drawImage(img, 0, 0)
  // safari hack: 不重绘会漏图
  await new Promise(resolve => setTimeout(resolve, 100))
  ctx.drawImage(img, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob)
        else reject(new Error('canvas.toBlob returned null'))
      },
      `image/${format}`,
      quality
    )
  })
}

/**
 * Capture a DOM element and return a data URL.
 */
export async function domToDataURL(element: HTMLElement, format: 'png' | 'jpeg' | 'webp' = 'png', options: Options = {}): Promise<string> {
  const blob = await domToBlob(element, format, options)
  return blobToDataURL(blob)
}

/**
 * Capture a DOM element and return an object URL (most memory-efficient for downloads).
 */
export async function domToObjectURL(element: HTMLElement, format: 'png' | 'jpeg' | 'webp' = 'png', options: Options = {}): Promise<string> {
  const blob = await domToBlob(element, format, options)
  return URL.createObjectURL(blob)
}
