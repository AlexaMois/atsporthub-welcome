
# Добавить счётчик документов в фильтр-чипы

## Что изменится
В каждом фильтр-чипе рядом с названием появится число документов в скобках, например: **Водитель (12)**, **БДД (5)**.

## Технические детали

### Файл: `src/pages/DirectorDashboard.tsx`

**1. Добавить `chipCounts` (useMemo)** — после блока `stats` (строка ~140):

```typescript
const chipCounts = useMemo(() => {
  const counts: Record<string, number> = {};
  docs.forEach(doc => {
    ['roles', 'projects', 'directions', 'source'].forEach(field => {
      const arr = doc[field];
      if (Array.isArray(arr)) {
        arr.forEach((o: any) => {
          const key = `${field}:${o.recordId}`;
          counts[key] = (counts[key] || 0) + 1;
        });
      }
    });
  });
  return counts;
}, [docs]);
```

**2. Изменить текст чипа** (строка 231):

```text
Было:   {item.name}
Стало:  {item.name} ({chipCounts[`${g.key}:${item.id}`] || 0})
```

Никаких других изменений не вносится.
