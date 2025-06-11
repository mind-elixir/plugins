# @mind-elixir/import-xmind

A TypeScript library for importing XMind files and converting them to MindElixir format. This package supports both modern XMind files (JSON format) and legacy XMind files (XML format).

## Installation

```bash
# Using pnpm (recommended)
pnpm add @mind-elixir/import-xmind jszip fast-xml-parser mind-elixir

# Using npm
npm install @mind-elixir/import-xmind jszip fast-xml-parser mind-elixir

# Using yarn
yarn add @mind-elixir/import-xmind jszip fast-xml-parser mind-elixir
```

## Usage

### Basic Usage

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

## Supported XMind Features

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

### 1.0.0

- Initial release
- Support for both JSON and XML XMind formats
- Complete style and content conversion
- TypeScript support
