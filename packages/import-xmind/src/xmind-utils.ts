// get xmind data from .xmind file
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import type {
  Sheet,
  Topic,
  Style,
  Theme as XMindTheme,
} from "./types/xmind-model";
import MindElixir, {
  type MindElixirData,
  type NodeObj,
  type Theme as MindElixirTheme,
} from "mind-elixir";

/**
 * 转换XMind样式属性到MindElixir样式
 *
 * XMind中常见的样式属性：
 * - fo:color: 文字颜色
 * - fo:font-size: 字体大小
 * - fo:font-weight: 字体粗细 (normal, bold)
 * - fo:font-family: 字体族
 * - fo:text-decoration: 文字装饰 (underline, line-through)
 * - svg:fill: 填充颜色（背景色）
 * - svg:stroke: 边框颜色
 * - svg:width: 宽度
 * - border-line-width: 边框宽度
 * - border-line-color: 边框颜色
 * - border-line-style: 边框样式 (solid, dashed, dotted)
 * - background-color: 背景颜色（另一种表示方式）
 *
 * @param xmindStyle XMind的样式对象
 * @returns MindElixir的样式对象
 */
function convertStyle(xmindStyle: Style): NodeObj["style"] {
  const properties = xmindStyle.properties;
  const style: NodeObj["style"] = {};

  // 文字颜色
  if (properties["fo:color"]) {
    style.color = properties["fo:color"];
  }

  // 字体大小
  if (properties["fo:font-size"]) {
    style.fontSize = properties["fo:font-size"];
  }

  // 字体粗细
  if (properties["fo:font-weight"]) {
    style.fontWeight = properties["fo:font-weight"];
  }

  // 字体族
  if (properties["fo:font-family"]) {
    style.fontFamily = properties["fo:font-family"];
  }

  // 背景颜色 - XMind可能使用多种属性名
  const backgroundColor =
    properties["svg:fill"] ||
    properties["background-color"] ||
    properties["fill"];
  if (backgroundColor) {
    style.background = backgroundColor;
  }

  // 边框样式
  const borderWidth = properties["border-line-width"];
  const borderColor =
    properties["border-line-color"] || properties["svg:stroke"] || "#000000";
  const borderStyle = properties["border-line-style"] || "solid";

  if (borderWidth) {
    style.border = `${borderWidth} ${borderStyle} ${borderColor}`;
  }

  // 文字装饰（下划线、删除线等）
  if (properties["fo:text-decoration"]) {
    style.textDecoration = properties["fo:text-decoration"];
  }

  // 节点宽度
  if (properties["svg:width"]) {
    style.width = properties["svg:width"];
  }

  // 如果没有任何样式属性，返回undefined
  return Object.keys(style).length > 0 ? style : undefined;
}

/**
 * 转换XMind主题到MindElixir主题
 * @param xmindTheme XMind的主题对象
 * @returns MindElixir的主题对象
 */
export function convertTheme(xmindTheme: XMindTheme): MindElixirTheme {
  // 创建基础主题结构
  const theme: MindElixirTheme = {
    name: xmindTheme.title || xmindTheme.id || "Custom Theme",
    palette: [
      "#3498db",
      "#e74c3c",
      "#2ecc71",
      "#f39c12",
      "#9b59b6",
      "#1abc9c",
      "#34495e",
      "#e67e22",
    ], // 默认调色板
    cssVar: MindElixir.THEME.cssVar,
  };

  // 从XMind主题中提取颜色信息
  if (xmindTheme.centralTopic?.properties) {
    const centralProps = xmindTheme.centralTopic.properties;
    if (centralProps["svg:fill"]) {
      theme.cssVar["--root-bgcolor"] = centralProps["svg:fill"];
    }
    if (centralProps["fo:color"]) {
      theme.cssVar["--root-color"] = centralProps["fo:color"];
    }
  }

  if (xmindTheme.mainTopic?.properties) {
    const mainProps = xmindTheme.mainTopic.properties;
    if (mainProps["svg:fill"]) {
      theme.cssVar["--main-bgcolor"] = mainProps["svg:fill"];
    }
    if (mainProps["fo:color"]) {
      theme.cssVar["--main-color"] = mainProps["fo:color"];
    }
  }

  if (xmindTheme.subTopic?.properties) {
    const subProps = xmindTheme.subTopic.properties;
    if (subProps["svg:fill"]) {
      theme.cssVar["--bgcolor"] = subProps["svg:fill"];
    }
    if (subProps["fo:color"]) {
      theme.cssVar["--color"] = subProps["fo:color"];
    }
  }

  return theme;
}

/**
 * 将XML格式的XMind数据转换为JSON格式
 * @param xmlText XML文本内容
 * @returns 转换后的Sheet数组
 */
function convertXMLToJson(xmlText: string): Sheet[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    textNodeName: "#text",
    parseAttributeValue: true,
    trimValues: true,
    alwaysCreateTextNode: false,
  });

  const xmlData = parser.parse(xmlText);
  const xmapContent = xmlData["xmap-content"];

  if (!xmapContent || !xmapContent.sheet) {
    throw new Error("Invalid XMind XML format");
  }

  // 处理单个sheet或多个sheet的情况
  const sheets = Array.isArray(xmapContent.sheet)
    ? xmapContent.sheet
    : [xmapContent.sheet];

  return sheets.map((xmlSheet: any) => convertXMLSheetToJSON(xmlSheet));
}

/**
 * 将XML格式的Sheet转换为JSON格式
 */
function convertXMLSheetToJSON(xmlSheet: any): Sheet {
  const sheet: Sheet = {
    id: xmlSheet.id || "",
    title: xmlSheet.title || "Sheet",
    rootTopic: convertXMLTopicToJSON(xmlSheet.topic),
    style: xmlSheet.style || { id: "", type: "", properties: {} },
    topicPositioning: xmlSheet["topic-positioning"] || "",
    topicOverlapping: xmlSheet["topic-overlapping"] || "",
    theme: xmlSheet.theme || { id: "", title: "" },
    relationships: [],
    legend: xmlSheet.legend || {
      visibility: "visible",
      position: { x: 0, y: 0 },
      markers: {},
      groups: {},
    },
    settings: xmlSheet.settings || {
      "infoItems/infoItem": [],
      "tab-color": [],
    },
  };

  // 处理关系连线
  if (xmlSheet.relationships && xmlSheet.relationships.relationship) {
    const relationships = Array.isArray(xmlSheet.relationships.relationship)
      ? xmlSheet.relationships.relationship
      : [xmlSheet.relationships.relationship];

    sheet.relationships = relationships.map((rel: any) => ({
      id: rel.id || "",
      title: rel.title || "",
      style: rel.style || { id: "", type: "", properties: {} },
      class: rel.class || "",
      end1Id: rel.end1 || "",
      end2Id: rel.end2 || "",
      controlPoints:
        rel["control-points"] && rel["control-points"]["control-point"]
          ? {
              "0": {
                x:
                  rel["control-points"]["control-point"][0]?.position?.[
                    "svg:x"
                  ] || 0,
                y:
                  rel["control-points"]["control-point"][0]?.position?.[
                    "svg:y"
                  ] || 0,
              },
              "1": {
                x:
                  rel["control-points"]["control-point"][1]?.position?.[
                    "svg:x"
                  ] || 0,
                y:
                  rel["control-points"]["control-point"][1]?.position?.[
                    "svg:y"
                  ] || 0,
              },
            }
          : undefined,
    }));
  }

  return sheet;
}

/**
 * 将XML格式的Topic转换为JSON格式
 */
function convertXMLTopicToJSON(xmlTopic: any): Topic {
  const topic: Topic = {
    id: xmlTopic.id || "",
    title: xmlTopic.title["#text"] || xmlTopic.title,
    style: xmlTopic.style,
    class: xmlTopic.class,
    position: xmlTopic.position,
    structureClass: xmlTopic["structure-class"],
    branch: xmlTopic.branch,
    width: xmlTopic.width,
    labels: xmlTopic.labels,
    numbering: xmlTopic.numbering,
    href: xmlTopic.href,
    image: xmlTopic.image,
    markers: xmlTopic.markers,
    boundaries: xmlTopic.boundaries,
    extensions: xmlTopic.extensions,
  };

  // 处理notes
  if (xmlTopic.notes) {
    topic.notes = {
      plain: { content: xmlTopic.notes.plain || "" },
      html: xmlTopic.notes.html || { content: { paragraphs: [] } },
    };
  }

  // 处理children
  if (xmlTopic.children && xmlTopic.children.topics) {
    topic.children = {};

    // 处理不同类型的topics
    if (Array.isArray(xmlTopic.children.topics)) {
      // 多个topics组
      xmlTopic.children.topics.forEach((topicsGroup: any) => {
        const type = topicsGroup.type || "attached";
        if (topicsGroup.topic) {
          const topics = Array.isArray(topicsGroup.topic)
            ? topicsGroup.topic
            : [topicsGroup.topic];
          topic.children![type] = topics.map((t: any) =>
            convertXMLTopicToJSON(t)
          );
        }
      });
    } else {
      // 单个topics组
      const topicsGroup = xmlTopic.children.topics;
      const type = topicsGroup.type || "attached";
      if (topicsGroup.topic) {
        const topics = Array.isArray(topicsGroup.topic)
          ? topicsGroup.topic
          : [topicsGroup.topic];
        topic.children[type] = topics.map((t: any) => convertXMLTopicToJSON(t));
      }
    }
  }

  // 处理summaries
  if (xmlTopic.summaries && xmlTopic.summaries.summary) {
    const summaries = Array.isArray(xmlTopic.summaries.summary)
      ? xmlTopic.summaries.summary
      : [xmlTopic.summaries.summary];

    topic.summaries = summaries.map((summary: any) => ({
      id: summary.id || "",
      style: summary.style || { id: "", type: "", properties: {} },
      class: summary.class || "",
      range: summary.range || "",
      topicId: summary["topic-id"] || "",
    }));
  }

  return topic;
}

/**
 * 从XMind文件中导入并获取节点数据
 * @param file XMind文件对象
 * @returns Promise<Sheet[]> 返回解析后的Sheet数组，每个Sheet代表一个思维导图
 */
export async function importXMindFile(file: File): Promise<Sheet[]> {
  try {
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();

    // 使用JSZip解压文件
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(arrayBuffer);
    console.log(zipContent);

    const contentFile = zipContent.file("content.json");
    if (!contentFile) {
      // 尝试读取XML格式
      const xmlFile = zipContent.file("content.xml");
      if (!xmlFile) {
        throw new Error("No content.json or content.xml found in XMind file");
      }
      const xmlText = await xmlFile.async("text");
      console.log("Found XML content, converting to JSON format...");

      // 转换XML为JSON格式
      const sheets = convertXMLToJson(xmlText);
      return sheets;
    }

    // 读取content.json的内容并解析为JSON
    const contentText = await contentFile.async("text");
    const content: Sheet[] = JSON.parse(contentText);

    return content;
  } catch (error) {
    console.error("Error importing XMind file:", error);
    throw error;
  }
}

function convertTopic(
  summaries: MindElixirData["summaries"],
  xmindTopic: Topic,
  meTopic: NodeObj
) {
  meTopic.id = xmindTopic.id || Math.random().toString(36).substring(2, 11);
  meTopic.topic = xmindTopic.title;
  if (xmindTopic.notes?.plain.content)
    meTopic.note = xmindTopic.notes?.plain.content;

  // 转换样式
  if (xmindTopic.style) {
    meTopic.style = convertStyle(xmindTopic.style);
  }

  // 是否折叠
  if (xmindTopic.branch) {
    meTopic.expanded = xmindTopic.branch === "folded" ? false : true;
  }

  // 处理标签
  if (xmindTopic.labels) {
    // XMind的labels是字符串，需要转换为数组
    if (typeof xmindTopic.labels === "string") {
      meTopic.tags = xmindTopic.labels.split(",").map((label) => label.trim());
    } else {
      const labels = xmindTopic.labels as any;
      if (labels.label) meTopic.tags = [labels.label];
      else meTopic.tags = labels;
    }
  }

  // 处理超链接
  if (xmindTopic.href) {
    meTopic.hyperLink = xmindTopic.href;
  }

  // 处理图片
  if (xmindTopic.image) {
    meTopic.image = {
      url: xmindTopic.image.src,
      width: xmindTopic.image.width,
      height: xmindTopic.image.height,
      fit: "contain", // 默认适配方式
    };
  }
  if (xmindTopic.summaries) {
    for (let i = 0; i < xmindTopic.summaries.length; i++) {
      const summary = xmindTopic.summaries[i];
      // debugger;
      xmindTopic.children?.["summary"].find((summaryTopic) => {
        if (summaryTopic.id === summary.topicId) {
          // summary.range 格式为 (start,end)，提取start和end
          const start = parseInt(summary.range.split(",")[0].substring(1));
          const end = parseInt(
            summary.range
              .split(",")[1]
              .substring(0, summary.range.split(",")[1].length - 1)
          );

          const meSummary = {
            id: summary.id,
            label: summaryTopic.title,
            start,
            end,
            parent: meTopic.id,
          };
          summaries!.push(meSummary);
        }
      });
    }
  }
  if (xmindTopic.children?.["attached"]) {
    const attached = xmindTopic.children.attached;
    meTopic.children = [];
    for (let i = 0; i < attached.length; i++) {
      const child = attached[i];
      const meChild = {} as NodeObj;
      convertTopic(summaries, child, meChild);
      meTopic.children.push(meChild);
    }
  }
}

export function convertXmindToMindElixir(data: Sheet): MindElixirData {
  const mindElixirData: MindElixirData = {
    nodeData: {} as NodeObj,
    arrows: [],
    summaries: [],
  };

  const collectSummaries: MindElixirData["summaries"] = [];

  // 转换节点数据
  convertTopic(collectSummaries, data.rootTopic, mindElixirData.nodeData);
  // debugger
  // 转换关系箭头
  if (data.relationships) {
    mindElixirData.arrows = data.relationships.map((relationship) => {
      return {
        id: relationship.id,
        from: relationship.end1Id,
        to: relationship.end2Id,
        label: relationship.title || "-",
        delta1: relationship.controlPoints
          ? relationship.controlPoints["0"]
          : { x: 50, y: 50 },
        delta2: relationship.controlPoints
          ? relationship.controlPoints["1"]
          : { x: 50, y: 50 },
      };
    });
  }

  // 转换摘要
  mindElixirData.summaries = collectSummaries;

  // 转换主题
  // if (data.theme) {
  //   mindElixirData.theme = convertTheme(data.theme);
  // }

  // 设置方向
  if (data.topicPositioning) {
    // XMind的topicPositioning可能包含方向信息
    // 这里可以根据具体需求进行映射
    mindElixirData.direction = 2; // 默认为SIDE模式
  }

  return mindElixirData;
}
