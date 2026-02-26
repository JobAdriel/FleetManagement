# Fleet Platform Monorepo (Phase 2c Complete)

Initial scaffold generated from `FM_Chat.txt`. **Phase 1 Foundation + Phase 2a/b/c (Database + API + Frontend Auth) complete.**

## Status: Phase 2c Complete ✓

**Full-Stack Authentication & CRUD Ready:**

- ✅ **23 Migrations + Seeded Data** — 2 tenants, 6 users, 10 drivers, 100 vehicles, 4 vendors, 4 rules
- ✅ **Backend Sanctum Auth** — Login, register, logout, refresh, me endpoints (Sanctum tokens)
- ✅ **CRUD API Endpoints** — 25+ routes for vehicles, drivers, service-requests, quotes, work-orders, invoices
- ✅ **React Auth Context** — useAuth hook with login/logout/register and localStorage persistence
- ✅ **Protected Routes** — Client-side route guards (ProtectedRoute wrapper)
- ✅ **API Client** — Typed client with Bearer token auto-injection  
- ✅ **Login Forms** — Styled login pages for both web-admin and web-client apps
- ✅ **Multi-Tenant Architecture** — All resources scoped by tenant_id (isolation at database & API level)

**Test Login Credentials:**

| App | Tenant | Email | Password |
|-----|--------|-------|----------|
| Admin | ACB | `admin@acb.local` | `password` |
| Admin | ACB | `sm@acb.local` | `password` |
| Admin | ACB | `workshop@acb.local` | `password` |
| Client | SGS | `owner@sgs.local` | `password` |
| Client | SGS | `approver@sgs.local` | `password` |
| Client | SGS | `dispatcher@sgs.local` | `password` |
