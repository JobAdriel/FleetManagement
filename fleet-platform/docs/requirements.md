# Requirements (Pilot)

## Platforms

- Back end: Laravel API-first
- Front end: React + Vite (`web-admin`, `web-client`)
- Data/infra: PostgreSQL, Redis, MinIO/S3, Mailhog (local)

## Access Model

- Multi-tenant (single DB with `tenant_id`)
- RBAC by role/permission matrix
- MFA-ready
- Audit logs for all mutating operations

## Functional Scope

- ACB Operations Console: fleet, maintenance, dispatch, billing, admin
- SGS Client Portal: self-service SR/RFQ/approvals/dispatch/billing visibility
- Tier flags: Tier 1 enabled; Tier 2/3 disabled by default
