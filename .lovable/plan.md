# Портал знаний АТС — полный редизайн навигации

## Обзор

Превращаем плоский дашборд с фильтрами в полноценный портал знаний с постоянным боковым меню (Sidebar) в стиле GitBook и отдельной страницей просмотра документа.

## Архитектура

```text
/dashboard/director
  +-- KnowledgePortal (layout с sidebar)
       |
       +-- Sidebar (постоянная навигация)
       |     - Все документы
       |     - Проекты (submenu: список проектов)
       |     - Направления (submenu: список направлений)
       |     - По ролям (submenu: список ролей)
       |     - Источники (submenu: список источников)
       |
       +-- Content area (правая часть)
             - /dashboard/director — Stats + Document list
             - /dashboard/director/doc/:docId — Страница документа
```

## Новые файлы

### 1. `src/lib/portal-context.tsx` — общий контекст данных

Хранит загруженные docs, filterOptions, chipCounts, activeFilters, searchQuery, toggleFilter.
Оборачивает весь портал, чтобы данные не перезагружались при навигации.

- `PortalProvider` — загружает данные один раз (useEffect с fetchAction)
- `usePortal()` — хук для доступа к данным из любого компонента
- Все состояния (docs, filterOptions, activeFilters, searchQuery) живут здесь

### 2. `src/components/portal/PortalSidebar.tsx` — боковое меню

Использует Shadcn Sidebar компоненты:

- `SidebarGroup` "Все документы" — ссылка на `/dashboard/director`
- `SidebarGroup` "Проекты" — раскрывающийся список из `filterOptions.projects`
- `SidebarGroup` "Направления" — из `filterOptions.directions`
- `SidebarGroup` "По ролям" — из `filterOptions.roles`
- `SidebarGroup` "Источники" — из `filterOptions.source`

Клик по пункту submenu:

- Вызывает `toggleFilter(group, itemId)` из контекста
- Устанавливает ТОЛЬКО этот фильтр (сбрасывает остальные в этой группе)
- Навигирует на `/dashboard/director` если на другой странице
- Активный пункт подсвечивается через проверку `activeFilters`

Стили: минималистичные, bg-white, текст серый, активный — text-[#0099ff], иконка-счетчик документов справа от каждого пункта.

### 3. `src/components/portal/PortalLayout.tsx` — обертка layout

```text
<PortalProvider>
  <SidebarProvider>
    <div className="min-h-screen flex w-full">
      <PortalSidebar />
      <SidebarInset>
        <header>...</header>
        <Outlet />
      </SidebarInset>
    </div>
  </SidebarProvider>
</PortalProvider>
```

Header с "АТС Портал", SidebarTrigger, "Генеральный директор", кнопка "Выйти".

### 4. `src/pages/portal/DocumentListPage.tsx` — список документов

Берет данные из `usePortal()`. Содержит:

- Stats row (4 карточки с border-l-4)
- Search input
- Фильтр-чипы (текущие активные, с кнопкой x для удаления)
- GitBook-стиль список документов (как сейчас, но каждая строка — ссылка на `/dashboard/director/doc/:docId`)

### 5. `src/pages/portal/DocumentPage.tsx` — страница документа

Получает docId из URL params, находит документ в `usePortal().docs`.

Макет:

```text
+------------------------------------------+
| <- Назад к списку                        |
|                                          |
| ЗАГОЛОВОК ДОКУМЕНТА (text-2xl font-bold) |
|                                          |
| Статус: [badge]   Дата: 01.01.2025      |
| Версия: 1.0                             |
|                                          |
| Направления: БДД, Экология              |
| Роли: Водитель, Механик                 |
| Проекты: Проект А                       |
| Источник: Внутренний                     |
|                                          |
| [Открыть файл]  [Скачать]               |
+------------------------------------------+
```

- Кнопка "Открыть" — открывает файл в новой вкладке
- Кнопка "Скачать" — скачивает файл (download attribute)
- Метаданные отображаются как key-value пары с серыми лейблами
- Стиль: max-w-3xl, много воздуха (py-8, gap-6)

## Изменения в существующих файлах

### `src/App.tsx` — новые маршруты

```text
<Route path="/dashboard/director" element={<PortalLayout />}>
  <Route index element={<DocumentListPage />} />
  <Route path="doc/:docId" element={<DocumentPage />} />
</Route>
```

Удаляется текущий `<Route path="/dashboard/director" element={<DirectorDashboard />} />`.

### `src/pages/DirectorDashboard.tsx`

Файл больше не используется как самостоятельная страница. Логика (fetchAction, STATUS_MAP, formatDate, extractLinkedNames, extractFileUrl, FILTER_GROUPS) переносится в контекст и утилиты. Сам файл можно удалить или оставить как deprecated.

## Сохранение состояния при навигации

- Все данные (docs, filters, search) живут в `PortalProvider` (React Context)
- При переходе "список -> документ -> назад" фильтры и поиск сохраняются
- Sidebar всегда видна и отражает текущие активные фильтры
- Мобильная версия: sidebar скрывается, доступна через SidebarTrigger (hamburger)

## Стилистика GitBook

- Шрифт: Inter (уже используется), спокойные размеры text-sm / text-base
- Цвета: серая гамма для текста, синий #0099ff только для акцентов и активных элементов
- Много whitespace: py-8, px-6, gap-6
- Документ-строки: border-b border-gray-100, hover:bg-gray-50
- Sidebar: bg-white, text-gray-600, hover:text-[#0099ff], активный: font-medium text-[#0099ff]

Move these functions AS-IS to portal-context.tsx, 

do not rewrite them:

- extractLinkedNames(arr) 

- extractFileUrl(doc)

- STATUS_MAP

- formatDate(dateStr)

Field mapping in get-documents stays unchanged in Edge Function.

Password protection logic from DirectorLogin.tsx 

must remain — PortalLayout checks sessionStorage 

for 'director_auth' before rendering, 

redirects to /login/director if missing.

activeFilters in PortalProvider must be 

Record<string, Set<string>> — do not convert to arrays.

toggleFilter uses Set.add/delete.

&nbsp;

## Порядок реализации

1. Создать `src/lib/portal-context.tsx` (контекст с данными)
2. Создать `src/components/portal/PortalSidebar.tsx`
3. Создать `src/components/portal/PortalLayout.tsx`
4. Создать `src/pages/portal/DocumentListPage.tsx`
5. Создать `src/pages/portal/DocumentPage.tsx`
6. Обновить `src/App.tsx` — новые маршруты
7. Удалить или пометить deprecated `src/pages/DirectorDashboard.tsx`