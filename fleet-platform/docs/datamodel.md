# Data Model (High-Level)

All tenant-scoped entities include `tenant_id`. IDs should be UUIDs.

## Core

- tenants, users, roles, permissions, user_role, role_permission
- invitations, mfa_secrets, audit_logs

## Fleet

- vehicles
- drivers
- documents
- vendors
- feature_flags

## Maintenance

- preventive_rules
- service_requests
- rfqs
- quotes
- quote_items
- approvals
- work_orders
- work_order_tasks
- work_order_parts
- service_history

## Dispatch

- dispatch_requests
- dispatch_approvals
- dispatch_assignments
- third_party_trips

## Billing

- invoices
- invoice_items
- payments (optional for pilot)

## Communications

- notifications
- email_log (optional)
