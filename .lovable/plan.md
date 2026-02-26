
## Динамические ссылки на документы

Два изменения для корректной навигации в режиме сотрудника.

### 1. DocumentListPage.tsx (строка 156)

`useParams` и `roleName` уже импортированы и читаются (строка 70). Нужно только обновить ссылку:

**Строка 156** -- заменить:
```
to={`/dashboard/director/doc/${doc.id}`}
```
на:
```
to={roleName
  ? `/role/${encodeURIComponent(roleName)}/doc/${doc.id}`
  : `/dashboard/director/doc/${doc.id}`
}
```

### 2. DocumentPage.tsx (строки 80, 207, 217)

**Строка 80** -- добавить `roleName` в деструктуризацию useParams:
```
const { docId, roleName } = useParams<{ docId: string; roleName?: string }>();
```

**Строка 207** -- заменить navigate для prevDoc:
```
navigate(roleName
  ? `/role/${encodeURIComponent(roleName)}/doc/${prevDoc.id}`
  : `/dashboard/director/doc/${prevDoc.id}`
)
```

**Строка 217** -- аналогично для nextDoc:
```
navigate(roleName
  ? `/role/${encodeURIComponent(roleName)}/doc/${nextDoc.id}`
  : `/dashboard/director/doc/${nextDoc.id}`
)
```

Больше ничего не меняется.
