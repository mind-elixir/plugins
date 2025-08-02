/// <reference types="vite/client" />

// Vite specific module declarations
declare module '*?raw' {
  const content: string
  export default content
}

declare module '*?url' {
  const src: string
  export default src
}

declare module '*?inline' {
  const src: string
  export default src
}