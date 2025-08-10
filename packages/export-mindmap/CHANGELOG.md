# @mind-elixir/download-file

## 0.0.5

### Minor Changes

- All export functions now return blob URLs

## 0.0.4

### Minor Changes

- Refactor export functions to separate export and download logic
  - `exportImage`, `exportHtml`, `exportJson`, `exportMarkdown` now return URLs instead of directly downloading
  - Original download functions (`downloadImage`, `downloadHtml`, `downloadJson`, `downloadMarkdown`) still work as before
- Add `downloadUrl` utility function for unified download handling
- Add `exportMethodList` array providing a unified interface for all export methods

## 0.0.2

### Patch Changes

- first release
