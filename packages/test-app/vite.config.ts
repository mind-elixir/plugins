import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@mind-elixir/import-xmind': path.resolve(__dirname, '../import-xmind/src/index.ts'),
      '@mind-elixir/import-freemind': path.resolve(__dirname, '../import-freemind/src/index.ts'),
      '@mind-elixir/open-desktop': path.resolve(__dirname, '../open-desktop/src/index.ts'),
      '@mind-elixir/export-mindmap': path.resolve(__dirname, '../export-mindmap/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: [
      '@mind-elixir/import-xmind',
      '@mind-elixir/import-freemind',
      '@mind-elixir/open-desktop',
      '@mind-elixir/export-mindmap',
    ],
  },
  server: {
    port: 3001,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
