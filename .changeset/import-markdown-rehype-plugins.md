---
'@mind-elixir/import-markdown': minor
---

新增 `rehypePlugins` 选项，用于把宿主插件注入 hast 阶段。

此前 `transformHtml` 只能拿到序列化完成的 HTML 字符串，无法表达必须在语法树上完成的处理。VSCode 侧的 `rehype-highlight`（代码高亮，webview 注入 `public/hljs.css` 上色）正属于这一类，缺少这个接入口就只能在迁移时丢掉该能力。

插件链顺序与 VSCode 插件原先手工拼装的一致：`remark-rehype` → `rehypePlugins` → `imageSize` → `rehype-stringify`。processor 按次构造，同一插件实例可跨调用复用。
