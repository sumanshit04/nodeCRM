# Pulse CRM

Production-style Customer Relationship Management system built with Node.js, Express, Prisma, PostgreSQL, and Bootstrap.

**Full functionality plan:** [project_plan.md](project_plan.md)

**To start this project later without Cursor, see [HOW_TO_RUN.md](HOW_TO_RUN.md).**

## Features

- Session authentication with bcrypt, CSRF tokens, Helmet, CORS, and rate limiting
- Role-based access control (Admin / User) plus per-user permission overrides
- User management: create, edit, delete, search, filter, activate/deactivate, reset password
- Permission matrix enforced on the API, not only in the UI
- Lead CRM with search, filters, server-side pagination, and CSV export
- Configurable lead statuses
- Activity / audit logs
- Dashboard cards and status chart

## Requirements

- Node.js 18+
- PostgreSQL 14+

## Setup

1. Create a database:

```sql
CREATE DATABASE crm_system;
```

2. Copy environment variables:

```bash
cp .env.example .env
```

3. Edit `.env` and set `DATABASE_URL` and a strong `SESSION_SECRET`.

Example:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_system?schema=public"
SESSION_SECRET="a-long-random-secret"
```

4. Install dependencies and apply the schema:

```bash
npm install
npx prisma migrate deploy --schema backend/prisma/schema.prisma
npx prisma generate --schema backend/prisma/schema.prisma
npm run prisma:seed
```

5. Start the app:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) and sign in.

### Seeded accounts

| Role  | Email           | Password  |
| ----- | --------------- | --------- |
| Admin | admin@crm.local | Admin@123 |
| User  | john@crm.local  | User@1234 |

Change these passwords after first login.

John is seeded with View/Add/Edit leads and View Reports. Delete Lead and Export Leads are denied.

## Project layout

```
backend/     Express API, Prisma, middleware, services
frontend/    Bootstrap UI (HTML/CSS/JS)
.env.example Environment template
```

The API and UI are served from the same origin (`http://localhost:3000`) so session cookies stay first-party.

## Main API routes

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET|POST /api/users` and `GET|PUT|DELETE /api/users/:id`
- `POST /api/users/:id/permissions`
- `GET /api/permissions`
- `GET|POST /api/leads` and `GET|PUT|DELETE /api/leads/:id`
- `GET /api/leads/export`
- `GET|POST /api/lead-statuses` and `PUT|DELETE /api/lead-statuses/:id`
- `GET /api/dashboard/stats`
- `GET /api/activity-logs`

JSON success shape:

```json
{ "success": true, "message": "Lead created successfully", "data": {} }
```

## Development

```bash
npm run dev
```

Uses Node's `--watch` reloader.

You do not need Cursor. Use Node.js, PostgreSQL, and a browser.

### 1. Prerequisites

- **Node.js 18+** installed
- **PostgreSQL** running (your Adminer setup is fine)

### 2. Open a terminal in the project folder

```powershell
cd d:\nodeProject
```

### 3. Start the app

If you already ran `npm install` and seeded the database once:

```powershell
npm start
```

Then open **http://localhost:3000**

Log in:

- Admin: `admin@crm.local` / `Admin@123`
- User: `john@crm.local` / `User@1234`

Stop the server with `Ctrl+C`.

---

### If it is a new PC, or `node_modules` is missing

```powershell
cd d:\nodeProject
npm install
npm run db:setup
npm start
```

`db:setup` creates the `crm_system` database if needed, applies migrations, and seeds the admin/user accounts.

Your `.env` already has:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_system?schema=public"
```

If PostgreSQL is not running, start the **postgresql-x64-17** Windows service first, then run `npm start`.
