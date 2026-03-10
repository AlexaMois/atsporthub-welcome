# АТС Портал знаний

> Внутренний корпоративный портал для сотрудников транспортной компании.  
> Позволяет найти нормативные документы по своей роли, просмотреть и скачать их.

## Стек

| Слой | Технология |
|---|---|
| Фронтенд | React 18 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS |
| Бэкенд | Supabase Edge Functions (Deno) |
| Данные | Bpium CRM API |
| Роутинг | React Router v6 |
| Состояние | TanStack Query v5 |

## Ссылки

- **Lovable проект:** https://lovable.dev/projects/4a2605c7-4a6b-4783-bb75-f22b0f61904d
- **Supabase проект:** https://supabase.com/dashboard/project/piivkjefugxyagwxriok

## Архитектура

```
src/
  pages/
    Index.tsx              # Главная — выбор роли
    PasswordPage.tsx       # Вход для Генерального директора
    portal/
      DocumentListPage.tsx # Список документов
      DocumentPage.tsx     # Страница документа
  components/
    ProtectedRoute.tsx     # Гард для закрытых маршрутов
    portal/
      PortalLayout.tsx     # Лейаут с сайдбаром
  lib/
    portal-context.tsx     # Контекст: данные из Bpium
supabase/
  functions/bpium-api/
    index.ts               # Edge Function — прокси к Bpium API
```

## Маршруты

| Путь | Описание |
|---|---|
| `/` | Главная — выбор роли |
| `/role/:roleName` | Портал для сотрудника по роли |
| `/role/:roleName/doc/:docId` | Страница документа |
| `/login/director` | Вход для директора |
| `/dashboard/director` | Панель директора (защищена) |

## Локальный запуск

```sh
# 1. Клонировать репозиторий
git clone https://github.com/AlexaMois/atsporthub-welcome.git
cd atsporthub-welcome

# 2. Установить зависимости
npm install

# 3. Создать .env из шаблона и заполнить значениями
cp .env.example .env

# 4. Запустить dev-сервер
npm run dev
```

## Переменные окружения

См. файл [`.env.example`](.env.example) — там описан каждый параметр.

> **Важно:** Секреты Bpium (`BPIUM_LOGIN`, `BPIUM_PASSWORD`) хранятся только в  
> Supabase Secrets (Edge Functions → Secrets), не в `.env`!

## Безопасность

- Файл `.env` добавлен в `.gitignore` — **не коммитить его в git**
- Маршрут `/dashboard/director` закрыт компонентом `ProtectedRoute`
- Supabase Edge Function является единственным местом, где используются учётные данные Bpium

## Разработка

Проект развивается через [Lovable](https://lovable.dev) — AI-assisted разработка.  
Изменения автоматически коммитятся в этот репозиторий.

```sh
# Запуск тестов
npm run test

# Линтинг
npm run lint

# Сборка продакшн
npm run build
```
