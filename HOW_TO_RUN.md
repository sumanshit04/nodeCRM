# How to run Pulse CRM (without Cursor)

You do not need Cursor. Use Node.js, PostgreSQL, and a browser.

## 1. Prerequisites

- Node.js 18+ installed
- PostgreSQL running (Adminer is fine if you already use it)

## 2. Open a terminal in the project folder

```powershell
cd d:\nodeProject
```

## 3. Start the app

If you already ran `npm install` and seeded the database once:

```powershell
npm start
```

Then open **http://localhost:3000**

### Logins

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@crm.local   | Admin@123  |
| User  | john@crm.local    | User@1234  |

Stop the server with **Ctrl+C**.

---

## If it is a new PC, or `node_modules` is missing

```powershell
cd d:\nodeProject
npm install
npm run db:setup
npm start
```

`db:setup` creates the `crm_system` database if needed, applies migrations, and seeds the admin/user accounts.

Your `.env` file should contain:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/crm_system?schema=public"
```

## PostgreSQL / Adminer

- Username: `postgres`
- Password: `password`
- Database: `crm_system`

If PostgreSQL is not running, start the **postgresql-x64-17** Windows service first, then run `npm start`.
