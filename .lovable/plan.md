# Исправление фильтрации и предпросмотра документов

## 1. Фильтрация: один выбор внутри группы, AND между группами

**Проблема:** `toggleFilter` позволяет выбрать несколько значений внутри одной группы, а старый `setExclusiveFilter` сбрасывал ВСЕ группы при выборе.

**Решение:**

**Файл: `src/lib/portal-context.tsx**` — исправить `setExclusiveFilter`:

- Сбрасывать только текущую группу, сохраняя остальные
- Если кликнули тот же пункт — снять выбор только в этой группе

```typescript
const setExclusiveFilter = (group: string, itemId: string) => {
  setActiveFilters((prev) => {
    const next = { ...prev };
    const current = prev[group];
    if (current && current.size === 1 && current.has(itemId)) {
      next[group] = new Set(); // снять выбор
    } else {
      next[group] = new Set([itemId]); // выбрать один
    }
    return next;
  });
};
```

**Файл: `src/components/portal/PortalSidebar.tsx**` — использовать `setExclusiveFilter` вместо `toggleFilter`:

- Деструктуризация: заменить `toggleFilter` на `setExclusiveFilter`
- `handleItemClick` вызывает `setExclusiveFilter(group, itemId)`

Результат: выбор "ВЧНГ" в проектах + "Водитель" в ролях = два активных фильтра, AND-логика в `filteredDocs` уже работает корректно.

---

## 2. Предпросмотр файла внутри портала (iframe)

**Файл: `src/pages/portal/DocumentPage.tsx**` — заменить кнопку "Открыть файл" на встроенный предпросмотр:

- Определить тип файла по URL:
  - PDF: показать в `<iframe src={url}>` напрямую
  - DOCX/XLSX/PPTX: показать в `<iframe src={gviewUrl}>`
  - Остальное: fallback-ссылка "Открыть в новой вкладке"
- iframe: `w-full h-[600px] rounded-lg border border-gray-200 mb-6`
- Кнопка "Открыть файл" остается как дополнительная опция под iframe
  &nbsp;
  Show iframe only if fileUrl is not empty.
  If fileUrl is empty — show message 
  «Файл не прикреплён» text-gray-400 text-center py-8
  instead of iframe.
  &nbsp;

---

## 3. Скачивание с санитайзом имени файла

**Файл: `src/pages/portal/DocumentPage.tsx**` и `src/pages/portal/DocumentListPage.tsx`**:

Добавить функцию санитайза:

```typescript
const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
    .replace(/\s+/g, "_")
    .substring(0, 200)
    .replace(/^\.+/, "_") || "document";
};
```

В `handleDownload` использовать `sanitizeFilename(filename)` перед присвоением `a.download`.

---

## Технические детали

### Порядок изменений

1. `src/lib/portal-context.tsx` — исправить `setExclusiveFilter` (строки 192-206)
2. `src/components/portal/PortalSidebar.tsx` — использовать `setExclusiveFilter` (строки 27, 45-46)
3. `src/pages/portal/DocumentPage.tsx` — добавить iframe-предпросмотр + санитайз
4. `src/pages/portal/DocumentListPage.tsx` — добавить санитайз в handleDownload