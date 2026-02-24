

# Полноценный дашборд Генерального директора

## Файл: `src/pages/DirectorDashboard.tsx`

Полная переработка страницы — замена заглушки на дашборд с шапкой, счётчиками, фильтрами, поиском и кнопкой.

### Структура страницы

**1. Шапка** (h-14, bg `#0099ff`, flex justify-between items-center px-4)
- Слева: кнопка «← Выйти» (`variant="ghost"`, белый текст, `navigate('/')`)
- Центр: «АТС Портал» (font-semibold, белый)
- Справа: «Генеральный директор» (text-sm, opacity-80, белый)

**2. Счётчики** (grid-cols-2 / grid-cols-4, gap-4, mt-6 mx-4)
- 4 карточки со статичными данными:
  - Всего документов: 34
  - Утверждено: 34
  - На согласовании: 0
  - Новых за месяц: 5
- Стиль карточки: bg-white, rounded-xl, shadow-sm, p-6, значение text-3xl font-bold text-[#0099ff], подпись text-sm text-gray-500

**3. Фильтры** (mx-4 mt-6) — три группы чипсов с заголовками
- Заголовок группы: text-xs text-gray-400 uppercase mb-2
- **Проекты**: ГПНЗ, ВЧНГ, СН, ДНГКМ, АУП
- **Роли**: Водитель, Механик РММ, Диспетчер
- **Направления**: БДД, ОТ, ПБ, ГСМ
- Активный чип: bg `#0099ff`, text-white, rounded-full
- Неактивный чип: bg-white, border, text-gray-700, rounded-full
- Клик — toggle через `useState` (Set для каждой группы)

**4. Поиск** (mx-4 mt-4)
- Компонент `Input`, placeholder «Поиск по всей базе...», w-full, rounded-lg

**5. Кнопка** (mx-4 mt-4)
- «Посмотреть глазами сотрудника»
- variant outline, border-[#0099ff], text-[#0099ff]

### Технические детали
- Импорты: `useState` из React, `useNavigate` из react-router-dom, `ArrowLeft` из lucide-react, `Button` и `Input` из UI-компонентов
- Три независимых `useState<Set<string>>` для toggle-фильтров (проекты, роли, направления)
- Все данные статичные — массивы и объекты прямо в компоненте

