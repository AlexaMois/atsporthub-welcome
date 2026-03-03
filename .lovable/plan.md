
# Mobile UX Audit -- Issues and Fixes

## Issues Found

### 1. Download button touch target too small (28x28px)
**File:** `src/pages/portal/DocumentListPage.tsx` (line 189-194)
The download button in the document list uses `p-1` with a 16x16 icon, resulting in ~28x28px touch target. Apple's HIG requires minimum 44x44px.

**Fix:** Change to `p-2.5` and ensure min `w-11 h-11` on the button.

---

### 2. Filter chip touch targets too small (24px height)
**File:** `src/pages/portal/DocumentListPage.tsx` (lines 142-150)
Active filter chips use `py-1 px-2.5` making them ~24px tall -- well below the 44px minimum.

**Fix:** Increase to `py-2 px-3` and add `min-h-[44px]` on mobile.

---

### 3. Role cards on Index page -- touch target adequate but text is 14px (`text-sm`)
**File:** `src/pages/Index.tsx` (line 56)
Role name labels use `text-sm` (14px) which is below the recommended 16px minimum for mobile readability.

**Fix:** Change to `text-sm sm:text-sm` with a mobile override of `text-base` -- or simply use `text-[15px]` as a pragmatic compromise that keeps layout stable.

---

### 4. Document title text too small (14px) on mobile
**File:** `src/pages/portal/DocumentListPage.tsx` (line 173)
Document titles use `text-sm` (14px). On mobile these are the primary interactive elements and should be at least 15-16px.

**Fix:** Change to `text-[15px] sm:text-sm` so mobile gets slightly larger text while desktop stays compact.

---

### 5. PasswordPage lock icon uses hardcoded `#0099ff` instead of design token
**File:** `src/pages/PasswordPage.tsx` (line 32, 50)
The lock circle and submit button use `style={{ backgroundColor: "#0099ff" }}` which doesn't match the updated primary color (`#0077cc`).

**Fix:** Replace inline styles with Tailwind `bg-primary` class.

---

### 6. Stats cards use hardcoded `border-[#0099ff]`
**File:** `src/pages/portal/DocumentListPage.tsx` (line 119)
The border-left accent on stat cards uses the old hardcoded color.

**Fix:** Change to `border-primary`.

---

### 7. Sidebar "Ask AI" button touch target
**File:** `src/components/portal/PortalSidebar.tsx` (line ~162)
The AI button uses `py-2.5` (~40px height), close but slightly under the 44px minimum.

**Fix:** Increase to `py-3` to ensure 44px+ height.

---

### 8. RolePage header uses hardcoded `bg-[#0099ff]`
**File:** `src/pages/RolePage.tsx` (line 94)
This page has its own header with hardcoded old blue color, inconsistent with the updated primary.

**Fix:** Change to `bg-primary`.

---

### 9. Breadcrumb doc title truncation too aggressive on mobile
**File:** `src/components/portal/PortalBreadcrumb.tsx` (line 53)
`max-w-[200px]` is fine for desktop but can still overflow on 375px screens when combined with other breadcrumb items.

**Fix:** Change to `max-w-[140px] sm:max-w-[200px]`.

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Increase role label font size on mobile |
| `src/pages/PasswordPage.tsx` | Replace hardcoded color with `bg-primary` |
| `src/pages/portal/DocumentListPage.tsx` | Enlarge download button, filter chips, doc title font; fix border color |
| `src/pages/portal/DocumentPage.tsx` | No changes needed (buttons already use full-width on mobile) |
| `src/components/portal/PortalSidebar.tsx` | Increase AI button padding |
| `src/components/portal/PortalBreadcrumb.tsx` | Tighter mobile truncation |
| `src/pages/RolePage.tsx` | Replace hardcoded header color |

All changes are CSS/class-only. No functional behavior is modified.
