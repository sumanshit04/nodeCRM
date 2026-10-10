# Pulse CRM — Full Project Functionality Plan

This document describes the **implemented** Pulse CRM application (not a wishlist). It matches the live stack, database, APIs, permissions, and UI.

Related files:

- [HOW_TO_RUN.md](HOW_TO_RUN.md) — start the app without Cursor
- [README.md](README.md) — setup summary

---

## 1. Project overview

Pulse CRM is a production-style Customer Relationship Management system.

- Admins manage users, roles, permissions, lead statuses, and audit logs
- Users manage leads according to assigned permissions
- The UI hides buttons and menu items the user cannot use
- The **API always enforces** authentication and permissions (never trust the frontend)

Default URL: **http://localhost:3000**

---

## 2. Tech stack

| Layer | Technology |
| --- | --- |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Frontend | HTML, CSS, JavaScript, Bootstrap 5, Chart.js |
| Auth | Session cookies (`express-session` + `connect-pg-simple`) |
| Passwords | bcrypt |
| API | REST JSON |
| Validation | Client-side (`frontend/js/validators.js`) and server-side (`express-validator`) |
| Config | `.env` |
| Security | Helmet, CORS, rate limiting, input sanitization, CSRF (`X-CSRF-Token`), httpOnly cookies |

---

## 3. How to run

You do not need Cursor. Use Node.js, PostgreSQL, and a browser.

```powershell
cd d:\nodeProject
npm start
```

Open http://localhost:3000

**New machine / missing `node_modules`:**

```powershell
cd d:\nodeProject
npm install
npm run db:setup
npm start
```

PostgreSQL / Adminer:

- Username: `postgres`
- Password: `password`
- Database: `crm_system`

Seeded logins (change after first use):

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@crm.local | Admin@123 |
| User | john@crm.local | User@1234 |

Stop the server with **Ctrl+C**. If PostgreSQL is stopped, start the **postgresql-x64-17** Windows service first.

Full run notes: [HOW_TO_RUN.md](HOW_TO_RUN.md)

---

## 4. Architecture

```text
Browser (Bootstrap UI)
    → REST JSON (same origin, session cookie + CSRF)
        → Auth middleware (session)
        → Permission middleware (RBAC + user overrides)
        → Controllers → Services → Prisma
            → PostgreSQL
        → Activity logs on login/logout and mutating actions
```

Layers stay separate: routes, controllers, services, validators, Prisma schema.

---

## 5. Folder structure

```text
crm-system /
├── backend/
│   ├── config/          # env, Prisma client
│   ├── controllers/
│   ├── middleware/      # auth, permissions, validation
│   ├── prisma/          # schema, migrations, seed
│   ├── routes/
│   ├── scripts/         # ensure-db, smoke-test
│   ├── services/
│   ├── utils/
│   ├── validators/
│   ├── app.js
│   └── server.js
├── frontend/
│   ├── css/app.css
│   ├── js/              # api, validators, login, app
│   ├── index.html       # authenticated shell
│   └── login.html
├── .env
├── .env.example
├── HOW_TO_RUN.md
├── project_plan.md
├── package.json
└── README.md
```

---

## 6. Database

PostgreSQL schema is defined in [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

### Tables

| Table | Purpose |
| --- | --- |
| `roles` | Admin, User |
| `permissions` | Catalog of permission keys |
| `role_permissions` | Default grants for a role |
| `users` | Accounts (name, email, phone, password hash, role, status) |
| `user_permissions` | Per-user grant or deny overrides |
| `lead_statuses` | Configurable statuses |
| `leads` | Customers/leads |
| `activity_logs` | Audit trail |
| `session` | Server-side login sessions |

### Relationships

```text
roles ──< users ──< user_permissions >── permissions
  └──────────────< role_permissions >──┘

users ── created_by ──> leads
users ── assigned_to ──> leads
lead_statuses ──< leads
users ──< activity_logs
```

A lead stores **who created it** (`created_by_id`) and **who it is assigned to** (`assigned_user_id`).

---

## 7. Roles and permissions

### Roles

- **Admin** — all permissions
- **User** — `dashboard.view`, `leads.view`, `leads.create`, `leads.update` by default

Seeded user **John** also has `reports.view` granted. `leads.delete` and `leads.export` are denied.

### Permission keys

| Group | Key | Meaning |
| --- | --- | --- |
| Dashboard | `dashboard.view` | View dashboard cards |
| Dashboard | `reports.view` | View status chart / reports |
| Users | `users.view` | List/view users |
| Users | `users.create` | Add user |
| Users | `users.update` | Edit, activate/deactivate, reset password |
| Users | `users.delete` | Delete user |
| Users | `permissions.manage` | Assign permission matrix |
| Leads | `leads.view` | List/view leads |
| Leads | `leads.create` | Add lead |
| Leads | `leads.update` | Edit lead |
| Leads | `leads.delete` | Delete lead |
| Leads | `leads.export` | Export CSV |
| Lead Status | `lead_statuses.manage` | CRUD statuses |
| Activity Logs | `activity_logs.view` | View audit logs |

### Effective permission

```text
role_permissions (grant)
  + user_permissions grant
  − user_permissions deny   (deny wins)
```

Example: John

```text
View Leads       yes
Add Lead         yes
Edit Lead        yes
Delete Lead      no
Export Leads     no
View Reports     yes
```

The backend checks these keys on every protected route.

---

## 8. Modules (functionality)

### 8.1 Authentication

Login page (`/login.html`):

- Email / Username
- Password
- Remember Me (longer session cookie)
- Login button

Behavior:

- Required fields and email format (client + server)
- User must exist, be **active**, and password must match bcrypt
- Generic error: “Invalid email or password”
- Session cookie is httpOnly; CSRF token returned after login
- Protected pages redirect to login
- Logout destroys the session and writes an audit log

### 8.2 Dashboard

Cards (when `dashboard.view`):

- Total Leads, New, Contacted, Qualified, Converted, Lost
- Total Users / Active Users only if `users.view`

Chart (when `reports.view`): leads by status (Chart.js).

### 8.3 User management (admin)

- Add, edit, delete user
- Search (name, email, phone)
- Filter by status and role
- Pagination
- Reset password
- Activate / deactivate
- Assign role
- Cannot delete or deactivate your own account

Add/Edit user fields: Full Name, Email, Phone, Password, Confirm Password, Role, Status.

### 8.4 Permission management

Admin selects a user and toggles a checkbox matrix of all permissions, then Save. Stored as grant/deny overrides relative to the role.

### 8.5 CRM / leads

Lead fields:

- Name, Email, Phone, Country, Address, PIN/ZIP, Company
- Lead status, Lead source, Assigned user, Notes
- Created by, Created date, Updated date (system)

Lead list columns:

- ID, Name, Email, Phone, Country, Company, Lead Status, Assigned To, Created Date, Actions

Actions (shown only if permitted): View, Add, Edit, Delete. Delete uses a confirmation modal.

Search: name, email, phone, company.

Filters: country, lead status, assigned user, date from/to.

Pagination: server-side (`page`, `limit`).

Export: CSV when `leads.export` is allowed.

Lead email must be unique.

### 8.6 Lead statuses

Seeded and admin-configurable:

New, Contacted, Interested, Follow-up, Qualified, Converted, Lost.

Cannot delete a status that is still used by leads.

### 8.7 Activity / audit logs

Recorded examples:

- User logged in / logged out
- Admin created/updated/deleted user, reset password, changed status
- Admin changed permissions
- User created/updated/deleted lead
- Admin created/updated/deleted lead status

Stored: user, action, description, IP address, date/time.

Filter: search text, action, date range.

---

## 9. REST APIs

Consistent JSON:

Success:

```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {}
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Please enter a valid email address"
  }
}
```

Typical HTTP codes: 200/201, 400 validation, 401 unauthenticated, 403 no permission, 404, 409 duplicate email, 429 rate limit.

### Auth

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/auth/csrf` | CSRF token |
| POST | `/api/auth/login` | Public; rate limited |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/auth/me` | Current user + effective permissions |

### Users

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/users` | `users.view` — `q`, `status`, `roleId`, `page`, `limit` |
| POST | `/api/users` | `users.create` |
| GET | `/api/users/:id` | `users.view` |
| PUT | `/api/users/:id` | `users.update` |
| DELETE | `/api/users/:id` | `users.delete` |
| PATCH | `/api/users/:id/status` | `users.update` |
| POST | `/api/users/:id/reset-password` | `users.update` |
| POST | `/api/users/:id/permissions` | `permissions.manage` |
| GET | `/api/users/roles` | `users.view` |
| GET | `/api/users/options` | `users.view` or lead create/update |
| GET | `/api/permissions` | `permissions.manage` |

### Leads

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/leads` | `leads.view` — `q`, `country`, `statusId`, `assignedUserId`, `dateFrom`, `dateTo`, `page`, `limit` |
| POST | `/api/leads` | `leads.create` |
| GET | `/api/leads/:id` | `leads.view` |
| PUT | `/api/leads/:id` | `leads.update` |
| DELETE | `/api/leads/:id` | `leads.delete` |
| GET | `/api/leads/export` | `leads.export` |

### Lead statuses

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/lead-statuses` | `leads.view` or `lead_statuses.manage` |
| POST | `/api/lead-statuses` | `lead_statuses.manage` |
| PUT | `/api/lead-statuses/:id` | `lead_statuses.manage` |
| DELETE | `/api/lead-statuses/:id` | `lead_statuses.manage` |

### Dashboard and logs

| Method | Path | Permission |
| --- | --- | --- |
| GET | `/api/dashboard/stats` | `dashboard.view` |
| GET | `/api/activity-logs` | `activity_logs.view` |
| GET | `/api/health` | Public health check |

Passwords and `passwordHash` are never returned in API responses.

---

## 10. Validation and security

### Validation (client and server)

- **Name:** required, 2–80 characters, letters/spaces/`.'-` only
- **Email:** required, valid format, unique for users and leads
- **Phone:** required, 7–15 digits, optional `+`
- **Password:** required on create, min 8, upper + lower + number + special character; confirm must match
- **PIN / ZIP:** required; country-specific patterns (US, IN, GB, CA, AU, DE, IT, FR) with a generic fallback
- **Lead status and country:** required on lead forms

Example messages: “Name is required.”, “Please enter a valid email address.”, “Email already exists.”, “Password must contain at least 8 characters.”

### Security

- bcrypt password hashing
- Session auth + CSRF header on mutating requests
- Role and permission middleware
- Helmet (CSP); UI actions use `data-action` instead of inline `onclick` so buttons work under CSP
- CORS (same-origin by default)
- Rate limit on login and general `/api`
- SQL injection protection via Prisma
- XSS sanitization of string inputs
- Secure cookie flags from `.env` (`COOKIE_SECURE`, `COOKIE_SAMESITE`)
- Generic login errors; no sensitive fields in JSON

---

## 11. UI / UX

Layout:

```text
------------------------------------------------
| Logo | Top Navigation | Profile | Logout    |
------------------------------------------------
| Sidebar          | Main Content             |
| Dashboard        | Dashboard / CRM          |
| Users            |                          |
| Permissions      |                          |
| Leads            |                          |
| Lead Status      |                          |
| Activity Logs    |                          |
------------------------------------------------
```

- Responsive (desktop and tablet; sidebar collapses on small screens)
- Sidebar items appear only if the user has that module’s permission
- Toasts, loading spinner, empty states, delete confirmation modal
- Forms and tables with pagination

---

## 12. Admin workflow

```text
Admin Login
     ↓
Admin Dashboard
     ↓
Create User
     ↓
Assign Role
     ↓
Assign Permissions
     ↓
User Login
     ↓
User sees only permitted modules
     ↓
User creates / manages Leads
     ↓
Activity is recorded in Audit Logs
```

---

## 13. Environment

From `.env` / `.env.example`:

- `PORT` (default 3000)
- `NODE_ENV`
- `DATABASE_URL`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME`
- `CORS_ORIGIN`
- `COOKIE_SECURE`
- `COOKIE_SAMESITE`

---

## 14. Out of scope (not built)

Email/SMS, file uploads, multi-tenant organizations, React SPA, MySQL.
