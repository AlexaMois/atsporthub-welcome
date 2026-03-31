

## Проблема

Вход не работает потому что фронтенд бьёт в **старый** backend:
```
POST https://hvsighjpcycwoqpmuvga.supabase.co/functions/v1/bpium-api → Failed to fetch
```

Правильный URL должен быть:
```
https://piivkjefugxyagwxriok.supabase.co/functions/v1/bpium-api
```

### Причина

В секретах проекта есть **вручную добавленные** `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`, которые указывают на старый проект `hvsighjpcycwoqpmuvga`. Эти секреты перезаписывают автогенерированный `.env` файл текущего Cloud-проекта.

### План исправления

**1 шаг — удалить лишние секреты**

Удалить из секретов проекта:
- `VITE_SUPABASE_URL` (ручной, указывает на старый проект)
- `VITE_SUPABASE_PUBLISHABLE_KEY` (ручной, ключ старого проекта)
- `VITE_SUPABASE_PROJECT_ID` (не используется)
- `VITE_DIRECTOR_PASSWORD` (заменён на `DIRECTOR_PASSWORD`)

После удаления Lovable Cloud автоматически подставит правильные значения из текущего проекта `piivkjefugxyagwxriok`.

**2 шаг — проверить вход**

После пересборки:
- Вход по телефону `89937217367` → запрос уйдёт на правильный backend
- Вход директора по паролю → тоже на правильный backend

### Что затронуто

```text
Секреты (удалить):
  VITE_SUPABASE_URL
  VITE_SUPABASE_PUBLISHABLE_KEY
  VITE_SUPABASE_PROJECT_ID
  VITE_DIRECTOR_PASSWORD

Код: без изменений
```

