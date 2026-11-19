# Admin workspace update

## What was added
- Admin overview cards and request/user metrics.
- User Management with search, role filters, status filters, role updates and account status updates.
- Access Control page documenting the current `admin`, `advisor`, and `client` role permissions enforced by backend route middleware.
- Platform Settings form persisted in MySQL (`platform_settings`).
- Admin-only API endpoints protected by JWT and `authorizeRoles('admin')`.

## Setup
1. Copy `backend/.env.example` to `backend/.env` and enter your own MySQL credentials and a strong JWT secret. Do not commit `.env`.
2. Ensure MySQL is running and the database `fractional_counsel_db` exists. The server creates the project tables and `platform_settings` table on startup.
3. In a terminal: `cd backend`, then `npm install`, then `node createAdmin.js` if you need to create the first admin (use the credentials in your local `.env`). Start with `npm run dev` if the backend package defines it, otherwise `node server.js`.
4. In another terminal: `cd frontend`, `npm install`, `npm run dev`.
5. Sign in with the admin account. Open Admin Dashboard and use the three navigation pages.

Frontend API base URL defaults to `http://localhost:5000/api`; override with `frontend/.env` containing `VITE_API_URL=http://localhost:5000/api` if required.

## Important notes
- The current access-control screen describes the existing role model; it is not a custom permission editor.
- Maintenance mode and registration switches are stored and editable. They are not automatically enforced by the public registration or general application middleware in this update.
- User role changes take effect for newly issued JWTs. A user with an existing token may need to sign out and sign in again.
- The archive excludes `node_modules` and the machine-specific `.env`; install dependencies and supply your local environment values after extracting.
