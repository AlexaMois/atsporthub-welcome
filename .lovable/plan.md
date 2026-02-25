
# Сделать кнопку меню заметной на мобильных

## Проблема

Компонент `SidebarTrigger` из shadcn/ui **игнорирует children** — он всегда рендерит иконку `PanelLeft` (маленький квадратик), размером 28x28px. Переданная иконка `Menu` (гамбургер) не отображается. Кнопка выглядит невзрачно и непонятно.

## Решение

Заменить `SidebarTrigger` на обычную `Button`, которая вызывает `toggleSidebar()` напрямую, с явной иконкой-гамбургером (`Menu`) нормального размера.

**Файл: `src/components/portal/PortalLayout.tsx`**

1. Импортировать `useSidebar` из `@/components/ui/sidebar` (убрать импорт `SidebarTrigger`).
2. Вызвать `const { toggleSidebar } = useSidebar()` внутри вложенного компонента-хедера (нужен доступ к контексту `SidebarProvider`).
3. Заменить `<SidebarTrigger>` на:

```text
<Button
  variant="ghost"
  size="icon"
  className="text-white hover:bg-white/20 h-9 w-9"
  onClick={toggleSidebar}
>
  <Menu className="h-5 w-5" />
</Button>
```

Поскольку `useSidebar()` должен вызываться внутри `SidebarProvider`, а хедер уже вложен в него, нужно вынести хедер в отдельный компонент (`PortalHeader`) внутри того же файла.

## Структура изменений

```text
PortalLayout.tsx
  - Новый компонент PortalHeader (внутри файла)
    - useSidebar() для toggleSidebar
    - Button с иконкой Menu (h-9 w-9, белая)
    - Остальное содержимое хедера без изменений
  - В PortalLayout: заменить inline <header> на <PortalHeader>
```

## Результат

- Кнопка станет 36x36px вместо 28x28px
- Иконка — три горизонтальные полоски (Menu) вместо непонятного квадратика (PanelLeft)
- Белая на синем фоне — хорошо видна
- По нажатию открывает/закрывает сайдбар как раньше
