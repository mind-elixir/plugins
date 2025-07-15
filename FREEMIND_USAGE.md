# FreeMind导入功能使用指南

## 概述

本库现在支持导入FreeMind的MM格式文件，并将其转换为MindElixir格式。FreeMind是一个流行的开源思维导图软件，使用XML格式存储数据。

## 基本用法

```typescript
import { importFreeMindFile } from "@mind-elixir/import-xmind";
import MindElixir from "mind-elixir";

// 导入FreeMind文件
const fileInput = document.getElementById("fileInput") as HTMLInputElement;
const file = fileInput.files[0];

try {
  // 解析FreeMind文件（直接返回MindElixir数据，包含FreeMind风格主题）
  const mindElixirData = await importFreeMindFile(file);

  // 初始化MindElixir
  const mind = new MindElixir({
    el: "#map",
    direction: MindElixir.SIDE,
    theme: mindElixirData.theme, // 使用FreeMind风格主题
  });

  mind.init(mindElixirData);
} catch (error) {
  console.error("导入FreeMind文件失败:", error);
}
```

## 支持的FreeMind功能

### ✅ 完全支持

1. **节点层次结构**
   - 根节点和子节点
   - 无限层级嵌套
   - 左右分支定位

2. **文本内容**
   - TEXT属性中的纯文本
   - 富文本内容（richcontent）- 自动提取HTML中的纯文本
   - 节点注释（NOTE类型的richcontent）- 保留HTML格式并提取文本

3. **字体样式**
   - 字体族（font NAME）
   - 字体大小（font SIZE）
   - 粗体（font BOLD）
   - 斜体（font ITALIC）

4. **颜色样式**
   - 文字颜色（COLOR属性）
   - 背景颜色（BACKGROUND_COLOR属性）

5. **边框样式**
   - 边框颜色（edge COLOR）
   - 边框样式（edge STYLE）
   - 边框宽度（edge WIDTH）

6. **特殊样式**
   - 云朵样式（cloud）- 转换为圆角虚线边框

7. **交互功能**
   - 超链接（LINK属性）
   - 折叠状态（FOLDED属性）

8. **图标和标签**
   - 内置图标（icon BUILTIN）- 转换为标签

9. **箭头连接**
   - 节点间的箭头链接（arrowlink）

10. **主题样式**
    - 自动应用FreeMind经典主题
    - 根节点黄色背景（#ffff99）
    - 主分支蓝色背景（#99ccff）
    - 子节点绿色背景（#99ff99）

### ❌ 暂不支持

1. **高级功能**
   - 钩子/插件（hook元素）
   - 自定义属性（attribute元素）
   - 复杂的HTML富文本格式（仅提取纯文本）

2. **布局信息**
   - 绝对位置信息（HGAP, VGAP, VSHIFT）
   - 精确的几何布局

## FreeMind经典主题

导入FreeMind文件时，会自动应用"FreeMind Classic"主题，该主题模拟了FreeMind的经典外观：

### 主题特色

- **根节点**: 黄色背景（#ffff99），黑色文字，灰色边框
- **主分支**: 浅蓝色背景（#99ccff），黑色文字
- **子节点**: 浅绿色背景（#99ff99），黑色文字
- **调色板**: 8种柔和的颜色，包括黄、蓝、绿、橙、粉、紫、青、红

### 使用主题

```typescript
// 导入时自动包含主题
const mindElixirData = await importFreeMindFile(file);

// 在初始化时应用主题
const mind = new MindElixir({
  el: "#map",
  direction: MindElixir.SIDE,
  theme: mindElixirData.theme, // FreeMind Classic主题
});

mind.init(mindElixirData);
```

### 自定义主题

如果你想使用自己的主题而不是FreeMind主题：

```typescript
const mindElixirData = await importFreeMindFile(file);

// 使用自定义主题
const mind = new MindElixir({
  el: "#map",
  direction: MindElixir.SIDE,
  theme: myCustomTheme, // 你的自定义主题
});

mind.init(mindElixirData);
```

## FreeMind与XMind的区别

| 特性 | FreeMind | XMind |
|------|----------|-------|
| 文件格式 | 单一XML文件(.mm) | ZIP压缩包(.xmind) |
| 数据结构 | 扁平的XML结构 | JSON/XML混合结构 |
| 样式系统 | 内联样式属性 | 独立的样式定义 |
| 导入方式 | `importFreeMindFile()` | `importXMindFile()` + `convertXmindToMindElixir()` |
| 返回数据 | 直接返回MindElixirData | 返回Sheet数组，需要转换 |

## 示例FreeMind文件结构

```xml
<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
  <node TEXT="根节点" ID="root" COLOR="#000000" BACKGROUND_COLOR="#ffff99">
    <font NAME="SansSerif" SIZE="20" BOLD="true"/>
    <edge COLOR="#808080" STYLE="bezier" WIDTH="thin"/>
    
    <node TEXT="子节点" ID="child1" POSITION="right" COLOR="#0033ff">
      <font NAME="SansSerif" SIZE="18"/>
      <richcontent TYPE="NOTE">
        <html>
          <body><p>这是一个注释</p></body>
        </html>
      </richcontent>
      <icon BUILTIN="idea"/>
    </node>
    
    <arrowlink DESTINATION="child1" COLOR="#ff0000"/>
  </node>
</map>
```

## HTML内容处理

FreeMind支持在节点中使用富文本内容（richcontent），这些内容以HTML格式存储。本库对HTML内容的处理策略如下：

### 处理方式

1. **节点标题（TYPE="NODE"）**
   - 自动提取HTML中的纯文本作为节点标题
   - 移除所有HTML标签，保留文本内容
   - 支持直接访问原始HTML字符串
   - 示例：`<p>这是<b>重要</b>内容</p>` → `这是重要内容`

2. **节点注释（TYPE="NOTE"）**
   - 提取HTML中的文本作为MindElixir的note
   - 保留基本的文本结构
   - 支持直接访问原始HTML字符串
   - 示例：`<p>注释<br/>换行</p>` → `注释 换行`

### 示例FreeMind富文本

```xml
<node ID="richtext">
  <richcontent TYPE="NODE">
    <html>
      <body>
        <p>这是<em>富文本</em>标题</p>
      </body>
    </html>
  </richcontent>
  <richcontent TYPE="NOTE">
    <html>
      <body>
        <p>这是<b>重要</b>的注释</p>
        <ul>
          <li>项目1</li>
          <li>项目2</li>
        </ul>
      </body>
    </html>
  </richcontent>
</node>
```

### 转换结果

- **节点标题**: "这是富文本标题"
- **节点注释**: "这是重要的注释 项目1 项目2"

### 实际数据结构

FreeMind的richcontent在解析后的结构如下：

```javascript
{
  "#text": "<html>\n  <head>\n  </head>\n  <body>\n    <p>FreeMind点亮智慧的明灯</p>\n  </body>\n</html>\n",
  "TYPE": "NODE"  // 或 "NOTE"
}
```

- `#text`: 包含原始HTML字符串
- `TYPE`: 指定richcontent的类型，可以是"NODE"（节点标题）或"NOTE"（节点注释）

## 错误处理

```typescript
try {
  const mindElixirData = await importFreeMindFile(file);
  // 处理成功的情况
} catch (error) {
  if (error.message.includes("Invalid FreeMind MM format")) {
    console.error("文件格式不正确，请确保是有效的FreeMind MM文件");
  } else {
    console.error("导入过程中发生错误:", error.message);
  }
}
```

## 性能考虑

- FreeMind文件通常比XMind文件小，因为它们是单一的XML文件
- 大型FreeMind文件（>1000个节点）可能需要几秒钟来解析
- 建议在导入大文件时显示加载指示器

## 兼容性

- 支持FreeMind 0.9.0及以上版本的MM文件
- 兼容大多数FreeMind导出的XML格式
- 自动处理不同编码格式的文件
