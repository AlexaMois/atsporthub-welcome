

## Fix: Remove git commit message from JSX in DocumentPage.tsx

**Problem**: Line 247 contains a git commit message (`feat: кнопка ИИ-Саммари на странице документа`) embedded in JSX Button attributes, causing a build error and white screen.

**Fix**: Replace the corrupted line:
```
feat: кнопка ИИ-Саммари на странице документа            variant="outline"
```
with:
```
            type="button"
            variant="outline"
```

This is a one-line fix in `src/pages/portal/DocumentPage.tsx` at approximately line 247.

