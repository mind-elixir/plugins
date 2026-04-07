import { MindElixirInstance } from 'mind-elixir'
import { convertToHtml, HtmlExportOptions } from './html'
import { convertToMd } from './markdown'
import { domToObjectURL, Options } from './scst'

export const downloadUrl = async (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
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

export const exportImage = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp', options?: Options) => {
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
    },
    backgroundColor: mei.theme.cssVar['--bgcolor'],
    quality: format === 'png' ? 1 : 0.7,
    ...options,
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
