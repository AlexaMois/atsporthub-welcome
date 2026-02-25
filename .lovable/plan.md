# Финальные доработки: фильтры, предпросмотр, скачивание

Текущее состояние

- Sidebar — уже использует setExclusiveFilter (строка 46). Корректно.

- DocumentPage iframe — уже есть iframe с getViewUrl (строки 114-119). Работает для PDF и Office.

- Скачивание — единственная реальная проблема: <a> не добавляется 

  в DOM и revokeObjectURL вызывается сразу после click(), что может 

  не сработать в некоторых браузерах.

Промпт для Lovable (Edit Mode)

─────────────────────────────

Fix handleDownload in 2 files to ensure cross-browser compatibility:

src/pages/portal/DocumentPage.tsx (lines 33-45) — replace handleDownload:

[код]

src/pages/portal/DocumentListPage.tsx (lines 25-37):

Apply the exact same fix to the handleDownload function there.

Do NOT touch: PortalSidebar.tsx, DocumentPage.tsx iframe, portal-context.tsx.

─────────────────────────────

Что НЕ меняется

- PortalSidebar.tsx — уже корректно использует setExclusiveFilter

- DocumentPage.tsx iframe — уже на месте с getViewUrl для PDF/Office

- portal-context.tsx — setExclusiveFilter уже работает правильно

Объём: 2 файла, по 3 строки в каждом.

&nbsp;