// FreeMind MM格式的类型定义，基于Freemind.xsd

/**
 * FreeMind地图的根元素
 */
export interface FreeMindMap {
  version: string;
  node: FreeMindNode[];
}

/**
 * FreeMind节点
 */
export interface FreeMindNode {
  // 必需属性
  TEXT?: string;
  
  // 可选属性
  BACKGROUND_COLOR?: string;
  COLOR?: string;
  FOLDED?: 'true' | 'false';
  ID?: string;
  LINK?: string;
  POSITION?: 'left' | 'right';
  STYLE?: string;
  CREATED?: number;
  MODIFIED?: number;
  HGAP?: number;
  VGAP?: number;
  VSHIFT?: number;
  ENCRYPTED_CONTENT?: string;
  
  // 子元素
  arrowlink?: FreeMindArrowLink[];
  attribute?: FreeMindAttribute[];
  attribute_layout?: FreeMindAttributeLayout[];
  linktarget?: FreeMindLinkTarget[];
  cloud?: FreeMindCloud[];
  edge?: FreeMindEdge[];
  font?: FreeMindFont[];
  hook?: FreeMindHook[];
  icon?: FreeMindIcon[];
  node?: FreeMindNode[];
  richcontent?: FreeMindRichContent;
}

/**
 * 箭头链接
 */
export interface FreeMindArrowLink {
  COLOR?: string;
  DESTINATION: string;
  ENDARROW?: string;
  ENDINCLINATION?: string;
  ID?: string;
  STARTARROW?: string;
  STARTINCLINATION?: string;
}

/**
 * 链接目标
 */
export interface FreeMindLinkTarget {
  COLOR?: string;
  SOURCE: string;
  DESTINATION: string;
  ENDARROW?: string;
  ENDINCLINATION?: string;
  ID?: string;
  STARTARROW?: string;
  STARTINCLINATION?: string;
}

/**
 * 云朵样式
 */
export interface FreeMindCloud {
  COLOR?: string;
}

/**
 * 边框样式
 */
export interface FreeMindEdge {
  COLOR?: string;
  STYLE?: string;
  WIDTH?: string;
}

/**
 * 字体样式
 */
export interface FreeMindFont {
  BOLD?: 'true';
  ITALIC?: 'true' | 'false';
  NAME: string;
  SIZE: number;
}

/**
 * 钩子/插件
 */
export interface FreeMindHook {
  NAME: string;
  Parameters?: FreeMindParameters;
  text?: FreeMindText;
}

/**
 * 参数
 */
export interface FreeMindParameters {
  REMINDUSERAT?: number;
  ORIGINAL_ID?: string;
  XML_STORAGE_MAP_LAT?: string;
  XML_STORAGE_MAP_LON?: string;
  XML_STORAGE_MAP_TOOLTIP_LOCATION?: string;
  XML_STORAGE_POS_LAT?: string;
  XML_STORAGE_POS_LON?: string;
  XML_STORAGE_TILE_SOURCE?: string;
  XML_STORAGE_ZOOM?: string;
  CLONE_ID?: string;
  CLONE_IDS?: string;
  CLONE_ITSELF?: string;
}

/**
 * 文本节点
 */
export interface FreeMindText {
  // 空的复杂类型，用于节点注释
}

/**
 * 图标
 */
export interface FreeMindIcon {
  BUILTIN: string;
}

/**
 * 属性
 */
export interface FreeMindAttribute {
  NAME: string;
  VALUE: string;
}

/**
 * 属性布局
 */
export interface FreeMindAttributeLayout {
  NAME_WIDTH: number;
  VALUE_WIDTH?: number;
}

/**
 * HTML内容 - 可以是解析后的对象或原始字符串
 */
export type FreeMindHtml = {
  // 任何有效的XML内容，但应该是XHTML
  [key: string]: any;
} | string;

/**
 * 富文本内容
 */
export interface FreeMindRichContent {
  TYPE: 'NODE' | 'NOTE';
  '#text': string; // XML解析器生成的HTML文本内容
}
