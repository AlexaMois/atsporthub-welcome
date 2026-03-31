

## Plan: Update PROJECT_KNOWLEDGE.md and README.md

### docs/PROJECT_KNOWLEDGE.md changes:
1. **Routes section** — remove `/login/director`, update `/dashboard/director` description to say "protected by UserProtectedRoute, JWT from verify-user"
2. **Auth Flow** — remove "Director" subsection (password-based), replace with unified flow: all users (including director) log in by phone; director is routed to `/dashboard/director` based on role
3. **Security** — remove mentions of rate limiting on password attempts and timing-safe password comparison (no longer relevant)

### README.md changes:
1. **Architecture** — replace `PasswordPage.tsx` and `ProtectedRoute.tsx` with `LoginPage.tsx` and `UserProtectedRoute.tsx`
2. **Routes table** — remove `/login/director`, update `/` to "Вход по номеру телефона", add `/portal` and `/portal/doc/:docId`
3. **Security** — replace `ProtectedRoute` mention with `UserProtectedRoute`, note unified phone auth

### Files affected:
- `docs/PROJECT_KNOWLEDGE.md`
- `README.md`

