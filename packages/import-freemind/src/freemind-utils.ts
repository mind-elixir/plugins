// FreeMind MM格式导入功能
import { XMLParser } from "fast-xml-parser";
import type {
  FreeMindMap,
  FreeMindNode,
  FreeMindFont,
  FreeMindEdge,
} from "./types/freemind-model";
import type {
  MindElixirData,
  NodeObj,
  Theme as MindElixirTheme,
} from "mind-elixir";

/**
 * 创建FreeMind风格的MindElixir主题
 */
function createFreeMindTheme(): MindElixirTheme {
  return {
    name: "FreeMind Classic",
    palette: [
      "#333333",  
    ],
    cssVar: {
      // 根节点样式 - FreeMind经典黄色
      "--root-bgcolor": "#ffffff",
      "--root-color": "#000000",
      "--root-border-color": "#808080",

      // 主分支样式 - 蓝色系
      "--main-bgcolor": "#ffffff",
      "--main-color": "#000000",

      // 子节点样式 - 绿色系
      "--bgcolor": "#ffffff",
      "--color": "#000000",

      // 选中状态
      "--selected": "#0066cc",

      // 间距
      "--gap": "20px",

      // 面板样式
      "--panel-bgcolor": "#f5f5f5",
      "--panel-border-color": "#cccccc",
    }
  };
}

/**
 * 转换FreeMind字体样式到MindElixir样式
 */
function convertFreeMindFont(font: FreeMindFont): any {
  const style: any = {};

  if (font.NAME) {
    style.fontFamily = font.NAME;
  }

  if (font.SIZE) {
    style.fontSize = `${font.SIZE}px`;
  }

  if (font.BOLD === 'true') {
    style.fontWeight = 'bold';
  }

  if (font.ITALIC === 'true') {
    style.fontStyle = 'italic';
  }

  return style;
}

/**
 * 转换FreeMind边框样式到MindElixir样式
 */
function convertFreeMindEdge(edge: FreeMindEdge): any {
  const style: any = {};

  const width = edge.WIDTH || '1';
  const color = edge.COLOR || '#000000';
  const borderStyle = edge.STYLE || 'solid';

  style.border = `${width}px ${borderStyle} ${color}`;

  return style;
}

/**
 * 转换FreeMind节点样式到MindElixir样式
 */
function convertFreeMindNodeStyle(node: FreeMindNode): any {
  const style: any = {};

  // 文字颜色
  if (node.COLOR) {
    style.color = node.COLOR;
  }

  // 背景颜色
  if (node.BACKGROUND_COLOR) {
    style.background = node.BACKGROUND_COLOR;
  }

  // 字体样式
  if (node.font && node.font.length > 0) {
    const fontStyle = convertFreeMindFont(node.font[0]);
    Object.assign(style, fontStyle);
  }

  // 边框样式
  if (node.edge && node.edge.length > 0) {
    const edgeStyle = convertFreeMindEdge(node.edge[0]);
    Object.assign(style, edgeStyle);
  }

  // 云朵样式（可以转换为特殊的边框样式）
  if (node.cloud && node.cloud.length > 0) {
    const cloud = node.cloud[0];
    if (cloud.COLOR) {
      style.border = `2px dashed ${cloud.COLOR}`;
      style.borderRadius = '15px';
    }
  }

  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * 解码HTML实体
 */
function decodeHtmlEntities(text: string): string {
  // 解码常见的HTML实体
  return text
    // 数字实体 (如 &#28857; -> 点)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    // 十六进制实体 (如 &#x70B9; -> 点)
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // 常见命名实体
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ');
}

/**
 * 从HTML内容中提取纯文本
 */
function extractTextFromHtml(html: any): string {
  // 如果是字符串，直接处理
  if (typeof html === 'string') {
    // 移除HTML标签，保留文本内容
    let text = html
      .replace(/<[^>]*>/g, ' ') // 替换所有HTML标签为空格
      .replace(/\s+/g, ' ')     // 将多个空格合并为一个
      .trim();                  // 去除首尾空格

    // 解码HTML实体（如 &#28857; -> 点）
    text = decodeHtmlEntities(text);

    return text;
  }

  // 如果是对象，转换为JSON字符串后处理
  if (typeof html === 'object' && html !== null) {
    const htmlString = JSON.stringify(html);
    let text = htmlString
      .replace(/<[^>]*>/g, ' ')
      .replace(/[{}",]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 解码HTML实体
    text = decodeHtmlEntities(text);

    return text;
  }

  return '';
}

/**
 * 提取FreeMind节点的文本内容
 */
function extractNodeText(node: FreeMindNode): string {
  console.log("Extracting text from node:", node);

  // 优先使用TEXT属性
  if (node.TEXT) {
    console.log("Found TEXT attribute:", node.TEXT);
    return node.TEXT;
  }

  // 如果没有TEXT属性，尝试从richcontent中提取
  if (node.richcontent) {
    console.log("Looking for richcontent:", node.richcontent);

    // richcontent是单个对象，检查TYPE是否为NODE
    if (node.richcontent.TYPE === 'NODE') {
      // 从#text属性中提取HTML字符串
      if (node.richcontent['#text']) {
        console.log("Found richcontent #text:", node.richcontent['#text']);
        const text = extractTextFromHtml(node.richcontent['#text']);
        console.log("Extracted text from richcontent:", text);
        return text || 'Untitled';
      }
    }
  }

  console.log("No text found, using 'Untitled'");
  return 'Untitled';
}

/**
 * 提取FreeMind节点的注释内容
 */
function extractNodeNote(node: FreeMindNode): string | undefined {
  if (node.richcontent) {
    // richcontent是单个对象，检查TYPE是否为NOTE
    if (node.richcontent.TYPE === 'NOTE') {
      // 从#text属性中提取HTML字符串
      if (node.richcontent['#text']) {
        console.log("Found note richcontent #text:", node.richcontent['#text']);
        const noteText = extractTextFromHtml(node.richcontent['#text']);
        console.log("Extracted note text:", noteText);
        return noteText || undefined;
      }
    }
  }

  return undefined;
}

/**
 * 递归转换FreeMind节点到MindElixir节点
 */
function convertFreeMindNode(freemindNode: FreeMindNode): NodeObj {
  console.log("Converting FreeMind node:", freemindNode);

  const mindElixirNode: NodeObj = {
    id: freemindNode.ID || Math.random().toString(36).substring(2, 11),
    topic: extractNodeText(freemindNode),
  };

  console.log("Created MindElixir node:", mindElixirNode);

  // 转换样式
  const style = convertFreeMindNodeStyle(freemindNode);
  if (style) {
    mindElixirNode.style = style;
    console.log("Added style:", style);
  }

  // 转换注释
  const note = extractNodeNote(freemindNode);
  if (note) {
    mindElixirNode.note = note;
    console.log("Added note:", note);
  }

  // 转换超链接
  if (freemindNode.LINK) {
    mindElixirNode.hyperLink = freemindNode.LINK;
    console.log("Added hyperlink:", freemindNode.LINK);
  }

  // 转换折叠状态
  if (freemindNode.FOLDED) {
    mindElixirNode.expanded = freemindNode.FOLDED === 'false';
    console.log("Set folded state:", freemindNode.FOLDED, "expanded:", mindElixirNode.expanded);
  }

  // 转换图标为标签
  if (freemindNode.icon && freemindNode.icon.length > 0) {
    mindElixirNode.tags = freemindNode.icon.map(icon => icon.BUILTIN);
    console.log("Added tags:", mindElixirNode.tags);
  }

  // 转换子节点
  if (freemindNode.node && freemindNode.node.length > 0) {
    console.log("Converting child nodes:", freemindNode.node.length);
    mindElixirNode.children = freemindNode.node.map(childNode =>
      convertFreeMindNode(childNode)
    );
    console.log("Converted children:", mindElixirNode.children);
  } else {
    console.log("No child nodes found");
  }

  console.log("Final converted node:", mindElixirNode);
  return mindElixirNode;
}

/**
 * 转换FreeMind箭头链接到MindElixir箭头
 */
function convertFreeMindArrows(freemindNode: FreeMindNode): any[] {
  const arrows: any[] = [];

  function collectArrows(node: FreeMindNode, nodeId: string) {
    if (node.arrowlink) {
      node.arrowlink.forEach(arrow => {
        arrows.push({
          id: arrow.ID || Math.random().toString(36).substring(2, 11),
          from: nodeId,
          to: arrow.DESTINATION,
          label: '-',
          delta1: { x: 50, y: 50 },
          delta2: { x: 50, y: 50 },
        });
      });
    }

    if (node.node) {
      node.node.forEach(childNode => {
        const childId = childNode.ID || Math.random().toString(36).substring(2, 11);
        collectArrows(childNode, childId);
      });
    }
  }

  const rootId = freemindNode.ID || Math.random().toString(36).substring(2, 11);
  collectArrows(freemindNode, rootId);

  return arrows;
}

/**
 * 从FreeMind MM文件导入数据
 * @param file FreeMind MM文件对象
 * @returns Promise<MindElixirData> 返回转换后的MindElixir数据
 */
export async function importFreeMindFile(file: File): Promise<MindElixirData> {
  try {
    // 读取文件内容
    const text = await file.text();
    console.log("FreeMind file content:", text.substring(0, 500) + "...");

    // 解析XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "",
      textNodeName: "#text",
      parseAttributeValue: true,
      trimValues: true,
      alwaysCreateTextNode: false,
      // 停止解析richcontent内部的HTML内容，保留原始字符串
      stopNodes: ["*.richcontent"],
      isArray: (name) => {
        // 指定哪些元素应该始终作为数组处理，包括所有node
        return ['node', 'arrowlink', 'attribute', 'linktarget', 'cloud', 'edge', 'font', 'hook', 'icon'].includes(name);
      }
    });

    const xmlData = parser.parse(text);
    console.log("Parsed XML data:", xmlData);

    if (!xmlData.map) {
      throw new Error("Invalid FreeMind MM format: missing map element");
    }

    const freemindMap: FreeMindMap = xmlData.map;
    console.log("FreeMind map:", freemindMap);

    if (!freemindMap.node) {
      throw new Error("Invalid FreeMind MM format: missing root node");
    }

    console.log("Root node:", freemindMap.node);

    // 根节点始终是数组，取第一个元素
    const rootNodeData = freemindMap.node[0];
    console.log("Root node data (first element):", rootNodeData);

    // 转换为MindElixir格式
    const rootNode = convertFreeMindNode(rootNodeData);
    console.log("Converted root node:", rootNode);

    const mindElixirData: MindElixirData = {
      nodeData: rootNode,
      arrows: convertFreeMindArrows(rootNodeData),
      summaries: [], // FreeMind没有摘要功能
      theme: createFreeMindTheme()
    };

    console.log("Final MindElixir data:", mindElixirData);
    return mindElixirData;

  } catch (error) {
    console.error("Error importing FreeMind file:", error);
    throw error;
  }
}
