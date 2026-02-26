

## Переиспользование портала директора для ролей сотрудников

### Обзор

Портал директора (`PortalLayout` + `DocumentListPage` + `DocumentPage`) будет переиспользован для экранов сотрудников `/role/:roleName`. Минимум изменений: 4 файла, 0 новых файлов.

### Изменения по файлам

#### 1. src/App.tsx
- Удалить старый маршрут `<Route path="/role/:roleName" element={<RolePage />} />`
- Добавить новый вложенный маршрут:
```
<Route path="/role/:roleName" element={<PortalLayout />}>
  <Route index element={<DocumentListPage />} />
  <Route path="doc/:docId" element={<DocumentPage />} />
</Route>
```

#### 2. src/components/portal/PortalLayout.tsx
- Импортировать `useParams` и `Link` из react-router-dom
- Читать `roleName` из `useParams()`
- **Авторизация**: проверку `director_auth` выполнять только если `roleName` отсутствует (т.е. маршрут директора). Для `/role/:roleName` -- пропускать без пароля
- **Шапка**: передать `roleName` в `PortalHeader`. Если `roleName` есть -- вместо "Генеральный директор" + кнопки "Выйти" показать декодированное имя роли и ссылку "К выбору роли" на `/`
- **Приветствие**: скрыть блок welcome для сотрудников (только для директора)

#### 3. src/lib/portal-context.tsx
- `PortalProvider` принимает необязательный проп `roleName?: string`
- После загрузки `filterOptions` (в useEffect): если `roleName` задан, найти в `filterOptions.roles` элемент с `name` совпадающим с `roleName` (декодированным) и вызвать `setExclusiveFilter("roles", id)`
- Добавить отдельный `useEffect` зависящий от `filterOptions` и `roleName`

#### 4. src/components/portal/PortalSidebar.tsx
- Принимать проп `roleName?: string` или читать из useParams
- Если `roleName` задан -- скрыть группу фильтров "По ролям" (`key === "roles"`) из списка `FILTER_GROUPS`
- Остальные группы (проекты, направления, источники) и кнопка "Спросить ИИ" остаются

### Технические детали

- `roleName` из URL приходит закодированным (например `%D0%92%D0%BE%D0%B4%D0%B8%D1%82%D0%B5%D0%BB%D1%8C`), react-router декодирует автоматически через `useParams()`
- Передача `roleName` в `PortalProvider` через проп из `PortalLayout`, а не через `useParams` внутри контекста (контекст не находится внутри Route, поэтому useParams там не сработает)
- `RolePage.tsx` остается в проекте, просто не используется в маршрутах
