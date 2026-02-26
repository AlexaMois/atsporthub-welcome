

# Типографика -- выраженная иерархия размеров шрифтов

## Что сделать
Усилить визуальную иерархию текста: увеличить заголовок H1 на странице документа до ~36px, а категории в боковом меню оставить ALL CAPS серым (уже реализовано через `SidebarGroupLabel`). Также добавить заголовок на страницу списка документов.

## Изменения

### 1. `src/pages/portal/DocumentPage.tsx` (строка 112)

Увеличить H1 заголовок документа с `text-2xl` до `text-4xl`:

**Было:** `text-2xl font-bold text-foreground mb-4`
**Стало:** `text-4xl font-bold text-foreground mb-6 leading-tight`

### 2. `src/pages/portal/DocumentListPage.tsx`

Добавить крупный заголовок "Все документы" перед блоком статистики (после строки 93, в начале контента):

```text
<h1 className="text-3xl font-bold text-foreground mb-6">Все документы</h1>
```

### 3. `src/components/portal/PortalSidebar.tsx`

Категории в сайдбаре (`SidebarGroupLabel`) уже используют `text-xs font-semibold uppercase tracking-wide text-gray-400` -- это соответствует GitBook-стилю ALL CAPS серым. Изменений не требуется.

## Результат
- Заголовок документа станет крупным (~36px) и выразительным
- Страница списка получит заголовок "Все документы" в стиле h1
- Категории меню останутся ALL CAPS серым -- визуальная иерархия будет чёткой

