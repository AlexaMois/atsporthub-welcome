# GitBook-архитектура портала АТС

Полная переработка архитектуры фронтенда: добавление боковой навигации, страницы просмотра документа с PDF-viewer, упрощение типографики и разделение интерфейса директора/сотрудника.

## Обзор изменений

```text
БЫЛО:
/ (выбор роли) -> /dashboard/director (плоский список)

СТАНЕТ:
/ (выбор роли) -> /dashboard/director (sidebar + список + страница документа)
                -> /role/:roleName (sidebar + список, БЕЗ метрик)

Sidebar навигация:
+------------------+------------------------------------+
| Все документы    | Список документов / Страница док-та |
| Проекты >        |                                    |
| Направления >    |                                    |
| По ролям >       |                                    |
| Источники >      |                                    |
+------------------+------------------------------------+
```

## Шаг 1. Общий Layout с Sidebar

### Новый файл: `src/components/DocumentLayout.tsx`

Обертка с `SidebarProvider` + `Sidebar` + `main`. Используется и для директора, и для сотрудника.

- Sidebar содержит 5 навигационных секций: "Все документы", "Проекты", "Направления", "По ролям", "Источники"
- Каждая секция — `SidebarGroup` с раскрывающимся списком элементов (загружаются из API)
- Клик по элементу устанавливает фильтр (не переход по URL)
- На мобильном — sidebar скрывается в Sheet (стандартное поведение shadcn Sidebar)
- Header остается сверху с `SidebarTrigger`

### Новый файл: `src/components/DocumentSidebar.tsx`

Компонент sidebar с навигацией. Принимает `filterOptions`, `activeFilters`, `onFilterSelect`, `role` (для условного отображения).

Структура sidebar:

- "Все документы" — сброс фильтров
- Проекты — список проектов из API, клик = установка фильтра по проекту
- Направления — аналогично
- По ролям — аналогично
- Источники — аналогично
- Активный элемент подсвечивается `bg-muted text-primary`

## Шаг 2. Страница документа

### Новый файл: `src/pages/DocumentPage.tsx`

Маршрут: `/document/:docId`

При клике на документ в списке — переход на эту страницу (вместо скачивания).

Содержимое:

- Кнопка "Назад" к списку
- Заголовок документа — `text-2xl font-bold` с воздухом
- Метаданные: дата, версия, статус (badge), ответственный
- Две кнопки: "Открыть в браузере" + "Скачать" — крупные, заметные
- Предпросмотр: если URL содержит `.pdf` — `<iframe src={url}>` как PDF viewer; если другая ссылка — `<iframe src={url}>` для просмотра
- Связанные документы (будущее расширение — пока placeholder)

## Шаг 3. Обновление DirectorDashboard

### Файл: `src/pages/DirectorDashboard.tsx`

- Оборачивается в `DocumentLayout`
- Метрики (stats) остаются ТОЛЬКО для директора
- Список документов: клик по строке ведет на `/document/:docId` (через `navigate`)
- Убираем hover-download (теперь скачивание на странице документа)
- Типографика:
  - Заголовок строки: `text-base` (было `text-sm`)
  - Межстрочное: `py-5` (было `py-4`)
  - Дата и метаинфо: `text-sm text-gray-400` с отступом `mt-2`
  - Убираем лишние бейджи ролей из строк (оставляем только статус)
  - Больше воздуха: `space-y-1` между элементами строки

## Шаг 4. Экран сотрудника (RolePage)

### Файл: `src/pages/RolePage.tsx`

- Оборачивается в тот же `DocumentLayout`
- БЕЗ метрик (stats) — чистый список документов
- Sidebar фильтры работают так же
- Документы фильтруются по выбранной роли автоматически
- Клик по документу ведет на `/document/:docId`

## Шаг 5. Маршрутизация

### Файл: `src/App.tsx`

Добавить маршрут:

```
/document/:docId -> DocumentPage
```

## Шаг 6. Типографика и стиль (везде)

- Заголовки документов: `text-base font-medium` (крупнее)
- Подписи: `text-sm text-gray-400` (мягче)
- Убрать лишние рамки — минимум `border`, максимум `border-b` для разделителей
- Межстрочный интервал: `leading-relaxed`
- Отступы между строками: `py-5`
- Поиск: остается, но с увеличенным `h-12` и `text-base`

## Технические детали

### Новые файлы (4):

1. `src/components/DocumentLayout.tsx` — layout wrapper с SidebarProvider
2. `src/components/DocumentSidebar.tsx` — sidebar навигация
3. `src/pages/DocumentPage.tsx` — страница просмотра документа
4. `src/hooks/useDocuments.ts` — вынос логики загрузки данных в shared hook (используется и директором, и сотрудником)

### Изменяемые файлы (3):

1. `src/App.tsx` — добавить маршрут `/document/:docId`
2. `src/pages/DirectorDashboard.tsx` — обернуть в layout, упростить строки, убрать download hover
3. `src/pages/RolePage.tsx` — реализовать полноценный экран с документами

### Shared hook: `useDocuments.ts`

Вынос `fetchAction`, загрузки документов и фильтров из DirectorDashboard в переиспользуемый hook:

- `useDocuments()` возвращает `{ docs, filterOptions, loading }`
- Используется в DirectorDashboard и RolePage
- Вся логика фетчинга остается без изменений

In useDocuments.ts: export only { docs, filterOptions, 

loading, chipCounts }.

Do NOT move activeFilters, filteredDocs, toggleFilter 

into the hook — keep them in each page component.

activeFilters state must remain Record<string, Set<string>>

RolePage: on mount, find role id from filterOptions.roles 

where name === roleName param, then set it as active 

filter automatically.

&nbsp;

### Что НЕ меняется:

- Edge function `bpium-api/index.ts`
- Логика фильтрации (AND между группами)
- Статус-маппинг (STATUS_MAP)
- Пароль директора
- Страница выбора роли (Index.tsx)