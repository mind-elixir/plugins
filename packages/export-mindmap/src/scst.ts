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
  /** CSS properties to skip inlining (for perf; skip non-visual props) */
  skipProperties?: string[]
}

// Properties that are safe to skip for visual fidelity
const DEFAULT_SKIP = new Set([
  'animation',
  'animation-delay',
  'animation-direction',
  'animation-duration',
  'animation-fill-mode',
  'animation-iteration-count',
  'animation-name',
  'animation-play-state',
  'animation-timing-function',
  'transition',
  'transition-delay',
  'transition-duration',
  'transition-property',
  'transition-timing-function',
  'cursor',
  'pointer-events',
  'user-select',
  '-webkit-user-select',
  'will-change',
])

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

  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i]
    if (skipProps.has(prop)) continue
    try {
      style.setProperty(prop, computed.getPropertyValue(prop), computed.getPropertyPriority(prop))
    } catch {
      // some props are read-only or invalid, ignore
    }
  }
}

/** Recursively walk two trees (live DOM + cloned DOM) together to inline styles */
function walkAndInline(live: Element, clone: Element, skipProps: Set<string>): void {
  inlineStyles(live, clone, skipProps)
  const liveChildren = live.children
  const cloneChildren = clone.children
  for (let i = 0; i < liveChildren.length; i++) {
    if (cloneChildren[i]) {
      walkAndInline(liveChildren[i], cloneChildren[i], skipProps)
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
  const skipProps = new Set([...DEFAULT_SKIP, ...(options.skipProperties ?? [])])
  walkAndInline(element, clone, skipProps)

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

  // 4. Inline images inside the clone
  await inlineImages(clone)

  // 5. Don't force width/height on the clone itself — it may use flexbox/flow layout
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
  // console.log('host', host)
  // document.body.appendChild(host)
  // return
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
