

## Добавление логотипа АТС

Логотип (геометрический лев) будет использован в трёх местах: favicon, шапка портала директора и экран выбора ролей.

### 1. Копирование файла

Скопировать `user-uploads://photo_2025-12-06_08-10-16.jpg` в два места:
- `public/favicon.jpg` -- для favicon
- `src/assets/ats-logo.jpg` -- для использования в React-компонентах через import

### 2. Favicon (index.html)

- Добавить `<link rel="icon" href="/favicon.jpg" type="image/jpeg">`
- Обновить `<title>` на "АТС Портал"
- Обновить og:title и twitter:title на "АТС Портал"

### 3. Шапка портала (PortalLayout.tsx)

В компоненте `PortalHeader` рядом с текстом "АТС Портал" (строка 28) добавить логотип:

```tsx
import atsLogo from "@/assets/ats-logo.jpg";

// В header, перед текстом "АТС Портал":
<img src={atsLogo} alt="АТС" className="h-8 w-8 rounded" />
<span className="text-white font-semibold text-sm">АТС Портал</span>
```

### 4. Экран выбора ролей (Index.tsx)

В header главной страницы (строка 36-38) аналогично добавить логотип:

```tsx
import atsLogo from "@/assets/ats-logo.jpg";

<header className="h-14 bg-primary flex items-center px-5 gap-3">
  <img src={atsLogo} alt="АТС" className="h-8 w-8 rounded" />
  <span className="text-primary-foreground font-semibold text-lg">АТС Портал</span>
</header>
```

### Итого изменения

| Файл | Что меняется |
|---|---|
| `public/favicon.jpg` | Новый файл (копия логотипа) |
| `src/assets/ats-logo.jpg` | Новый файл (копия логотипа) |
| `index.html` | Favicon + title |
| `src/components/portal/PortalLayout.tsx` | Логотип в шапке |
| `src/pages/Index.tsx` | Логотип в шапке |
