# Исправление фильтрации, файлов и адаптивности

## 1. Комбинированная фильтрация (sidebar)

**Проблема:** `PortalSidebar` вызывает `setExclusiveFilter()`, который сбрасывает ВСЕ группы и ставит только один фильтр. Нужно использовать `toggleFilter()`.

**Решение:**

**Файл: `src/components/portal/PortalSidebar.tsx**`

- Заменить `setExclusiveFilter` на `toggleFilter` в деструктуризации `usePortal()`
- В `handleItemClick` вызывать `toggleFilter(group, itemId)` вместо `setExclusiveFilter(group, itemId)`

Это позволит выбрать "ВЧНГ" в проектах, затем "Водитель" в ролях — оба тега останутся активными, и документы отфильтруются по связке "проект И роль".

---

## 2. Открытие и скачивание файлов

**Проблема:** Поле `fileUrl` приходит как пустой массив `[]`. Реальная ссылка на файл берётся из `doc.responsible[0].url` (fallback в `extractFileUrl`). URL ведут на публичный бакет Supabase — PDF открывается нормально, но `.docx` браузер не умеет отображать, показывая пустую страницу.

**Решение:**

**Файл: `src/pages/portal/DocumentPage.tsx**`

- Для кнопки "Открыть файл": если файл `.docx`/`.doc`/`.xlsx`/`.pptx`, открывать через Google Docs Viewer:
`https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
- Для PDF/изображений — открывать напрямую (`window.open`)
- Для кнопки "Скачать": добавить fetch + blob-download, чтобы гарантировать скачивание вместо навигации

**Файл: `src/pages/portal/DocumentListPage.tsx**`

- Аналогичная логика для иконки скачивания в строке документа

---

## 3. Мобильная адаптивность (проверка)

Текущая реализация уже использует `SidebarProvider` + `SidebarTrigger` (гамбургер в header). По документации Shadcn Sidebar, на мобильных (`< 768px`) sidebar автоматически скрывается и открывается как sheet. Дополнительных изменений не требуется — нужно только протестировать.

---

## Технические детали

### Изменение 1: `src/components/portal/PortalSidebar.tsx`

Строка 27: заменить `setExclusiveFilter` на `toggleFilter`:

```typescript
const { filterOptions, activeFilters, toggleFilter, clearFilters, chipCounts } = usePortal();
```

Строка 45-46: заменить вызов:

```typescript
const handleItemClick = (group: string, itemId: string) => {
  toggleFilter(group, itemId);
  if (!isDocListPage) navigate("/dashboard/director");
};
```

### Изменение 2: `src/pages/portal/DocumentPage.tsx`

Добавить helper-функцию для определения типа файла и выбора стратегии открытия:

```typescript
const getViewUrl = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.match(/\.(docx?|xlsx?|pptx?)(\?|$)/)) {
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
};

const handleDownload = async (url: string, filename?: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename || url.split("/").pop() || "document";
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
};
```

Обновить кнопки:

- "Открыть файл" — `window.open(getViewUrl(fileUrl), "_blank")`
- "Скачать" — `onClick={handleDownload(fileUrl, doc.title)}`

### Изменение 3: `src/pages/portal/DocumentListPage.tsx`

Аналогичная логика `handleDownload` для иконки скачивания в строке документа (вместо простого `window.open`).

// Неправильно — вызовется сразу при рендере:

onClick={handleDownload(fileUrl, doc.title)}

// Правильно — обернуть в стрелочную функцию:

onClick={() => handleDownload(fileUrl, doc.title)}

&nbsp;

### Порядок

1. Исправить sidebar (toggleFilter) — 1 файл
2. Исправить файлы (DocumentPage + DocumentListPage) — 2 файла
3. Протестировать на мобильном viewport