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

// 导出文档
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

// 获取导出URL，可用于预览或自定义处理
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

## API

### 下载函数

- `downloadImage(mei, format)` - 下载图片
- `downloadHtml(mei)` - 下载 HTML 文件
- `downloadJson(mei)` - 下载 JSON 文件
- `downloadMarkdown(mei)` - 下载 Markdown 文件

### 导出函数（返回 URL）

- `exportImage(mei, format)` - 返回图片 URL
- `exportHtml(mei)` - 返回 HTML URL
- `exportJson(mei)` - 返回 JSON URL
- `exportMarkdown(mei)` - 返回 Markdown URL

### 工具函数

- `downloadUrl(url, fileName)` - 通用下载函数
- `convertToHtml(data)` - 数据转 HTML
- `convertToMd(data)` - 数据转 Markdown

### 预定义列表

- `downloadMethodList` - 下载方法列表
- `exportMethodList` - 导出方法列表

## 特性

- 🖼️ 高质量图片导出（PNG/JPEG/WEBP）
- 📄 完整 HTML 文件（包含运行时）
- 📝 标准 Markdown 格式
- 💾 完整 JSON 数据
- 🔧 支持导出/下载分离

## 许可证

MIT
