

# Исправление имени скачиваемого файла

## Диагноз

Две проблемы мешают работе:

### 1. Published-сайт не обновлён
Изменения с `buildDownloadFilename` уже есть в preview-коде, но published-версия (atsporthub-welcome.lovable.app) по-прежнему содержит старый код. Нужна публикация.

### 2. CORS fallback теряет имя файла
Файлы хранятся на внешнем домене (`hombyvzvkdqwjwjnxdlx.supabase.co`). Если `fetch()` завершается ошибкой CORS, срабатывает `catch`, который вызывает `window.open(url, "_blank")` -- и браузер использует техническое имя из URL (`1770981518740-fqseqjex.docx`).

Даже если fetch проходит успешно, некоторые браузеры могут игнорировать `a.download` для blob из cross-origin ресурсов.

## Что нужно сделать

### Шаг 1: Усилить catch-ветку в handleDownload (2 файла)

**Файлы:**
- `src/pages/portal/DocumentPage.tsx`
- `src/pages/portal/DocumentListPage.tsx`

**Изменения в handleDownload:**

В `catch`-ветке вместо `window.open(url, "_blank")` создавать `<a>` с `download`-атрибутом и прямой ссылкой. Это даст браузеру подсказку об имени файла даже при прямом переходе:

```typescript
const handleDownload = async (url: string, title?: string, docId?: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = buildDownloadFilename(title, docId, url);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 100);
  } catch {
    // Fallback: direct link with download hint
    const a = document.createElement("a");
    a.href = url;
    a.download = buildDownloadFilename(title, docId, url);
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};
```

Ключевое отличие: в `catch` мы теперь тоже используем `<a download="...">` вместо `window.open()`. Для cross-origin ссылок браузер может проигнорировать `download`, но это лучше, чем `window.open` без подсказки вообще.

### Шаг 2: Добавить проверку res.ok

В try-ветке добавить `if (!res.ok) throw new Error(...)` чтобы HTTP-ошибки (403, 404) тоже попадали в fallback.

### Шаг 3: Опубликовать

После правок опубликовать текущую версию, чтобы изменения появились на atsporthub-welcome.lovable.app.

## Технические детали

- Затрагиваемые файлы: 2 (DocumentPage.tsx, DocumentListPage.tsx)
- Объём изменений: замена catch-ветки + добавление res.ok проверки в каждом файле
- Не затрагиваются: PortalSidebar.tsx, portal-context.tsx, bpium-api edge function
- `buildDownloadFilename`, `sanitizeFilename`, `getExtensionFromUrl` уже на месте -- их менять не нужно

