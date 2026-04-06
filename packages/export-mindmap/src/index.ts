import { MindElixirInstance } from 'mind-elixir'
import { convertToHtml, HtmlExportOptions } from './html'
import { convertToMd } from './markdown'
import { domToBlob, Options } from 'modern-screenshot'

export const downloadUrl = async (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.download = fileName
  link.href = url
  link.click()
}

export const exportImage = async (mei: MindElixirInstance, format: 'png' | 'jpeg' | 'webp', options?: Options) => {
  const labels = mei.nodes.querySelectorAll('.svg-label')
  let marginL = 0
  let marginR = 0
  const mapRect = mei.nodes.getBoundingClientRect()
  labels.forEach(el => {
    const rect = el.getBoundingClientRect()
    const relativeLeft = mapRect.left - rect.left
    const relativeRight = rect.right - mapRect.right
    if (relativeLeft > marginL) marginL = relativeLeft
    if (relativeRight > marginR) marginR = relativeRight
  })
  console.log('marginL', marginL, 'marginR', marginR)
  let width = mei.nodes.offsetWidth
  if (marginL > 0) width += marginL + 10 // 多加 10 不然完全擦边
  if (marginR > 0) width += marginR + 10
  const height = mei.nodes.offsetHeight
  const blob = await domToBlob(mei.nodes.parentElement!, {
    height,
    width,
    type: 'image/' + format,
    onCloneNode: node => {
      const n = node as HTMLElement
      n.style.transform = 'none'
      n.style.transformOrigin = ''
      if (marginL > 0) n.style.marginLeft = marginL + 10 + 'px'
    },
    backgroundColor: mei.theme.cssVar['--bgcolor'],
    quality: format === 'png' ? 1 : 0.7,
    ...options,
  })
  return URL.createObjectURL(blob)
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
