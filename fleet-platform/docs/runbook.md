# Runbook

## VS Code Extensions

- Docker
- Dev Containers
- PHP Intelephense
- Laravel and Blade tools
- ESLint
- Prettier
- TypeScript support
- YAML
- GitLens
- Thunder Client or REST Client

## Local Setup

1. Copy `infra/.env.example` to `infra/.env`.
2. Bootstrap app code in `apps/api`, `apps/web-admin`, `apps/web-client`.
3. Start stack from `infra`: `docker compose --env-file .env up -d`.
4. Run migrations and seeders in `apps/api`.

## Pilot Smoke Flow

1. SGS Fleet Owner creates SR
2. ACB Service Manager creates RFQ and quote
3. SGS Approver approves quote
4. ACB Workshop executes work order
5. ACB Finance creates and sends invoice
6. SGS Fleet Owner verifies invoice and history
