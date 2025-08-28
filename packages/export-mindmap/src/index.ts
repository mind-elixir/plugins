import { MindElixirInstance } from "mind-elixir";
import { convertToHtml } from "./html";
import { convertToMd } from "./markdown";
import { domToBlob, Options } from "@ssshooter/modern-screenshot";

export const downloadUrl = async (url: string, fileName: string) => {
  const link = document.createElement("a");
  link.download = fileName;
  link.href = url;
  link.click();
};

export const exportImage = async (
  mei: MindElixirInstance,
  format: "png" | "jpeg" | "webp",
  options?: Options
) => {
  const tmp = mei.scaleVal;
  mei.map.style.transition = "none";
  mei.scale(1);
  const blob = await domToBlob(mei.nodes, {
    type: "image/" + format,
    onCloneNode: (node) => {
    },
    onCreateForeignObjectSvg: (svg) => {
      svg.style.cssText = `background:${mei.theme.cssVar["--bgcolor"]};`;
    },
    padding: 300,
    quality: format === "png" ? 1 : 0.7,
    ...options,
  });
  mei.map.style.transition = "transform 0.3s";
  mei.scale(tmp);
  return URL.createObjectURL(blob);
};

export const downloadImage = async (
  mei: MindElixirInstance,
  format: "png" | "jpeg" | "webp"
) => {
  const url = await exportImage(mei, format);
  downloadUrl(url, mei.nodeData.topic + "." + format);
};

export const exportHtml = (mei: MindElixirInstance) => {
  const data = mei.getData();
  const html = convertToHtml(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  return url;
};

export const downloadHtml = (mei: MindElixirInstance) => {
  const url = exportHtml(mei);
  downloadUrl(url, mei.nodeData.topic + ".html");
};

export const exportJson = (mei: MindElixirInstance) => {
  const data = mei.getData();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  return url;
};

export const downloadJson = (mei: MindElixirInstance) => {
  const url = exportJson(mei);
  downloadUrl(url, mei.nodeData.topic + ".json");
};

export const exportMarkdown = (mei: MindElixirInstance) => {
  const data = mei.getData();
  const md = convertToMd(data.nodeData);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  return url;
};

export const downloadMarkdown = (mei: MindElixirInstance) => {
  const url = exportMarkdown(mei);
  downloadUrl(url, mei.nodeData.topic + ".md");
};

export const exportMethodList = [
  {
    type: "HTML",
    export: exportHtml,
  },
  {
    type: "JSON",
    export: exportJson,
  },
  {
    type: "PNG",
    export(mei: MindElixirInstance, options?: Options) {
      return exportImage(mei, "png", options);
    },
  },
  {
    type: "JPEG",
    export(mei: MindElixirInstance, options?: Options) {
      return exportImage(mei, "jpeg", options);
    },
  },
  {
    type: "WEBP",
    export(mei: MindElixirInstance, options?: Options) {
      return exportImage(mei, "webp", options);
    },
  },
  {
    type: "Markdown",
    export: exportMarkdown,
  },
] as const;

export const downloadMethodList = [
  {
    type: "HTML",
    download: downloadHtml,
  },
  {
    type: "JSON",
    download: downloadJson,
  },
  {
    type: "PNG",
    download(mei: MindElixirInstance) {
      downloadImage(mei, "png");
    },
  },
  {
    type: "JPEG",
    download(mei: MindElixirInstance) {
      downloadImage(mei, "jpeg");
    },
  },
  {
    type: "WEBP",
    download(mei: MindElixirInstance) {
      downloadImage(mei, "webp");
    },
  },
  {
    type: "Markdown",
    download: downloadMarkdown,
  },
] as const;

export { convertToHtml, convertToMd, type Options as ImageOptions };
