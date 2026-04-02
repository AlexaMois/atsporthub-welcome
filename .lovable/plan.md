

## Проблема

Кнопка «Открыть файл» вызывает `window.open(fileUrl, "_blank")` — открывает прямую ссылку на файл из Bpium. Сервер Bpium отдаёт файл с заголовком `Content-Disposition: attachment`, поэтому браузер скачивает файл вместо отображения.

## Решение

Для PDF и Office-файлов открывать не прямую ссылку, а веб-просмотрщик:

- **PDF** → Google Docs Viewer: `https://docs.google.com/viewer?url=ENCODED_URL&embedded=false`
- **Office (docx, xlsx, pptx)** → тот же Google Docs Viewer (он поддерживает Office-форматы)
- **Остальные файлы** → `window.open(url, "_blank")` как сейчас (fallback)

## Изменения

### 1. `src/utils/fileUtils.ts` — новая функция `openFileInViewer`

```ts
export const openFileInViewer = (url: string): void => {
  if (isPdfUrl(url) || isOfficeUrl(url)) {
    window.open(
      `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`,
      "_blank"
    );
  } else {
    window.open(url, "_blank");
  }
};

export const isPdfUrl = (url: string): boolean => /\.pdf(\?|$)/i.test(url);
export const isOfficeUrl = (url: string): boolean => /\.(docx?|xlsx?|pptx?)(\?|$)/i.test(url);
```

### 2. `src/pages/portal/DocumentPage.tsx` — использовать `openFileInViewer`

Заменить `window.open(fileUrl, "_blank")` в кнопке «Открыть файл» на `openFileInViewer(fileUrl)`.

Также обновить кнопку в `OfficeViewer` error fallback.

### 3. `src/components/portal/OfficeViewer.tsx` — fallback-кнопка «Открыть»

Заменить `window.open(url, "_blank")` на `openFileInViewer(url)`.

Итого: 3 файла, минимальные изменения. Файл всегда будет открываться для просмотра в Google Docs Viewer в новой вкладке.

