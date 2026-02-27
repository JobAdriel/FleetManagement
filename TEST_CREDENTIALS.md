# Fleet Management Platform - Test Credentials

## Production (Firebase Hosting)

### Admin Portal (Live)

- **URL:** [https://fleet-management-admin.web.app/](https://fleet-management-admin.web.app/)

### Client Portal (Live)

- **URL:** [https://fleet-management-client.web.app/](https://fleet-management-client.web.app/)

## Development Servers

### Frontend (Admin Portal)

- **URL:** [http://localhost:5174/](http://localhost:5174/)
- **Start:** `cd fleet-platform/apps/web-admin && npm run dev`

### Backend API

- **URL:** [http://localhost:8000/api](http://localhost:8000/api)
- **Start:** `cd fleet-platform/apps/api && php artisan serve`

## Test User Credentials

All users have password: `password`

### ACB Tenant Users

1. **Admin** (Full Access)
   - Email: `admin@acb.local`
   - Role: Admin
   - Permissions: All (32 permissions)

2. **Service Manager**
   - Email: `sm@acb.local`
   - Role: Manager
   - Permissions: Fleet management (no user/role management)

3. **Workshop Technician**
   - Email: `workshop@acb.local`
   - Role: Technician
   - Permissions: View/edit work orders and service requests

### SGS Tenant Users

1. **Fleet Owner** (Full Access)
   - Email: `owner@sgs.local`
   - Role: Admin
   - Permissions: All (32 permissions)

2. **Approver**
   - Email: `approver@sgs.local`
   - Role: Approver
   - Permissions: Quote approval and work order creation

3. **Dispatcher**
   - Email: `dispatcher@sgs.local`
   - Role: Dispatcher
   - Permissions: Service requests, drivers, vehicles

## Test Data Summary

### ACB Tenant

- 25 Vehicles (ACB-0001 to ACB-0025)
- 8 Drivers (ACB Driver 1-8)
- 4 Vendors (ACB Workshop, Manila Motor Repair, etc.)
- 4 Preventive Rules (Oil Change, Inspection, etc.)

### SGS Tenant

- 50 Vehicles (SGS-0001 to SGS-0050)
- 12 Drivers (SGS Driver 1-12)
- 3 Vendors (SGS Fleet Service, etc.)
- 4 Preventive Rules

## Available Pages

✅ Dashboard - Overview metrics
✅ Vehicles - Fleet inventory management
✅ Drivers - Driver management
✅ Service Requests - Maintenance requests
✅ Quotes - Quote management and RFQs
✅ Work Orders - Work order execution
✅ Preventive Rules - Preventive maintenance rules with next-due calculator
🚧 Invoices - Coming soon
🚧 Reports - Coming soon
🚧 Users - Admin only (coming soon)
🚧 Roles - Admin only (coming soon)

## Quick Start

1. Start the backend API:

   ```bash
   cd fleet-platform/apps/api
   php artisan serve
   ```

2. Start the frontend (in a new terminal):

   ```bash
   cd fleet-platform/apps/web-admin
   npm run dev
   ```

3. Open [http://localhost:5174/](http://localhost:5174/) in your browser

4. Login with: `admin@acb.local` / `password`

5. You should see the dashboard with data!

## Resetting Database

To reset and reseed the database:

```bash
cd fleet-platform/apps/api
php artisan migrate:fresh --seed
```

This will recreate all tables and populate them with test data.
