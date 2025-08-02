import { MindElixirInstance } from "mind-elixir";
import { convertToHtml } from "./html";
import { convertToMd } from "./markdown";
import { domToPng, domToJpeg, domToWebp } from "@ssshooter/modern-screenshot";

const methodMap = {
  png: domToPng,
  jpeg: domToJpeg,
  webp: domToWebp,
};

export const downloadImage = async (
  mei: MindElixirInstance,
  format: "png" | "jpeg" | "webp"
) => {
  const tmp = mei.scaleVal;
  mei.map.style.transition = "none";
  mei.scale(1);
  const dataUrl = await methodMap[format](mei.nodes, {
    onCloneNode: (node) => {
      const n = node as HTMLDivElement;
      n.style.position = "";
      n.style.top = "";
      n.style.left = "";
      n.style.bottom = "";
      n.style.right = "";
    },
    onCreateForeignObjectSvg: (svg) => {
      svg.style.cssText = `background:${mei.theme.cssVar["--bgcolor"]};`;
    },
    padding: 300,
    quality: format === "png" ? 1 : 0.7,
  });
  const link = document.createElement("a");
  link.download = mei.nodeData.topic + "." + format;
  link.href = dataUrl;
  link.click();
  mei.map.style.transition = "transform 0.3s";
  mei.scale(tmp);
};

export const downloadHtml = (mei: MindElixirInstance) => {
  const data = mei.getData();
  const html = convertToHtml(data);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = mei.nodeData.topic + ".html";
  link.href = url;
  link.click();
};

export const downloadJson = (mei: MindElixirInstance) => {
  const data = mei.getData();
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = mei.nodeData.topic + ".json";
  link.href = url;
  link.click();
};

export const downloadMarkdown = (mei: MindElixirInstance) => {
  const data = mei.getData();
  const md = convertToMd(data.nodeData);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = mei.nodeData.topic + ".md";
  link.href = url;
  link.click();
};

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
];

export { convertToHtml, convertToMd };
