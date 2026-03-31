

## План: Обновить домен Bpium и ID каталога пользователей

### Что меняем

**1. `supabase/functions/bpium-api/index.ts`**

- Заменить хардкод `BASE_URL = 'https://neiroresheniya.bpium.ru'` на динамическое чтение из секрета `BPIUM_DOMAIN`:
  ```typescript
  const BPIUM_DOMAIN = Deno.env.get('BPIUM_DOMAIN') || 'ats.bpium.ru';
  const BASE_URL = `https://${BPIUM_DOMAIN}`;
  ```

- В объекте `CATALOG` добавить `USERS: 'users'` (вместо хардкода `64`):
  ```typescript
  const CATALOG = {
    DOCUMENTS: '56',
    ROLES: '57',
    PROJECTS: '54',
    DIRECTIONS: '55',
    SOURCES: '59',
    USERS: 'users',
  } as const;
  ```

- Заменить все вхождения `catalogs/64` на `catalogs/${CATALOG.USERS}` (2 места: поиск пользователей и обновление last_login).

**2. `docs/PROJECT_KNOWLEDGE.md`** — обновить домен и ID каталога пользователей.

### Секрет `BPIUM_DOMAIN`
Уже существует в проекте. Убедитесь, что его значение = `ats.bpium.ru` (без `https://`). Если нет — обновим.

### Файлы
```text
Изменённые:
  supabase/functions/bpium-api/index.ts  — динамический домен + CATALOG.USERS
  docs/PROJECT_KNOWLEDGE.md              — актуальные данные
```

