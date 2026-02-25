# Редизайн макета DirectorDashboard

Изменения затрагивают ТОЛЬКО визуальную часть (JSX + CSS-классы). Вся логика данных, фильтрации, состояний остается без изменений.

## Что изменится

### 1. Header

- Кнопка "Посмотреть глазами сотрудника" переносится в header справа (рядом с "Генеральный директор")
- Стиль: text-sm underline text-white opacity-80 hover:opacity-100
- Удаляется из основного контента

### 2. Stats (4 карточки)

- Числа: text-2xl font-bold text-[#0a1628] (вместо text-3xl text-primary)
- Подпись: text-xs text-gray-500 uppercase tracking-wide mt-1
- Карточка: bg-white rounded-lg p-4 shadow-sm border-l-4 border-[#0099ff] pl-3

### 3. Search

- h-11 px-4 text-sm border-gray-200 rounded-lg bg-white
- Иконка поиска (Search из lucide-react) внутри поля слева
- focus:ring-2 ring-[#0099ff]

### 4. Filters — из Accordion в sidebar-панель

- **Desktop (md+):** aside w-56, sticky top-20, bg-white rounded-lg shadow-sm p-4
- **Mobile:** кнопка "Фильтры (N активных)" раскрывает блок inline
- Заголовки групп: text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 mt-4
- Чипы: text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-600
- Активный чип: bg-[#0099ff] text-white border-[#0099ff]
- Убираем Accordion-компоненты, используем обычные div

### 5. Document list — GitBook-стиль

- Вместо карточек — строки с border-b border-gray-100
- Строка: py-4 hover:bg-gray-50 group
- Верхняя линия: title (text-sm font-medium text-[#0a1628] group-hover:text-[#0099ff]) + badge справа
- Нижняя линия: дата (text-xs text-gray-400) + role-бейджи (max 3, потом "+N")
- Role badge: text-xs bg-gray-100 text-gray-500 rounded px-1.5 py-0.5
- Кнопка скачивания: иконка Download, видна только при hover (opacity-0 group-hover:opacity-100)

### 6. Общая структура страницы (desktop)

Stats row (4 cards) — OUTSIDE the flex layout, 

above the sidebar+content block.

max-w-6xl mx-auto px-4 mt-6 grid grid-cols-4 gap-4

&nbsp;

```text
+--------------------------------------------------+
| Header: [Выйти]  АТС Портал  [ссылка] Ген.дир.  |
+--------------------------------------------------+
| Stats: 4 карточки в ряд (max-w-6xl mx-auto)      |
+--------------------------------------------------+
|  max-w-6xl mx-auto flex gap-6                     |
|  +----------+  +------------------------------+  |
|  | Filters  |  | Search input                 |  |
|  | w-56     |  | Document rows...             |  |
|  | sticky   |  |                              |  |
|  +----------+  +------------------------------+  |
+--------------------------------------------------+
```

### 7. Mobile layout

- Все блоки вертикально, aside скрыт
- Вместо sidebar — кнопка "Фильтры (N активных)" раскрывает фильтры inline
- Новый state: `filtersOpen` (boolean) для мобильного toggle

## Технические детали

### Файл: `src/pages/DirectorDashboard.tsx`

**Импорты:**

- Убрать: Accordion, AccordionItem, AccordionTrigger, AccordionContent
- Добавить: Search из lucide-react, ChevronDown из lucide-react
- Добавить: useIsMobile из `@/hooks/use-mobile`

**Новый state:**

- `const [filtersOpen, setFiltersOpen] = useState(false)` — для мобильного toggle фильтров

**Вычисляемое значение:**

- `totalActiveFilters` — сумма всех активных фильтров для отображения в кнопке "Фильтры (N)"

**Новый компонент (inline):** `FilterPanel` — содержит заголовки групп и чипы, используется и в sidebar, и в мобильном развернутом блоке

**JSX-структура:**

1. Header — добавить ссылку "Посмотреть глазами сотрудника"
2. Stats row — max-w-6xl mx-auto, обновленные стили карточек
3. Main content area:
  - Обертка: `max-w-6xl mx-auto px-4 mt-6 flex gap-6`
  - aside (hidden на mobile, block на md+): FilterPanel
  - main (flex-1 min-w-0): search + document list
4. Mobile: кнопка-toggle + FilterPanel (показывается по filtersOpen)

Никаких изменений в: fetchAction, getStatusId, STATUS_MAP, formatDate, extractLinkedNames, extractFileUrl, FILTER_GROUPS, useEffect, stats, chipCounts, filteredDocs, toggleFilter.