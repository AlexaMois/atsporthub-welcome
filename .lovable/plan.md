

## Проблема

Сейчас токен и данные пользователя хранятся в `sessionStorage` — это значит, что при закрытии вкладки/браузера всё стирается и нужно заново вводить номер телефона.

## Решение

Заменить `sessionStorage` на `localStorage` во всех местах, где хранятся `user_token`, `user_fio`, `user_roles` и `welcome_shown`. Это позволит сохранять сессию между закрытиями браузера. При следующем визите токен будет проверен через `verify-token` — если он ещё валиден, пользователь попадёт сразу в портал без повторного ввода номера.

## Файлы для изменения (4 файла)

### 1. `src/pages/LoginPage.tsx`
Заменить все `sessionStorage.setItem(...)` на `localStorage.setItem(...)`.

### 2. `src/components/UserProtectedRoute.tsx`
Заменить все `sessionStorage.getItem(...)` и `sessionStorage.removeItem(...)` на `localStorage`.

### 3. `src/components/portal/PortalLayout.tsx`
Заменить все `sessionStorage.getItem(...)` и `sessionStorage.removeItem(...)` на `localStorage` (для `user_token`, `user_fio`, `user_roles`, `welcome_shown`).

### 4. `src/App.tsx`
Добавить авто-редирект: если пользователь на `/login` и в `localStorage` уже есть `user_token` — перенаправлять сразу в портал (проверка токена произойдёт в `UserProtectedRoute`).

Итого: замена `sessionStorage` → `localStorage` в 4 файлах, ~15 строк изменений. Никаких изменений бэкенда не требуется.

