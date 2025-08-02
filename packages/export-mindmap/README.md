# @mind-elixir/export-mindmap

一个用于导出 Mind Elixir 思维导图的插件包，支持多种格式的导出功能。

## 功能特性

- 🖼️ **图片导出**: 支持 PNG、JPEG、WEBP 格式
- 📄 **文档导出**: 支持 HTML、Markdown、JSON 格式
- 🎨 **高质量输出**: 图片导出支持高分辨率和自定义质量
- 🔧 **易于使用**: 简单的 API 接口，一行代码完成导出

## 安装

```bash
npm install @mind-elixir/export-mindmap
```

## 使用方法

### 基础用法

```javascript
import { downloadImage, downloadHtml, downloadJson, downloadMarkdown, downloadMethodList } from '@mind-elixir/export-mindmap'

// 假设你已经有一个 MindElixir 实例
const mindElixir = new MindElixir({
  el: '#mind-elixir',
  // 其他配置...
})

// 导出为 PNG 图片
await downloadImage(mindElixir, 'png')

// 导出为 HTML 文件
downloadHtml(mindElixir)

// 导出为 JSON 文件
downloadJson(mindElixir)

// 导出为 Markdown 文件
downloadMarkdown(mindElixir)
```

### 使用预定义的导出方法列表

```javascript
import { downloadMethodList } from '@mind-elixir/export-mindmap'

// 获取所有可用的导出方法
console.log(downloadMethodList)
// [
//   { type: "HTML", download: downloadHtml },
//   { type: "JSON", download: downloadJson },
//   { type: "PNG", download: (mei) => downloadImage(mei, 'png') },
//   { type: "JPEG", download: (mei) => downloadImage(mei, 'jpeg') },
//   { type: "WEBP", download: (mei) => downloadImage(mei, 'webp') },
//   { type: "Markdown", download: downloadMarkdown }
// ]

// 使用特定的导出方法
downloadMethodList[0].download(mindElixir) // 导出 HTML
```

## API 参考

### downloadImage(mei, format)

导出思维导图为图片格式。

**参数:**

- `mei` (MindElixirInstance): Mind Elixir 实例
- `format` ('png' | 'jpeg' | 'webp'): 图片格式

**返回值:** Promise\<void\>

**特性:**

- 自动调整缩放比例为 1:1 以确保最佳质量
- PNG 格式使用无损压缩 (quality: 1)
- JPEG 和 WEBP 格式使用 70% 质量压缩
- 包含 300px 的内边距
- 保持原有的主题背景色

### downloadHtml(mei)

导出思维导图为独立的 HTML 文件。

**参数:**

- `mei` (MindElixirInstance): Mind Elixir 实例

**特性:**

- 生成完全独立的 HTML 文件
- 包含 Mind Elixir Lite 运行时
- 禁用编辑、拖拽和右键菜单功能
- 适合分享和展示

### downloadJson(mei)

导出思维导图数据为 JSON 格式。

**参数:**

- `mei` (MindElixirInstance): Mind Elixir 实例

**特性:**

- 导出完整的思维导图数据结构
- 可用于备份或在其他应用中导入

### downloadMarkdown(mei)

导出思维导图为 Markdown 格式。

**参数:**

- `mei` (MindElixirInstance): Mind Elixir 实例

**特性:**

- 使用缩进列表格式
- 保持层级结构
- 兼容标准 Markdown 语法

### downloadMethodList

预定义的导出方法数组，包含所有可用的导出选项。

**类型:**

```typescript
Array<{
  type: string
  download: (mei: MindElixirInstance) => void | Promise<void>
}>
```

## 转换工具

### convertToHtml(data)

将 Mind Elixir 数据转换为 HTML 字符串。

**参数:**

- `data` (MindElixirData): Mind Elixir 数据对象

**返回值:** string

### convertToMd(data, highlight?)

将 Mind Elixir 节点数据转换为 Markdown 字符串。

**参数:**

- `data` (NodeObj): 节点数据对象
- `highlight` (NodeObj, 可选): 需要高亮的节点

**返回值:** string

## 依赖项

- `@ssshooter/modern-screenshot`: 用于高质量的 DOM 截图
- `mind-elixir`: Mind Elixir 核心库

## 浏览器兼容性

- Chrome/Edge 88+
- Firefox 90+
- Safari 14+

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新信息。
