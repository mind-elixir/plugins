import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'ImportMarkdown',
      formats: ['es', 'umd'],
      fileName: format => `index.${format === 'es' ? 'js' : 'umd.cjs'}`,
    },
    rollupOptions: {
      external: ['mind-elixir', 'unified', 'remark-parse', 'remark-gfm', 'remark-rehype', 'rehype-stringify'],
      output: {
        globals: {
          'mind-elixir': 'MindElixir',
          unified: 'unified',
          'remark-parse': 'remarkParse',
          'remark-gfm': 'remarkGfm',
          'remark-rehype': 'remarkRehype',
          'rehype-stringify': 'rehypeStringify',
        },
      },
    },
  },
})
