# @mind-elixir/import-freemind

FreeMind 文件导入功能包，支持将 FreeMind MM 文件转换为 MindElixir 格式。

## 特性

- FreeMind MM files (XML format)
- 完整的样式和内容转换
- 自动应用 FreeMind 经典主题
- TypeScript 支持

## 安装

```bash
npm install @mind-elixir/import-freemind
# 或
pnpm add @mind-elixir/import-freemind
# 或
yarn add @mind-elixir/import-freemind
```

## 使用方法

### 基本用法

```typescript
import {
  importFreeMindFile,
} from "@mind-elixir/import-freemind";
import MindElixir from "mind-elixir";

// 导入 FreeMind MM 文件
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const file = fileInput.files[0];

try {
  // 解析 FreeMind 文件（直接返回带有 FreeMind 主题的 MindElixir 数据）
  const mindElixirData = await importFreeMindFile(file);

  // 初始化 MindElixir
  const mind = new MindElixir({
    el: "#map",
    direction: MindElixir.SIDE,
    theme: mindElixirData.theme, // 应用 FreeMind 经典主题
  });

  mind.init(mindElixirData);
} catch (error) {
  console.error("Failed to import FreeMind file:", error);
}
```

## API 参考

### `importFreeMindFile(file: File): Promise<MindElixirData>`

导入 FreeMind MM 文件并直接返回 MindElixir 数据。

**参数:**

- `file`: 要导入的 FreeMind MM 文件 (File 对象)

**返回值:**

- `Promise<MindElixirData>`: 与 MindElixir 兼容的数据结构

**异常:**

- 如果文件不是有效的 FreeMind MM 文件则抛出错误
- 如果文件无法解析则抛出错误

## 支持的功能

### ✅ 完全支持

- **节点和子节点**: 完整的层次结构保留
- **文本内容**: 来自 TEXT 属性和富内容的节点文本
- **字体样式**: 字体系列、大小、粗体、斜体
- **颜色**: 文本颜色和背景颜色
- **边框**: 带有颜色、宽度和样式的边缘样式
- **云样式**: 转换为圆角虚线边框
- **备注**: 富内容备注（HTML 到纯文本转换）
- **超链接**: 外部链接
- **图标**: 转换为标签/标记
- **折叠状态**: 展开/折叠状态
- **箭头链接**: 节点之间的连接
- **经典主题**: 自动应用 FreeMind 风格主题
- **HTML 处理**: 自动从 HTML richcontent 提取文本

### ❌ 不支持

- **钩子/插件**: FreeMind 特定扩展
- **属性**: 自定义节点属性
- **复杂富内容**: 高级 HTML 格式（仅提取纯文本）
- **定位**: 绝对定位信息

## FreeMind 经典主题

导入 FreeMind 文件时会自动应用经典主题：

- 根节点使用经典黄色背景 (#ffff99)
- 主分支使用蓝色背景 (#99ccff)
- 子节点使用绿色背景 (#99ff99)

## 许可证

MIT License

## 相关项目

- [MindElixir](https://github.com/ssshooter/mind-elixir-core) - 此包集成的思维导图库
- [FreeMind](http://freemind.sourceforge.net/) - 创建 .mm 文件的思维导图软件