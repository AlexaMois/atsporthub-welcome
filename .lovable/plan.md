

# Безопасное извлечение name в Edge Function

## Что будет сделано

В файле `supabase/functions/bpium-api/index.ts`:

1. Добавить вспомогательную функцию `extractName` в начало файла (после констант), которая безопасно извлекает строковое значение из поля Bpium (массив или строка):

```text
const extractName = (val: any): string => {
  if (!val) return '';
  if (Array.isArray(val)) return String(val[0] || '');
  return String(val);
};
```

2. Заменить `name: r.values?.['1']` на `name: extractName(r.values?.['1'])` в четырёх actions:
   - `get-roles`
   - `get-projects`
   - `get-directions`
   - `get-sources`

3. Добавить `console.log('Sample record values:', JSON.stringify(records[0]?.values))` перед маппингом в каждом из четырёх actions для отладки.

## Файл для изменения

- `supabase/functions/bpium-api/index.ts`

