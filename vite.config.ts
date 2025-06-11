import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'ImportXmind',
      // the proper extensions will be added
      fileName: 'import-xmind',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['jszip', 'fast-xml-parser', 'mind-elixir'],
    },
  },
  plugins: [dts()]
})