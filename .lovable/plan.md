

## Plan: Fix document viewer auto-load issues and test all documents

### Problem Analysis

From the code review, I found the root cause of "auto-download/auto-open" behavior:

1. **PdfViewer auto-loads on desktop** — `manualLoad` is only `true` on mobile (`useState(isMobile)`). On desktop, PDF files start loading immediately when the document page opens, which can look like an unwanted auto-download/open.

2. **OfficeViewer iframe can trigger downloads** — The Google Docs Viewer iframe loads automatically once the user clicks "Загрузить предпросмотр", but for some file types (or when Google can't render them), the iframe may trigger a browser download instead of displaying content.

3. **Files with unrecognized extensions** — Files that don't match `.pdf` or `.docx/.xlsx/.pptx` show "Предпросмотр недоступен" but the `window.open()` in "Открыть файл" may still trigger auto-download depending on the server's Content-Disposition header.

### Changes

#### 1. PdfViewer — add manual load on desktop too
- Change `useState(isMobile)` to `useState(true)` so ALL users (desktop + mobile) must click "Загрузить предпросмотр PDF" before the PDF starts loading.

#### 2. OfficeViewer — increase timeout, improve error handling
- The 8-second timeout is aggressive. Increase to 15 seconds.
- Ensure the iframe uses `sandbox` attribute to prevent unexpected navigations/downloads.

#### 3. Browser testing
- After applying fixes, use the browser to navigate through documents and verify:
  - "Открыть файл" opens in a new tab
  - "Скачать" triggers download
  - "Предыдущий/Следующий" navigates correctly
  - Preview loads only on button click
  - AI Summary button works

### Files to modify
- `src/components/portal/PdfViewer.tsx` — force manual load for all devices
- `src/components/portal/OfficeViewer.tsx` — increase timeout, add iframe sandbox

### Technical details

**PdfViewer.tsx** line 24:
```typescript
// Before:
const [manualLoad, setManualLoad] = useState(isMobile);
// After:
const [manualLoad, setManualLoad] = useState(true);
```

**OfficeViewer.tsx** — increase timeout from 8000 to 15000ms, add `sandbox="allow-scripts allow-same-origin"` to iframe to prevent unwanted downloads.

