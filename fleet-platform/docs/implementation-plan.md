# Implementation Plan (Task Cards)

## Phase 1: Foundation

- [ ] Initialize Laravel API app in `apps/api`
- [ ] Install Sanctum, Spatie Permission, Telescope (dev)
- [ ] Configure tenant middleware and policy gates
- [ ] Scaffold React + Vite apps in `apps/web-admin` and `apps/web-client`

## Phase 2: Data Layer

- [ ] Create core migrations (tenants, users, RBAC, audit)
- [ ] Create fleet/maintenance/dispatch/billing migrations
- [ ] Add `tenant_id` to tenant-scoped tables + indexes
- [ ] Seed tenants, roles, users, vehicles, drivers, vendors, preventive rules

## Phase 3: Security & Access

- [ ] Sanctum auth and cookie/CORS configuration
- [ ] MFA opt-in (TOTP + backup codes)
- [ ] Permission middleware and tenant scope enforcement
- [ ] Admin impersonation with audit trail

## Phase 4: Core Flows

- [ ] Vehicles/drivers CRUD and import/export
- [ ] Preventive rule CRUD + next-due preview
- [ ] Service request lifecycle
- [ ] RFQ + quote + approval flows
- [ ] Work order execution + attachments
- [ ] Service history export
- [ ] Dispatch and third-party trip lifecycle
- [ ] Invoice creation, PDF generation, delivery, status tracking

## Phase 5: Jobs & Reporting

- [ ] Implement queued notification and document jobs
- [ ] Implement scheduled evaluators/reminders/materializers
- [ ] Add health endpoints (`/healthz`, queue, scheduler heartbeat)
- [ ] Build analytics/report export endpoints

## Phase 6: UIs

- [ ] Build ACB admin route map and role-gated screens
- [ ] Build SGS client route map and role-gated screens
- [ ] Add in-app notification center and secure file handling

## Phase 7: Validation

- [ ] Execute pilot smoke flow from runbook
- [ ] Execute all scenarios in `docs/test-scenarios.md`
- [ ] Verify feature flags (Tier 2/3 disabled by default)
- [ ] Validate local and cloud deployment baselines
