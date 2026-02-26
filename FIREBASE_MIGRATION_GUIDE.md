# Firebase Migration Guide

This repository currently uses:
- Laravel API (`fleet-platform/apps/api`)
- PostgreSQL + Redis + MinIO (via Docker)
- React apps (`web-admin`, `web-client`)

## Important

Firebase Hosting only serves frontend static files. It does **not** run your Laravel PHP backend.

To deploy everything, choose one of these paths:

1. **Recommended staged path (fastest to production)**
   - Deploy `web-admin` + `web-client` to Firebase Hosting
   - Deploy Laravel API to Cloud Run
   - Keep SQL database (Cloud SQL PostgreSQL)

2. **Full Firebase rewrite (larger project)**
   - Replace Laravel API with Firebase Cloud Functions
   - Replace PostgreSQL models/migrations with Firestore collections
   - Replace Sanctum auth with Firebase Auth
   - Replace MinIO documents with Firebase Storage

## What is already prepared in this repo

- `firebase.json` with two hosting targets:
  - `admin` → `fleet-platform/apps/web-admin/dist`
  - `client` → `fleet-platform/apps/web-client/dist`
- `.firebaserc` template with hosting target mapping
- Root scripts:
  - `npm run build:firebase`
  - `npm run firebase:deploy:admin`
  - `npm run firebase:deploy:client`
  - `npm run firebase:deploy`
   - `npm run firebase:deploy:firestore`
   - `npm run firebase:deploy:rules`
   - `npm run firebase:deploy:indexes`
- Firestore configuration files:
   - `firestore.rules`
   - `firestore.indexes.json`
- Frontend document upload/download calls now use `VITE_API_BASE_URL` (no hardcoded localhost)
- `.env.production.example` created for both frontend apps
- Firebase Auth support added in both frontends (switchable by env)
- Firestore Vehicles CRUD support added in both frontends (switchable by env)
- Firestore Drivers + Service Requests CRUD support added in both frontends (switchable by env)
- Firestore Work Orders + Invoices CRUD support added in both frontends (switchable by env)
- Firestore Quotes + Vendors CRUD support added in both frontends (switchable by env)
- Firestore Approvals + Preventive Rules CRUD support added in both frontends (switchable by env)
- Firestore Users + Roles + Notifications support added in both frontends (switchable by env)

## Run with Firebase (current implementation)

In each app env file (`web-admin` and `web-client`), set:

- `VITE_AUTH_PROVIDER=firebase`
- `VITE_DATA_PROVIDER=firebase`
- `VITE_FIREBASE_API_KEY=...`
- `VITE_FIREBASE_AUTH_DOMAIN=...`
- `VITE_FIREBASE_PROJECT_ID=...`
- `VITE_FIREBASE_STORAGE_BUCKET=...`
- `VITE_FIREBASE_MESSAGING_SENDER_ID=...`
- `VITE_FIREBASE_APP_ID=...`

With this setting:
- Login/register/logout uses Firebase Auth
- Vehicle endpoints (`/vehicles`) use Firestore
- Driver endpoints (`/drivers`) use Firestore
- Service request endpoints (`/service-requests`) use Firestore
- Work order endpoints (`/work-orders`) use Firestore
- Invoice endpoints (`/invoices`) use Firestore
- Quote endpoints (`/quotes`) use Firestore
- Vendor endpoints (`/vendors`) use Firestore
- Approval endpoints (`/approvals`) use Firestore
- Preventive rule endpoints (`/preventive-rules`) use Firestore
- User endpoints (`/users`) use Firestore
- Role endpoints (`/roles`) use Firestore
- Notification endpoints (`/notifications`) use Firestore
- Notification mark-sent endpoint (`/notifications/{id}/mark-sent`) updates Firestore
- Other endpoints continue using your API base URL

## Deploy frontends to Firebase Hosting

1. Install Firebase CLI:
   - `npm i -g firebase-tools`
2. Login:
   - `firebase login`
3. Create two Hosting sites in Firebase Console (for admin and client)
4. Update `.firebaserc` placeholders:
   - `your-firebase-project-id`
   - `your-admin-site-id`
   - `your-client-site-id`
5. Create production env files:
   - `fleet-platform/apps/web-admin/.env.production`
   - `fleet-platform/apps/web-client/.env.production`
   - Set `VITE_API_BASE_URL` to your deployed API URL
6. Deploy:
   - `npm run firebase:deploy`

## Deploy Firestore security + indexes

After selecting your Firebase project and creating Firestore in Native mode:

1. Deploy rules and indexes:
   - `npm run firebase:deploy:firestore`
2. Or deploy separately:
   - `npm run firebase:deploy:rules`
   - `npm run firebase:deploy:indexes`

Rules are tenant-aware and require authenticated users, with role checks for role management.

## Full backend conversion scope (Laravel -> Firebase)

You currently expose many REST endpoints in `fleet-platform/apps/api/routes/api.php`:
- Auth/login/register/logout/me
- Vehicles, drivers, service-requests, rfqs, quotes
- work-orders, invoices, vendors, approvals
- users, roles, permissions
- documents, notifications, reports
- 2FA, sessions, security events, OAuth

A full rewrite requires rebuilding these in Firebase Functions and updating both frontends from Bearer tokens issued by Laravel Sanctum to Firebase Auth ID tokens.

## Suggested phased rewrite plan

1. **Phase A: Hosting + API URL cleanup** (completed)
2. **Phase B: Auth + first data domain** (partially completed)
   - Firebase Auth added in frontends
   - Vehicles, drivers, service-requests, work-orders, invoices, quotes, vendors, approvals, preventive-rules, users, roles, and notifications migrated to Firestore access path in frontends
3. **Phase C: Core data migration**
   - Migrate `vehicles`, `drivers`, `service-requests`, `work-orders`, `invoices` to Firestore
4. **Phase D: Files + notifications**
   - Move documents to Firebase Storage
   - Rebuild notifications and realtime features
5. **Phase E: Advanced security features**
   - Recreate 2FA/session/security events/OAuth management

## Next recommended action

Start with a production-safe intermediate architecture:
- Keep Laravel backend for now (deploy to Cloud Run)
- Deploy both frontends on Firebase Hosting
- Then migrate APIs endpoint-by-endpoint to Firebase Functions
