# API Contract (High-Level)

## Auth

- login/logout/refresh
- MFA verify
- profile & permissions introspection

## Admin & Access

- tenants/users/roles CRUD
- invitations/deactivation
- impersonation (ACB Admin)
- feature flags per tenant

## Fleet & Maintenance

- vehicles CRUD, assign, odometer, import/export
- drivers CRUD + compliance checks
- preventive rules CRUD + preview
- SR lifecycle (draft/submitted/cancelled)
- RFQ create/send/responses
- quote create/submit/approve/reject/versioning
- work order execution + attachments
- service history list/export

## Dispatch

- request/approve/assign/complete/history
- third-party trips with receipts and PO linkage

## Billing & Notifications

- invoice create/send/status updates
- notification settings/list/read

## Reporting

- maintenance spend
- downtime
- cycle times
- dispatch utilization
- invoice status
