
## Проверка и исправление кнопок в DocumentPage.tsx

### Результат проверки

**onClick-обработчики** -- все корректны:
- "Предыдущий" и "Следующий" -- только `navigate()`, побочных действий нет
- "Открыть файл" -- `window.open()`, корректно
- "Скачать" -- `handleDownload()`, корректно
- "Загрузить предпросмотр" -- `setShowPreview(true)`, корректно

**Проблема: ни одна кнопка не имеет `type="button"`**

Без явного `type="button"` браузер по умолчанию считает кнопку `type="submit"`, что может вызвать нежелательную отправку формы если кнопка окажется внутри `<form>`.

### Исправления

5 кнопок, каждой добавить `type="button"`:

1. **Строка 146** -- `<button onClick={() => setShowPreview(true)}` -- добавить `type="button"`
2. **Строка 174** -- `<Button onClick={() => window.open(...)}` (Открыть файл) -- добавить `type="button"`
3. **Строка 180** -- `<Button variant="outline" onClick={() => handleDownload(...)}` (Скачать) -- добавить `type="button"`
4. **Строка 201** -- `<Button variant="outline" onClick={() => navigate(...)}` (Предыдущий) -- добавить `type="button"`
5. **Строка 210** -- `<Button variant="outline" onClick={() => navigate(...)}` (Следующий) -- добавить `type="button"`

Никаких других изменений не требуется.
