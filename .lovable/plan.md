
# Доработка Edge Function и дашборда директора

## Часть 1: Edge Function (`supabase/functions/bpium-api/index.ts`)

Исправить маппинг имен полей в `get-documents` так, чтобы названия соответствовали реальному содержимому:

```text
Было (неправильно)           Будет (правильно)
directions: values['4']  --> projects: values['4']    (catalogId=54, Проекты)
roles: values['5']       --> roles: values['5']       (catalogId=57, Роли) -- OK
projects: values['6']    --> directions: values['6']  (Направления)
source: values['13']     --> source: values['13']     (Источники)
```

Все остальные поля (title, responsible, fileUrl, status, date, tags, version) остаются без изменений.

---

## Часть 2: Dashboard (`src/pages/DirectorDashboard.tsx`)

### 2.1 Удалить debug-блок
- Убрать state `debugDocs`, `showDebug`
- Убрать JSX блок с `<pre>` и кнопкой "Скрыть отладку"

### 2.2 Парсинг статуса
Bpium возвращает status как массив строк, например `["3"]`. Нужен хелпер:
```text
getStatusId(doc) = Array.isArray(doc.status) ? parseInt(doc.status[0]) : Number(doc.status)
```

### 2.3 Исправить расчет статистики
- Всего документов: `docs.length`
- Утверждено: документы где `statusId === 3`
- На согласовании: документы где `statusId === 2`
- Новых за месяц: документы где `date` попадает в текущий месяц/год

### 2.4 Фильтры из данных документов (без отдельных API-вызовов)
Убрать вызовы `get-roles`, `get-projects`, `get-directions`, `get-sources`. Вместо этого извлекать уникальные значения из linked-объектов в самих документах:

Linked-поля (roles, projects, directions, source) возвращают массивы объектов вида:
```text
{ catalogId: "57", recordId: "1", recordTitle: "Водитель", ... }
```

Для каждой группы фильтров собрать уникальные `{id: recordId, name: recordTitle}` из всех документов.

### 2.5 Логика фильтрации
- Для каждой группы: если ничего не выбрано -- не ограничивает
- Если выбран 1+ элемент -- документ должен содержать хотя бы один из выбранных recordId в соответствующем linked-поле
- Группы комбинируются по AND-логике
- Поиск: фильтр по вхождению строки в `doc.title` (регистронезависимо)

### 2.6 Список документов
Под фильтрами отображается список отфильтрованных документов. Каждая карточка (`bg-white rounded-xl shadow-sm p-4`):
- Название (`font-medium text-sm line-clamp-2`)
- Статус-бейдж: 1="Черновик" серый, 2="На проверке" желтый, 3="Утвержден" зеленый, 4="Отклонен" красный
- Дата в формате DD.MM.YYYY (`text-xs text-gray-400`)
- Роли через запятую (`text-xs text-gray-500`) -- берутся из `recordTitle` linked-объектов
- Кнопка "Скачать" если есть fileUrl или файл в responsible -- открывает `window.open(url)`

### 2.7 Фильтры в Accordion
4 группы в аккордеоне: Проекты / Роли / Направления / Источники. Заголовок показывает название группы + "(N выбрано)" если есть активные фильтры. Внутри -- чипы-кнопки для выбора.

---

## Технические детали

### Файлы для изменения
1. `supabase/functions/bpium-api/index.ts` -- поменять имена полей `directions`/`projects` местами
2. `src/pages/DirectorDashboard.tsx` -- полная переработка: убрать debug, убрать 4 лишних API-вызова, добавить document list, accordion filters, search, корректный парсинг статусов

### Используемые компоненты (уже есть в проекте)
- `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent` из `@/components/ui/accordion`
- `Badge` из `@/components/ui/badge`
- `Button`, `Input` -- уже импортированы

### Структура state в Dashboard
- `docs: any[]` -- все документы
- `searchQuery: string` -- строка поиска
- `activeFilters: Record<string, Set<string>>` -- выбранные фильтры по группам
- `filterGroups` -- вычисляются из docs через `useMemo`
- `filteredDocs` -- вычисляется через `useMemo` из docs + activeFilters + searchQuery
- `stats` -- вычисляется через `useMemo` из docs

### Извлечение URL файла
Поле `responsible` (field 3) содержит массив файловых объектов с полем `url`. Если `fileUrl` (field 11) пустой, брать URL из `responsible[0].url`.
