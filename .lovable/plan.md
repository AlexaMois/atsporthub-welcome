

## План: Исправить вход + всё через Bpium

### Проблема
Вход не работает из-за одной критической ошибки: `src/lib/config.ts` указывает на **старый** проект (`hvsighjpcycwoqpmuvga`), а Edge Function развёрнута на **текущем** (`piivkjefugxyagwxriok`). Все запросы уходят в никуда.

Дополнительно: CORS не пропускает preview-домен, секреты не совпадают по именам.

### Что уже идёт через Bpium (и это правильно)
- Авторизация по телефону → каталог 64 (Пользователи АТС)
- Документы → каталог 56
- Фильтры (роли, проекты, направления, источники) → каталоги 57, 54, 55, 59
- Кеш саммари → поле SUMMARY_CACHE в каталоге 56

### Исправления

**1. `src/lib/config.ts`** — убрать хардкод, взять URL из env
```typescript
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const FUNC_URL = `${SUPABASE_URL}/functions/v1/bpium-api`;
```

**2. `supabase/functions/bpium-api/index.ts`** — CORS
- Добавить паттерн `*.lovable.app` в проверку origin (regex)
- Добавить preview-домен в `ALLOWED_ORIGINS`

**3. `supabase/functions/bpium-api/index.ts`** — секрет пароля
- Заменить `Deno.env.get('DIRECTOR_PASSWORD')` на `Deno.env.get('VITE_DIRECTOR_PASSWORD')` (этот секрет уже настроен)

**4. Добавить секрет `JWT_SECRET`** через инструмент секретов — без него токены подписываются пустой строкой

### Итого файлы

```text
Изменённые:
  src/lib/config.ts                      — env вместо хардкода
  supabase/functions/bpium-api/index.ts  — CORS + имя секрета пароля

Секреты:
  JWT_SECRET — добавить (новый)
```

