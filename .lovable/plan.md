
# Replace all hardcoded colors with Tailwind design tokens

## Problem
Multiple files still use hardcoded hex colors (`#0099ff`, `#0a1628`, `#f5f7fa`) instead of the Tailwind CSS design tokens (`primary`, `foreground`, `background`). The design system already defines the correct WCAG AA-compliant primary color (`#0077cc` at HSL 204 100% 40%) in `src/index.css`, so all references should use the token instead.

## Files and Changes

### 1. `src/components/portal/PortalLayout.tsx`
- `bg-[#0099ff]` → `bg-primary` (header)
- `border-[#0099ff]` → `border-primary` (welcome banner)
- `text-[#0a1628]` → `text-foreground` (welcome text)
- `bg-[#f5f7fa]` → `bg-background` (root container)

### 2. `src/pages/DirectorDashboard.tsx`
- `bg-[#0099ff]` → `bg-primary` (header, active filter chip)
- `border-[#0099ff]` → `border-primary` (filter chip, stat cards)
- `hover:border-[#0099ff]` → `hover:border-primary`
- `hover:text-[#0099ff]` → `hover:text-primary`
- `text-[#0099ff]` → `text-primary` (spinner)
- `text-[#0a1628]` → `text-foreground` (stat values, doc titles)
- `group-hover:text-[#0099ff]` → `group-hover:text-primary`
- `bg-[#f5f7fa]` → `bg-background`
- `focus:ring-[#0099ff]` → `focus:ring-primary` (search input)

### 3. `src/pages/portal/DocumentListPage.tsx`
- `focus:ring-[#0099ff]` → `focus:ring-primary` (search input)

### 4. `src/pages/RolePage.tsx`
- `bg-[#f5f7fa]` → `bg-background`

## Token mapping reference

| Hardcoded | Token | Resolved value |
|-----------|-------|----------------|
| `#0099ff` | `primary` | `#0077cc` (HSL 204 100% 40%) |
| `#0a1628` | `foreground` | matches `--foreground` |
| `#f5f7fa` | `background` | matches `--background` |

## Scope
CSS/class changes only. Zero functional changes. All pages will consistently use the WCAG AA-compliant `#0077cc` via the design token.
