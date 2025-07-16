# MindElixir Import Monorepo

这是一个基于 pnpm workspace 的 monorepo，包含了 XMind 和 FreeMind 文件导入到 MindElixir 格式的功能包。

## 项目结构

```
├── packages/
│   ├── import-xmind/          # XMind 导入包
│   ├── import-freemind/       # FreeMind 导入包
│   └── test-app/              # 测试应用
├── package.json               # 根目录配置
├── pnpm-workspace.yaml        # pnpm workspace 配置
└── tsconfig.json              # TypeScript 项目引用配置
```

## 包说明

### @mind-elixir/import-xmind
XMind 文件导入功能包，支持：
- Modern XMind files (JSON format)
- Legacy XMind files (XML format)

### @mind-elixir/import-freemind
FreeMind 文件导入功能包，支持：
- FreeMind MM files (XML format)

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 构建所有包

```bash
pnpm build
```

### 开发模式

```bash
# 启动测试应用
cd packages/test-app
pnpm dev
```

### 单独使用包

```bash
# 安装 XMind 导入包
pnpm add @mind-elixir/import-xmind

# 安装 FreeMind 导入包
pnpm add @mind-elixir/import-freemind
```

## Usage

### Basic Usage

#### XMind Files

```typescript
import {
  importXMindFile,
  convertXmindToMindElixir,
} from "@mind-elixir/import-xmind";
import MindElixir from "mind-elixir";

// Import XMind file
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const file = fileInput.files[0];

try {
  // Parse XMind file
  const sheets = await importXMindFile(file);

  // Convert to MindElixir format
  const mindElixirData = convertXmindToMindElixir(sheets[0]);

  // Initialize MindElixir
  const mind = new MindElixir({
    el: "#map",
    direction: MindElixir.SIDE,
  });

  mind.init(mindElixirData);
} catch (error) {
  console.error("Failed to import XMind file:", error);
}
```

#### FreeMind Files

```typescript
import {
  importFreeMindFile,
} from "@mind-elixir/import-xmind";
import MindElixir from "mind-elixir";

// Import FreeMind MM file
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const file = fileInput.files[0];

try {
  // Parse FreeMind file (returns MindElixir data directly with FreeMind theme)
  const mindElixirData = await importFreeMindFile(file);

  // Initialize MindElixir
  const mind = new MindElixir({
    el: "#map",
    direction: MindElixir.SIDE,
    theme: mindElixirData.theme, // Apply FreeMind Classic theme
  });

  mind.init(mindElixirData);
} catch (error) {
  console.error("Failed to import FreeMind file:", error);
}
```

### Advanced Usage

```typescript
import {
  importXMindFile,
  convertXmindToMindElixir,
} from "@mind-elixir/import-xmind";

// Handle multiple sheets
const sheets = await importXMindFile(file);

sheets.forEach((sheet, index) => {
  console.log(`Sheet ${index + 1}: ${sheet.title}`);

  const mindElixirData = convertXmindToMindElixir(sheet);

  // Process each sheet as needed
  // You can create multiple MindElixir instances or switch between sheets
});
```

## API Reference

### `importXMindFile(file: File): Promise<Sheet[]>`

Imports an XMind file and returns an array of sheets.

**Parameters:**

- `file`: The XMind file to import (File object)

**Returns:**

- `Promise<Sheet[]>`: Array of parsed sheets from the XMind file

**Throws:**

- Error if the file is not a valid XMind file
- Error if the file cannot be parsed

### `convertXmindToMindElixir(sheet: Sheet): MindElixirData`

Converts a single XMind sheet to MindElixir format.

**Parameters:**

- `sheet`: A sheet object from the imported XMind file

**Returns:**

- `MindElixirData`: Data structure compatible with MindElixir

### `importFreeMindFile(file: File): Promise<MindElixirData>`

Imports a FreeMind MM file and returns MindElixir data directly.

**Parameters:**

- `file`: The FreeMind MM file to import (File object)

**Returns:**

- `Promise<MindElixirData>`: Data structure compatible with MindElixir

**Throws:**

- Error if the file is not a valid FreeMind MM file
- Error if the file cannot be parsed

## Supported Features

### XMind Features

### ✅ Fully Supported

- **Topics and Subtopics**: Complete hierarchy preservation
- **Text Styling**: Font size, color, weight, family
- **Background Colors**: Node background colors and fills
- **Borders**: Border width, color, and style
- **Notes**: Plain text notes attached to topics
- **Hyperlinks**: External and internal links
- **Images**: Embedded images with size information
- **Labels/Tags**: Topic labels and tags
- **Relationships**: Arrows and connections between topics
- **Summaries**: Topic summaries and ranges
- **Folding State**: Expanded/collapsed state of branches

### ❌ Not Supported

- **Detached Topics**: Topics not attached to the main tree
- **Attachments**: File attachments
- **Themes**: Basic theme conversion (colors and styles)
- **Markers**: Limited marker support
- **Boundaries**: Basic boundary support

### FreeMind Features

#### ✅ Fully Supported

- **Nodes and Subnodes**: Complete hierarchy preservation
- **Text Content**: Node text from TEXT attribute and rich content
- **Font Styling**: Font family, size, bold, italic
- **Colors**: Text color and background color
- **Borders**: Edge styling with color, width, and style
- **Cloud Styling**: Converted to rounded dashed borders
- **Notes**: Rich content notes (HTML to plain text conversion)
- **Hyperlinks**: External links
- **Icons**: Converted to tags/labels
- **Folding State**: Expanded/collapsed state
- **Arrow Links**: Connections between nodes
- **Classic Theme**: Automatic FreeMind-style theme application
- **HTML Processing**: Automatic extraction of text from HTML richcontent

#### ❌ Not Supported

- **Hooks/Plugins**: FreeMind-specific extensions
- **Attributes**: Custom node attributes
- **Complex Rich Content**: Advanced HTML formatting (only plain text is extracted)
- **Positioning**: Absolute positioning information

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/mind-elixir/import-xmind
cd import-xmind

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Build

```bash
# Build for production
pnpm build

# Build and publish
pnpm bnp
```

### Testing

Open `index.html` in your browser and use the file input to test XMind file imports.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Related Projects

- [MindElixir](https://github.com/ssshooter/mind-elixir-core) - The mind mapping library this package integrates with
- [XMind](https://www.xmind.net/) - The mind mapping software that creates .xmind files

## Changelog

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
