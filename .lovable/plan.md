

## План: Чистка дублей и мусора (11 пунктов)

### 1. Дубль маршрута `/login`
**App.tsx** — удалить `<Route path="/" element={<LoginPage />} />`, оставить `/login`. Добавить `<Route path="/" element={<Navigate to="/login" replace />} />`.

### 2. `basePath` — вынести в хук
Создать `src/hooks/useBasePath.ts`:
```ts
export function useBasePath() {
  const { pathname } = useLocation();
  return pathname.startsWith("/portal") ? "/portal" : "/dashboard/director";
}
```
Заменить дублированную логику в 4 файлах: `DocumentListPage.tsx`, `DocumentPage.tsx`, `PortalBreadcrumb.tsx`, `PortalSidebar.tsx`.

### 3. `LinkedObj` — один экспорт
Удалить дубль `interface LinkedObj` из `DocumentListPage.tsx`. Экспортировать из `portal-context.tsx`, импортировать где нужно.

### 4. `fetchAction` → `apiCall`
В `portal-context.tsx` удалить локальную `fetchAction`, заменить 5 вызовов на `apiCall` из `@/lib/api.ts`. Адаптировать: `apiCall` возвращает `ApiResult`, поэтому обращаться к `.data`.

### 5. `SUPABASE_PROJECT_ID` — удалить неиспользуемый экспорт
Из `src/lib/config.ts` убрать строку `export const SUPABASE_PROJECT_ID = ...`. Из `.env.example` убрать `VITE_SUPABASE_PROJECT_ID`.

### 6. `CHECKLIST = '19'` — задокументировать
Добавить комментарий `// reserved for future "ознакомление" feature` в Edge Function, не удалять.

### 7. `VITE_DIRECTOR_PASSWORD` → `DIRECTOR_PASSWORD`
В `supabase/functions/bpium-api/index.ts` (строка 223): заменить `Deno.env.get('VITE_DIRECTOR_PASSWORD')` на `Deno.env.get('DIRECTOR_PASSWORD')`. Создать новый секрет `DIRECTOR_PASSWORD` со значением из старого.

### 8. `roleNameParam` — удалить мёртвый параметр
В `PortalLayout.tsx`: убрать `useParams<{ roleName?: string }>()` и связанную переменную `roleNameParam`. Пропс `roleName` для `PortalProvider` вычислять только из `userRoles`.

### 9. Lock-файлы — оставить один
Удалить `bun.lock` и `package-lock.json`, оставить `bun.lockb`.

### 10. `supabase/.temp` — в `.gitignore`
Добавить `supabase/.temp/` в `.gitignore`.

### 11. `verify-user` — поиск по телефону через Bpium query
Вместо `count=500` (загрузка всех пользователей) использовать Bpium API фильтрацию:
```
POST /api/v1/catalogs/users/records
{ "filters": { "phone": { "$contains": normalizedPhone } }, "count": 5 }
```
Это уменьшит нагрузку и ускорит вход.

---

### Файлы

```text
Новые:
  src/hooks/useBasePath.ts

Изменённые:
  src/App.tsx                              — редирект / → /login
  src/lib/config.ts                        — удалить SUPABASE_PROJECT_ID
  src/lib/portal-context.tsx               — экспорт LinkedObj, fetchAction → apiCall
  src/pages/portal/DocumentListPage.tsx    — useBasePath, убрать LinkedObj
  src/pages/portal/DocumentPage.tsx        — useBasePath
  src/components/portal/PortalBreadcrumb.tsx — useBasePath
  src/components/portal/PortalSidebar.tsx  — useBasePath
  src/components/portal/PortalLayout.tsx   — убрать roleNameParam
  supabase/functions/bpium-api/index.ts    — DIRECTOR_PASSWORD, CHECKLIST комментарий, verify-user query
  .env.example                             — убрать VITE_SUPABASE_PROJECT_ID
  .gitignore                               — добавить supabase/.temp/

Удаляемые:
  bun.lock
  package-lock.json

Секреты:
  Добавить DIRECTOR_PASSWORD (значение = текущий VITE_DIRECTOR_PASSWORD)
```

