# ATS Hub Portal — Knowledge Base

## Project

Corporate document portal for AktransService.

Stack: React, TypeScript, Tailwind CSS, Supabase.

## Bpium API

Base URL: https://neiroresheniya.bpium.ru

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

## Field Mapping (Catalog 56 — Documents)

- 2: title
- 3: responsible (ФИО)
- 4: directions (linked, catalog 55)
- 5: roles (linked, catalog 57)
- 6: projects (linked, catalog 54)
- 13: source (linked)
- 16: date (Дата внесения)
- 17: tags
- 12: status (1=Черновик, 2=На проверке, 3=Утверждён, 4=Отклонён)
- 11: fileUrl
- 18: version

## Status IDs (field 12)

1 = Черновик
2 = На проверке
3 = Утверждён
4 = Отклонён

## Routes

/ — role selection (16 roles)

/login/director — password screen (password: atc2026)

/dashboard/director — director dashboard

/role/:roleName — employee document view (stub)

## Colors

Primary: #0099ff

Background: #f5f7fa

Cards: #ffffff

Text: #0a1628

## Linked Fields — how Bpium returns them

Linked fields (roles, projects, directions, source) return array of record IDs, not names.

Example: roles: [5, 2, 3] — these are record IDs from catalog 57.

To get names — cross-reference with get-roles response.

extractName(val): if array → String(val[0]), else String(val).

Use values['2'] for name in reference catalogs (not values['1']).

## What NOT to do

- Never hardcode filter options (roles, projects, directions) — always load from Bpium API
- Never put BPIUM_LOGIN or BPIUM_PASSWORD in frontend code
- Never call Bpium API directly from React components
- Never change password logic — it's client-side intentionally for MVP

## Current Status (MVP)

Done:

- Role selection screen (16 roles from static array)
- Director password screen
- Director dashboard with real Bpium data
- Filters loaded dynamically from Bpium
- Stats: total, approved, in review, new this month

Next:

- Employee screen /role/:roleName with document list
- Document card with file download
- "View as employee" feature for director
