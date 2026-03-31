
Цель: полностью восстановить вход в портал и сделать весь auth/data flow стабильно работающим через Bpium.

1. Что уже подтверждено
- Весь вход идёт через `bpium-api`: `verify-user`, `check-password`, `verify-token`.
- Секреты уже есть: `BPIUM_LOGIN`, `BPIUM_PASSWORD`, `JWT_SECRET`, `VITE_DIRECTOR_PASSWORD`, `VITE_SUPABASE_*`.
- В коде `src/lib/config.ts` уже переведён на env, но последний сетевой снимок всё ещё показывает запрос на старый URL `hvsighjp...` и origin вида `*.lovableproject.com`. Значит проблема не только в форме, а в связке “текущий bundle + CORS + auth flow”.

2. Где flow обрывается
```text
Сотрудник:
"/" -> LoginPage -> POST verify-user -> sessionStorage -> /portal
     -> UserProtectedRoute -> POST verify-token -> PortalLayout -> PortalProvider

Директор:
"/login/director" -> PasswordPage -> POST check-password -> sessionStorage
                   -> /dashboard/director -> ProtectedRoute -> POST verify-token
                   -> PortalLayout -> PortalProvider
```

Точки обрыва:
- запрос может вообще не уходить в актуальный backend;
- preflight/request может блокироваться по CORS;
- после успешного ответа возможен некорректный переход;
- после перехода портал может ломаться из-за state/storage, даже если логин был успешен.

3. Root cause’ы
- CORS сейчас разрешает `*.lovable.app`, но в логах origin был `*.lovableproject.com`. Это всё ещё потенциальная причина `Failed to fetch`.
- `ProtectedRoute` и `UserProtectedRoute` на сетевой ошибке молча пускают внутрь. Это маскирует поломку `verify-token` и создаёт ложный “успешный вход”.
- `PasswordPage` редиректит на `/dashboard/director` при любом `200`, даже если токен не пришёл.
- `LoginPage` и `PasswordPage` слишком рано делают `res.json()` и плохо различают non-JSON / пустой / 502 ответ.
- `PortalLayout` делает `JSON.parse(sessionStorage.getItem("user_roles") ?? "[]")` без защиты; повреждённый storage может уронить портал сразу после входа.
- `PortalProvider` использует `Promise.allSettled`, но частичные сбои превращаются в “тихо пустые данные”, из-за чего пользователь может попасть в портал и увидеть сломанный экран без понятной причины.
- `docs/PROJECT_KNOWLEDGE.md` уже расходится с реальным поведением маршрутов и auth, что повышает риск повторных ошибок.

4. План исправления
A. Укрепить frontend auth flow
- Вынести вызовы `verify-user`, `check-password`, `verify-token` в единый helper с:
  - safe JSON parsing,
  - timeout/abort,
  - нормальной классификацией ошибок,
  - единым форматом ответа.
- `LoginPage`:
  - сохранять session только если реально пришёл валидный токен;
  - явно обрабатывать `400/403/404/429/502`;
  - не терять детали ошибок Bpium/backend.
- `PasswordPage`:
  - переходить в директорский раздел только если есть `data.ok === true` и `token`;
  - иначе показывать ошибку и не редиректить.
- `ProtectedRoute` и `UserProtectedRoute`:
  - убрать silent success на network error;
  - при проблеме проверки токена переводить в `invalid`/ошибку, очищать storage и редиректить предсказуемо.
- `PortalLayout`:
  - безопасно читать `sessionStorage`;
  - добавить `safeParse` для `user_roles`;
  - исключить падение layout из-за битых данных.

B. Укрепить backend `bpium-api`
- Расширить origin-проверку: поддержать и `*.lovable.app`, и `*.lovableproject.com`, плюс опубликованные домены.
- Убедиться, что CORS headers добавляются во все ответы, включая `403/400/500`.
- Провалидировать body для `verify-user`, `check-password`, `verify-token`.
- Для ошибок Bpium возвращать понятные JSON-ответы с корректными статусами, без silent failure.

C. Сделать пост-логин поток надёжным
- В `PortalProvider` разделить критичные и некритичные загрузки:
  - если не загрузились документы — показывать явную ошибку и retry;
  - если не загрузились фильтры — показывать частичную деградацию, а не молча пустые списки.
- Оставить весь доступ к данным только через `bpium-api`, без прямых вызовов Bpium с фронта.

D. Синхронизировать знания проекта
- Обновить `docs/PROJECT_KNOWLEDGE.md` под реальные маршруты (`/portal`, `/dashboard/director`) и текущую серверную схему директорского входа.

5. Технические детали
```text
Исправляем не только "первый запрос на вход", а всю цепочку:

form submit
-> bpium-api auth action
-> sessionStorage write
-> route guard token check
-> portal bootstrap
-> Bpium documents/filters load
```

6. Что проверить после внедрения
- Вход сотрудника: валидный номер, несуществующий номер, уволенный, заблокированный.
- Вход директора: правильный пароль, неправильный пароль, rate limit.
- Повторный вход после refresh страницы.
- Открытие `/portal` и `/dashboard/director` напрямую с валидным/невалидным токеном.
- Logout.
- Повреждённый `sessionStorage`.
- Работа preview из обоих доменов: `lovable.app` и `lovableproject.com`.
