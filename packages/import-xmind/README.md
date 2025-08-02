# @mind-elixir/import-xmind

XMind 文件导入功能包，支持将 XMind 文件转换为 MindElixir 格式。

## 特性

- Modern XMind files (JSON format)
- Legacy XMind files (XML format)
- 完整的样式和内容转换
- TypeScript 支持

## 安装

```bash
npm install @mind-elixir/import-xmind
# 或
pnpm add @mind-elixir/import-xmind
# 或
yarn add @mind-elixir/import-xmind
```

## 使用方法

### 基本用法

```typescript
import {
  importXMindFile,
  convertXmindToMindElixir,
} from "@mind-elixir/import-xmind";
import MindElixir from "mind-elixir";

// 导入 XMind 文件
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const file = fileInput.files[0];

try {
  // 解析 XMind 文件
  const sheets = await importXMindFile(file);

  // 转换为 MindElixir 格式
  const mindElixirData = convertXmindToMindElixir(sheets[0]);

  // 初始化 MindElixir
  const mind = new MindElixir({
    el: "#map",
    direction: MindElixir.SIDE,
  });

  mind.init(mindElixirData);
} catch (error) {
  console.error("Failed to import XMind file:", error);
}
```

### 高级用法

```typescript
import {
  importXMindFile,
  convertXmindToMindElixir,
} from "@mind-elixir/import-xmind";

// 处理多个工作表
const sheets = await importXMindFile(file);

sheets.forEach((sheet, index) => {
  console.log(`Sheet ${index + 1}: ${sheet.title}`);

  const mindElixirData = convertXmindToMindElixir(sheet);

  // 根据需要处理每个工作表
  // 可以创建多个 MindElixir 实例或在工作表之间切换
});
```

## API 参考

### `importXMindFile(file: File): Promise<Sheet[]>`

导入 XMind 文件并返回工作表数组。

**参数:**

- `file`: 要导入的 XMind 文件 (File 对象)

**返回值:**

- `Promise<Sheet[]>`: 从 XMind 文件解析的工作表数组

**异常:**

- 如果文件不是有效的 XMind 文件则抛出错误
- 如果文件无法解析则抛出错误

### `convertXmindToMindElixir(sheet: Sheet): MindElixirData`

将单个 XMind 工作表转换为 MindElixir 格式。

**参数:**

- `sheet`: 从导入的 XMind 文件中获取的工作表对象

**返回值:**

- `MindElixirData`: 与 MindElixir 兼容的数据结构

## 支持的功能

### ✅ 完全支持

- **主题和子主题**: 完整的层次结构保留
- **文本样式**: 字体大小、颜色、粗细、字体系列
- **背景颜色**: 节点背景颜色和填充
- **边框**: 边框宽度、颜色和样式
- **备注**: 附加到主题的纯文本备注
- **超链接**: 外部和内部链接
- **图片**: 带有大小信息的嵌入图片
- **标签/标记**: 主题标签和标记
- **关系**: 主题之间的箭头和连接
- **摘要**: 主题摘要和范围
- **折叠状态**: 分支的展开/折叠状态

### ❌ 不支持

- **分离主题**: 未附加到主树的主题
- **附件**: 文件附件
- **主题**: 基本主题转换（颜色和样式）
- **标记**: 有限的标记支持
- **边界**: 基本边界支持

## 许可证

MIT License

## 相关项目

- [MindElixir](https://github.com/ssshooter/mind-elixir-core) - 此包集成的思维导图库
- [XMind](https://www.xmind.net/) - 创建 .xmind 文件的思维导图软件

## 更新日志

### 1.0.7

- Fixed richcontent processing error: "find is not a function"
- Simplified richcontent handling to support only the standard format
- Updated type definitions to reflect actual richcontent structure
- Removed unnecessary compatibility code for old formats

### 1.0.6

- Updated richcontent processing to handle new XML parser format
- Support for `#text` attribute in richcontent elements
- Improved compatibility with different FreeMind file formats
- Enhanced HTML text extraction from richcontent

### 1.0.5

- Improved HTML content processing in richcontent elements
- Used `stopNodes` option to preserve original HTML structure
- Enhanced text extraction from HTML richcontent (both NODE and NOTE types)
- Better handling of complex HTML formatting in FreeMind files

### 1.0.4

- Added FreeMind Classic theme that automatically applies when importing MM files
- Root nodes use classic yellow background (#ffff99)
- Main branches use blue background (#99ccff)
- Sub-nodes use green background (#99ff99)
- Fixed root node array handling issue

### 1.0.3

- Added FreeMind MM format support
- New `importFreeMindFile` function for direct FreeMind import
- Support for FreeMind-specific features (fonts, edges, clouds, icons, arrows)
- Updated test page to support both XMind and FreeMind files

### 1.0.0

- Initial release
- Support for both JSON and XML XMind formats
- Complete style and content conversion
- TypeScript support
