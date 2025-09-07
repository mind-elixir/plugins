import { MindElixirData, Options } from 'mind-elixir'
import MindElixir from 'mind-elixir/lite?raw'
import style from 'mind-elixir/style.css?raw'

export interface HtmlExportOptions extends Options {
  customCss?: string;
}

const generateHtml = (js: string, data: string, options?: HtmlExportOptions) => {
  const { customCss = '', ...mindElixirConfig } = options || {};
  
  const defaultConfig = {
    el: '#mind-elixir',
    editable: false,
    draggable: false,
    contextMenu: false,
    mouseSelectionButton: 2
  };
  
  const finalConfig = { ...defaultConfig, ...mindElixirConfig };
  
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>MindElixir</title>
        <style>html, body {margin: 0;padding: 0;}#mind-elixir{width:100vw;height:100vh;}</style>
        <style>${style}</style>
        ${customCss ? `<style>${customCss}</style>` : ''}
    </head>
    <body>
        <script>${js}</script>
        <div id="mind-elixir"></div>
        <script>
            const data = ${data}
            const mindElixir = new MindElixirLite(${JSON.stringify(finalConfig)})
            mindElixir.init(data)
            </script>
    </body>
    </html>`
}

export function convertToHtml(data: MindElixirData, options?: HtmlExportOptions) {
  const dataStr = JSON.stringify(data)
  return generateHtml(MindElixir, dataStr, options)
}
