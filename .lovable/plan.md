# Упрощение макета DirectorDashboard — убрать нагромождение

## Проблемы (обнаружены при тестировании)

1. **Фильтры занимают слишком много места** — 16 ролей, 12 направлений, 5 проектов, 8 источников = ~40 чипов. На мобильном раскрытые фильтры полностью вытесняют документы с экрана
2. **На мобильном слишком много элементов до контента** — статистика (4 карточки) + кнопка фильтров + поиск, и только потом документы
3. **Бейджи ролей в строках документов** добавляют визуальный шум, особенно на мобильном

## Что изменится

### 1. Фильтры — из чипов в выпадающие Select

Вместо десятков чипов — 4 компактных выпадающих списка (Popover + Checkbox), расположенных горизонтально над списком документов.

```text
Desktop:
[Проекты v] [Роли v] [Направления v] [Источники v]  [Поиск...]

Mobile:
[Проекты v] [Роли v]
[Направления v] [Источники v]
[Поиск...]
```

Каждый dropdown при клике открывает Popover со списком чекбоксов (множественный выбор). Выбранные элементы показываются как маленький счётчик на кнопке: "Роли (3)".

### 2. Убрать sidebar

Sidebar `aside w-56` удаляется полностью. Фильтры теперь в одной строке над поиском. Контент занимает всю ширину.

```text
+--------------------------------------------------+
| Header                                            |
+--------------------------------------------------+
| Stats: 4 карточки (без изменений)                 |
+--------------------------------------------------+
| max-w-6xl mx-auto                                 |
| [Проекты v] [Роли v] [Направления v] [Источники v]|
| [Поиск по названию...]                            |
| Document rows...                                  |
+--------------------------------------------------+
```

### 3. Статистика на мобильном — компактнее

На мобильном: 4 карточки в одну строку (grid-cols-4), числа уменьшить до text-lg, подписи сократить. Это освободит вертикальное пространство.

### 4. Бейджи ролей в строках — скрыть на мобильном

На мобильном (hidden на экранах < md) скрыть бейджи ролей в строках документов, оставить только дату и статус. На десктопе оставить как есть.

## Технические детали

### Файл: `src/pages/DirectorDashboard.tsx`

**Импорты — добавить:**

- `Popover, PopoverTrigger, PopoverContent` из `@/components/ui/popover`
- `Checkbox` из `@/components/ui/checkbox`
- `ScrollArea` из `@/components/ui/scroll-area`

**Импорты — убрать:**

- `useIsMobile` (больше не нужен)

**Удалить:**

- Компонент `FilterPanel` (заменяется inline dropdown-ами)
- State `filtersOpen` (больше не нужен)
- Вычисление `totalActiveFilters` (заменяется подсчётом по группе)
- Весь блок `aside` (sidebar)
- Весь блок mobile filters toggle

**Новый компонент (inline) — `FilterDropdown`:**

```typescript
const FilterDropdown = ({ group, title, items, activeSet, onToggle, counts }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button className="text-sm px-3 py-2 rounded-lg border border-gray-200 
        bg-white hover:border-[#0099ff] flex items-center gap-1.5 
        text-gray-600 whitespace-nowrap">
        {title}
        {activeSet.size > 0 && (
          <span className="bg-[#0099ff] text-white text-xs rounded-full 
            w-5 h-5 flex items-center justify-center">
            {activeSet.size}
          </span>
        )}
        <ChevronDown className="w-3 h-3" />
      </button>
    </PopoverTrigger>
    <PopoverContent className="w-64 p-0" align="start">
      <ScrollArea className="max-h-64">
        <div className="p-2 space-y-1">
          {items.map(item => (
            <label key={item.id} 
              className="flex items-center gap-2 px-2 py-1.5 rounded 
                hover:bg-gray-50 cursor-pointer text-sm">
              <Checkbox 
                checked={activeSet.has(item.id)} 
                onCheckedChange={() => onToggle(group, item.id)} 
              />
              <span className="flex-1 truncate">{item.name}</span>
              <span className="text-xs text-gray-400">
                {counts[`${group}:${item.id}`] || 0}
              </span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </PopoverContent>
  </Popover>
)
```

**JSX — новая структура main content:**

```text
<div className="max-w-6xl mx-auto px-4 mt-6 pb-8">
  <!-- Фильтры: горизонтальная строка -->
  <div className="flex flex-wrap gap-2 mb-3">
    <FilterDropdown ... /> x4
  </div>
  
  <!-- Поиск -->
  <div className="relative mb-4">...</div>
  
  <!-- Документы -->
  <div>...</div>
</div>
```

**Бейджи ролей в строках документов:**

- Обернуть в `<div className="hidden md:flex items-center gap-2">` — скрыть на мобильном

**Stats на мобильном:**

- Изменить grid с `grid-cols-2 lg:grid-cols-4` на `grid-cols-4`
- Добавить responsive размеры: `text-lg md:text-2xl` для чисел
- Сокращённые подписи на мобильном через `hidden md:inline` / `md:hidden`  
  
activeFilters state remains Record<string, Set<string>> — do not change to arrays
  &nbsp;

### Что НЕ меняется

- fetchAction, getStatusId, STATUS_MAP, formatDate, extractLinkedNames, extractFileUrl
- FILTER_GROUPS, useEffect, stats, chipCounts, filteredDocs, toggleFilter
- Вся логика фильтрации (AND-логика между группами, множественный выбор внутри группы)
- Header
- Стили строк документов (кроме скрытия бейджей на мобильном)