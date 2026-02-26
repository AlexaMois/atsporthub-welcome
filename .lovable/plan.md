# Breadcrumb-навигация над контентом страниц

## Что сделать

Добавить строку хлебных крошек (breadcrumb) в `PortalLayout`, чтобы она автоматически отображалась над содержимым каждой страницы. Breadcrumb будет реагировать на текущий маршрут.

## Страницы и их крошки

- `/dashboard/director` -- Главная / Все документы
- `/dashboard/director/doc/:docId` -- Главная / Все документы / Название документа

## Изменения

### Файл: `src/components/portal/PortalBreadcrumb.tsx` (новый)

Создать компонент, который:

1. Использует `useLocation` и `useParams` из react-router-dom для определения текущего маршрута.
2. Использует существующие компоненты из `src/components/ui/breadcrumb.tsx` (`Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`).
3. Логика построения крошек:
  - Всегда первый элемент: "Главная" -- ссылка на `/dashboard/director`
  - Если маршрут содержит `/doc/:docId`:
    - Второй элемент: "Все документы" -- ссылка на `/dashboard/director`
    - Третий элемент: название документа (из `usePortal().docs`) -- текущая страница (без ссылки)
  - Если маршрут -- просто `/dashboard/director`:
    - Второй элемент: "Все документы" -- текущая страница (без ссылки)
4. Рендерит горизонтальную строку с разделителями-шевронами.
5. Обёртка: `px-6 pt-4 pb-0` для отступов, согласованных с контентом страниц.

### Файл: `src/components/portal/PortalLayout.tsx`

Вставить `<PortalBreadcrumb />` внутрь `SidebarInset`, между блоком приветствия и `<Outlet />` (перед `<div className="flex-1 overflow-auto">`), чтобы крошки были видны на всех вложенных страницах.

Строка ~98, перед `<Outlet />`:

```text
<PortalBreadcrumb />
<Outlet />
```

### Файл: `src/pages/portal/DocumentPage.tsx`

Убрать ручную ссылку "Назад к списку" (`<Link to="/dashboard/director">... Назад к списку</Link>`), так как breadcrumb полностью заменяет эту навигацию.

В DocumentPage.tsx убрать только ссылку 

«Назад к списку» (Link to="/dashboard/director").

Кнопки «Открыть файл» и «Скачать» не трогать.

&nbsp;

## Результат

На каждой странице портала над контентом будет отображаться breadcrumb-строка, показывающая текущее местоположение пользователя в иерархии. На странице документа исчезнет дублирующая ссылка "Назад к списку".