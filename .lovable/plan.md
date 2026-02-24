

# Edge Function bpium-api и интеграция с дашбордом

## 1. Новый файл: `supabase/functions/bpium-api/index.ts`

Edge function с двумя действиями, проксирующая запросы к Bpium API.

- CORS-заголовки на все ответы (включая OPTIONS preflight)
- Basic Auth через секреты `BPIUM_LOGIN` и `BPIUM_PASSWORD`
- Параметр `?action=` определяет действие:

**action=get-documents**
- GET `https://neiroresheniya.bpium.ru/api/catalogs/56/records`
- Маппинг полей: id, title (values['2']), responsible (values['3']), date (values['4']), source (values['5']), directions (values['6']), roles (values['7']), projects (values['8']), status (values['12']), version (values['13'])

**action=get-roles**
- GET `https://neiroresheniya.bpium.ru/api/catalogs/57/records`
- Маппинг: id, name (values['1'])

## 2. Конфигурация: `supabase/config.toml`

Добавить секцию:
```text
[functions.bpium-api]
verify_jwt = false
```

## 3. Изменения: `src/pages/DirectorDashboard.tsx`

- Импорт `useEffect` и `supabase` клиента
- Добавить состояния: `loading` (boolean), `stats` (динамические счётчики)
- При монтировании (`useEffect`) вызвать `supabase.functions.invoke('bpium-api', { body: { action: 'get-documents' } })` (через query param в URL или body)
- Рассчитать:
  - «Всего документов» = data.length
  - «Утверждено» = фильтр по status включающему '3'
  - «На согласовании» и «Новых за месяц» = 0 и 5 (fallback, пока нет логики)
- При ошибке — fallback значения: 34, 34, 0, 5
- Спиннер (компонент Skeleton или Loader2 из lucide) пока loading === true

## Технические детали

- Секреты `BPIUM_LOGIN` и `BPIUM_PASSWORD` уже настроены в проекте
- Edge function вызывается через `supabase.functions.invoke()` — не по прямому URL
- `verify_jwt = false` — функция публичная, авторизация к Bpium через Basic Auth на стороне сервера
