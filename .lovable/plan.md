

## План: PDF-рендер без Google Viewer + умное кеширование саммари

### 1. PDF — прямой рендер через react-pdf

**Проблема:** Сейчас PDF показывается через `<iframe src={url}>`, а DOCX/XLSX — через Google Viewer, который часто блокируется X-Frame-Options.

**Решение:**
- Установить `react-pdf` (обёртка над pdf.js) — рендерит PDF нативно в React без iframe
- Для PDF: заменить iframe на компонент `<Document><Page /></Document>` из react-pdf с пагинацией
- Для DOCX/XLSX: убрать Google Viewer iframe, оставить только кнопки «Открыть» и «Скачать» (надёжный просмотр Office-файлов в браузере без серверной конвертации невозможен)

**Файлы:**
- `package.json` — добавить `react-pdf`
- `src/components/portal/PdfViewer.tsx` — новый компонент: загрузка PDF, постраничный просмотр, кнопки «назад/вперёд»
- `src/pages/portal/DocumentPage.tsx` — заменить iframe-блок: PDF → `<PdfViewer>`, Office → сообщение + кнопки

### 2. Умное кеширование саммари с хешем файла

**Проблема:** Текущий кеш — просто строка в поле Bpium. Если файл обновился, кеш не инвалидируется.

**Решение:** Сохранять в `SUMMARY_CACHE` JSON с `{ summary, fileHash, generatedAt, model }`. При запросе саммари:
1. Скачать файл, вычислить SHA-256 хеш
2. Прочитать кеш из Bpium, распарсить JSON
3. Если `fileHash` совпадает и `force !== true` — вернуть кеш
4. Иначе — сгенерировать новое саммари, сохранить с новым хешем

**Файл:** `supabase/functions/bpium-api/index.ts` — переработать блок `summarize`:
- Добавить функцию `calculateFileHash` (crypto.subtle.digest SHA-256)
- Перенести чтение кеша ПОСЛЕ скачивания файла (нужен хеш для сравнения)
- Сохранять JSON вместо строки
- На фронте: показывать `cached: true` / `generatedAt` в UI (опционально)

### Итого

```text
Новые файлы:
  src/components/portal/PdfViewer.tsx    — React PDF viewer с пагинацией

Изменённые файлы:
  package.json                           — + react-pdf
  src/pages/portal/DocumentPage.tsx      — PDF→PdfViewer, Office→без iframe
  supabase/functions/bpium-api/index.ts  — хеш-кеширование саммари
```

