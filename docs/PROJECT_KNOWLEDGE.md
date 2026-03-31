# ATS Hub Portal — Knowledge Base

## Project

Corporate document portal for AktransService.

Stack: React, TypeScript, Tailwind CSS, Supabase (Lovable Cloud).

## Bpium API

Base URL: https://ats.bpium.ru (dynamic via BPIUM_DOMAIN secret)

Auth: Basic Auth via Supabase Secrets (BPIUM_LOGIN, BPIUM_PASSWORD)

Edge Function: supabase/functions/bpium-api/index.ts

All Bpium requests go through Edge Function only.

Never call Bpium API directly from frontend.

## Catalog IDs

- Documents: 56
- Roles: 57
- Projects: 54
- Directions: 55
- Sources: 59 (field 13)
- Users (АТС): users (текстовый ID)

## Field Mapping (Catalog 56 — Documents)

- 2: title
- 3: fileUrl (файл)
- 4: directions (linked, catalog 55)
- 5: roles (linked, catalog 57)
- 6: projects (linked, catalog 54)
- 12: status (1=Черновик, 2=На проверке, 3=Утверждён, 4=Отклонён)
- 13: source (linked, catalog 59)
- 15: responsible (ФИО)
- 16: date (Дата внесения)
- 17: tags
- 18: version
- 19: checklist
- 20: SUMMARY_CACHE

## Status IDs (field 12)

1 = Черновик
2 = На проверке
3 = Утверждён
4 = Отклонён

## Routes

/ — login by phone (employee)

/login — same as /

/login/director — password screen (director)

/portal — employee portal (protected by UserProtectedRoute, JWT from verify-user)

/portal/doc/:docId — document detail

/dashboard/director — director portal (protected by ProtectedRoute, JWT from check-password)

/dashboard/director/doc/:docId — document detail (director)

## Auth Flow

### Employee
1. LoginPage → POST bpium-api?action=verify-user (phone)
2. Backend searches catalog 64, checks status, returns JWT + fio + roles
3. Frontend stores user_token, user_fio, user_roles in sessionStorage
4. UserProtectedRoute verifies JWT via bpium-api?action=verify-token
5. PortalLayout reads session, PortalProvider loads documents/filters

### Director
1. PasswordPage → POST bpium-api?action=check-password
2. Backend compares with VITE_DIRECTOR_PASSWORD secret, returns JWT
3. Frontend stores director_token in sessionStorage
4. ProtectedRoute verifies JWT via bpium-api?action=verify-token
5. PortalLayout/PortalProvider same as employee

### Security
- JWT signed with JWT_SECRET (server-side only)
- Rate limiting on password attempts (5 per 15 min)
- Timing-safe password comparison
- Network errors on token verify → redirect to login (no silent pass-through)

## API Helper

`src/lib/api.ts` — unified fetch wrapper with:
- AbortController timeout (15s)
- Safe JSON parsing
- Unified ApiResult format
- safeJsonParse utility for sessionStorage

## Colors

Primary: #0099ff

Background: #f5f7fa

Cards: #ffffff

Text: #0a1628

## CORS

Edge function allows:
- portal.atslogistik.ru
- atsporthub-welcome.lovable.app
- *.lovable.app (regex)
- *.lovableproject.com (regex)

## What NOT to do

- Never hardcode filter options — always load from Bpium API
- Never put BPIUM_LOGIN or BPIUM_PASSWORD in frontend code
- Never call Bpium API directly from React components
- Never use apikey header for bpium-api calls (not needed)
- Never silently allow access on network errors in route guards
