

## Проблема

Счётчики показывают правильные данные, но логика подсчёта "Новых за месяц" использует неправильное поле:

- **"На согласовании" = 0** — корректно: в Bpium сейчас нет документов со статусом `["2"]`. Все 34 — со статусом `["3"]` (Утверждён), остальные 7 — черновики/отклонённые.
- **"Новых за месяц" = 0** — используется поле `date` (поле 16, "Дата внесения"), которое заполняется вручную и у большинства документов стоит февраль 2026. Нужно использовать `createdAt` — автоматическую дату создания записи в Bpium.

## Решение

### `src/lib/portal-context.tsx` — изменить подсчёт "Новых за месяц"

Заменить `d.date` на `d.createdAt` в блоке подсчёта статистики:

```typescript
// Было:
if (d.date) {
  const dt = new Date(d.date);
  if (dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()) newThisMonth++;
}

// Станет:
const dateStr = d.createdAt || d.date;
if (dateStr) {
  const dt = new Date(dateStr);
  if (dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear()) newThisMonth++;
}
```

Поле `createdAt` уже приходит в ответе API (строка 617 edge function: `createdAt: r.createdAt`), менять бэкенд не нужно.

**Итого**: 1 файл, 3 строки изменений.

