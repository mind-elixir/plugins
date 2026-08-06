# @mind-elixir/export-mindmap

Mind Elixir 思维导图导出插件，支持图片、HTML、JSON、Markdown 格式导出。

## 安装

```bash
npm install @mind-elixir/export-mindmap
```

## 使用方法

### 直接下载

```javascript
import {
  downloadImage,
  downloadHtml,
  downloadJson,
  downloadMarkdown,
} from '@mind-elixir/export-mindmap'

// 导出图片
await downloadImage(mindElixir, 'png') // 支持 'png' | 'jpeg' | 'webp'

// 导出文档（HTML 已废弃，请优先使用图片/JSON/Markdown）
downloadHtml(mindElixir)
downloadJson(mindElixir)
downloadMarkdown(mindElixir)
```

### 获取导出 URL（不直接下载）

```javascript
import {
  exportImage,
  exportHtml,
  exportJson,
  exportMarkdown,
} from '@mind-elixir/export-mindmap'

// 获取导出URL，可用于预览或自定义处理（HTML 已废弃）
const imageUrl = await exportImage(mindElixir, 'png')
const htmlUrl = exportHtml(mindElixir)
const jsonUrl = exportJson(mindElixir)
const markdownUrl = exportMarkdown(mindElixir)
```

### 批量导出

```javascript
import {
  downloadMethodList,
  exportMethodList,
} from '@mind-elixir/export-mindmap'

// 直接下载所有格式
downloadMethodList.forEach(({ type, download }) => {
  console.log(`导出 ${type}`)
  download(mindElixir)
})

// 获取所有格式的URL
const urls = await Promise.all(
  exportMethodList.map(async ({ type, export: exportFn }) => ({
    type,
    url: await exportFn(mindElixir),
  }))
)
```

### SCST（内置 DOM 转图片引擎）

图片导出由内置的 SCST 引擎驱动。它是一个轻量、高性能的 DOM-to-image 库，基于 SVG `<foreignObject>` + Canvas 渲染管线：

1. 深克隆目标 DOM 节点
2. 将计算样式（白名单属性）内联到克隆节点上
3. 将外部资源（图片等）转换为 data URI
4. 将克隆节点序列化进 SVG `<foreignObject>`
5. 绘制到 Canvas 后导出为 Blob / DataURL / ObjectURL

SCST 的 API 也从包中直接导出，可独立用于任意 DOM 元素截图：

```javascript
import { domToBlob, domToDataURL, domToObjectURL } from '@mind-elixir/export-mindmap'

// format 支持 'png' | 'jpeg' | 'webp'，默认 'png'
const blob = await domToBlob(element, 'png', options)
const dataUrl = await domToDataURL(element, 'jpeg', options)
const objectUrl = await domToObjectURL(element, 'webp', options) // 下载场景最省内存
```

#### Options

```typescript
interface Options {
  width?: number // 覆盖渲染宽度，默认取元素 offsetWidth
  height?: number // 覆盖渲染高度，默认取元素 offsetHeight
  scale?: number // Canvas 像素比，默认 window.devicePixelRatio
  backgroundColor?: string // 元素背后填充的背景色
  quality?: number // jpeg/webp 的输出质量，0-1
  onClone?: (clone: HTMLElement) => void // 渲染前对克隆根节点做 DOM 调整
  onHost?: (host: HTMLElement) => void // 对包裹克隆节点的宿主 <div> 做整体调整（如加水印）
  skipProperties?: string[] // 跳过内联的 CSS 属性（性能优化）
  filter?: (node: Element) => boolean // 过滤要包含在截图中的节点
}
```

`exportImage` / `downloadImage` 内部即基于 SCST 实现，并额外支持 `watermarkEnabled`（默认 `true`）控制水印。

如需直接拿到图片 `Blob` 而不创建 URL，可调用 `exportImageBlob`（`exportImage` 的底层实现，参数完全相同）：

## API

### 下载函数

- `downloadImage(mei, format)` - 下载图片
- `downloadHtml(mei)` - 下载 HTML 文件（已废弃）
- `downloadJson(mei)` - 下载 JSON 文件
- `downloadMarkdown(mei)` - 下载 Markdown 文件

### 导出函数（返回 URL）

- `exportImage(mei, format)` - 返回图片 URL
- `exportImageBlob(mei, format)` - 返回图片 Blob
- `exportHtml(mei)` - 返回 HTML URL（已废弃）
- `exportJson(mei)` - 返回 JSON URL
- `exportMarkdown(mei)` - 返回 Markdown URL

### SCST 函数（DOM 截图）

- `domToBlob(element, format?, options?)` - DOM 元素转 Blob
- `domToDataURL(element, format?, options?)` - DOM 元素转 data URL
- `domToObjectURL(element, format?, options?)` - DOM 元素转 object URL

### 工具函数

- `downloadUrl(url, fileName)` - 通用下载函数
- `convertToHtml(data)` - 数据转 HTML
- `convertToMd(data)` - 数据转 Markdown

### 预定义列表

- `downloadMethodList` - 下载方法列表
- `exportMethodList` - 导出方法列表

## 特性

- 🖼️ 高质量图片导出（PNG/JPEG/WEBP），由内置 SCST 引擎驱动，零第三方截图依赖
- 📄 完整 HTML 文件（包含运行时）
- 📝 标准 Markdown 格式
- 💾 完整 JSON 数据
- 🔧 支持导出/下载分离

## 许可证

MIT
