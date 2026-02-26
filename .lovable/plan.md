
## Динамические ссылки в PortalBreadcrumb

Одно изменение в файле `src/components/portal/PortalBreadcrumb.tsx`.

### Что меняется

**Строка 14** -- расширить `useParams` и добавить `basePath`:

```tsx
// Было:
const { docId } = useParams<{ docId: string }>();
const { docs } = usePortal();

const isDocPage = !!docId && location.pathname.includes("/doc/");

// Стало:
const { docId, roleName } = useParams<{ docId?: string; roleName?: string }>();
const { docs } = usePortal();

const basePath = roleName
  ? `/role/${encodeURIComponent(roleName)}`
  : `/dashboard/director`;

const isDocPage = !!docId && location.pathname.includes("/doc/");
```

**Строка 29** -- ссылка «Главная»:
```tsx
// Было:
<Link to="/dashboard/director">Главная</Link>
// Стало:
<Link to={basePath}>Главная</Link>
```

**Строка 39** -- ссылка «Все документы»:
```tsx
// Было:
<Link to="/dashboard/director">Все документы</Link>
// Стало:
<Link to={basePath}>Все документы</Link>
```

Больше ничего не меняется.
