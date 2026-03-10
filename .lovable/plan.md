

## План: Исправить FILE_URL на поле 3 и упростить extractFileUrl

### Суть проблемы
Файл документа находится в поле `3` Bpium, но `BPIUM_FIELDS.FILE_URL` указывает на `'11'` (пустое поле). Из-за этого `doc.fileUrl` приходит пустым, и фронтенд использует костыль — фоллбэк на `doc.responsible`.

### Изменения (3 файла)

**1. `supabase/functions/bpium-api/index.ts`**
- Изменить `FILE_URL: '11'` → `FILE_URL: '3'`
- В `summarize` fallback-блоке убрать проверку `RESPONSIBLE` — теперь `FILE_URL` уже указывает на правильное поле

**2. `src/lib/portal-context.tsx` — `extractFileUrl()`**
- Убрать фоллбэк на `doc.responsible` — теперь `doc.fileUrl` будет содержать файл напрямую

**3. `src/pages/DirectorDashboard.tsx` — локальный `extractFileUrl()`**
- Та же чистка: убрать фоллбэк на `doc.responsible`

### Результат
`doc.fileUrl` будет корректно заполнен из поля 3. Саммари и кнопка "Открыть файл" будут работать без костылей.

