# CounselConnect — Fractional General Counsel Platform

A role-based legal advisory workspace for clients, advisors and administrators.

## Requirements
- Node.js 20+ (Node.js 22 recommended)
- MySQL 8+
- npm

## 1. Configure the database
1. Create a MySQL database named `fractional_counsel_db` (or choose another name in `.env`).
2. Open `backend/.env.example`, copy it to `backend/.env`, and enter your local MySQL credentials.
3. Use a long, private value for `JWT_SECRET`. Do not commit `.env` to Git.
4. The backend applies the idempotent SQL schema during startup.

## 2. Install and run the backend
```bash
cd backend
npm install
npm run dev
```
The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

## 3. Install and run the frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Open the Vite URL, normally `http://localhost:5173`.

If your backend runs elsewhere, create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```
Restart Vite after changing environment variables.

## 4. Create an administrator
After the database is configured and backend dependencies are installed:
```bash
cd backend
node createAdmin.js
```
Set `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `backend/.env` first.

## Project structure
- `frontend/src/pages/client`: client dashboard, requests, consultations, messages and profile
- `frontend/src/pages/advisor`: advisor dashboard and matter workspace
- `frontend/src/pages/admin`: administration pages
- `frontend/src/pages/shared`: secure documents, deadlines and notifications
- `backend/controllers`: API business logic
- `backend/routes`: API route definitions
- `backend/middleware`: authentication and role authorization
- `backend/database/schema.sql`: MySQL schema

## Important security notes
- Uploaded matter files are stored under `backend/private_uploads`, outside public static hosting.
- Keep `.env` and `private_uploads` out of source control and backups shared outside the authorized team.
- Before production use, add HTTPS, a production-grade private file store, malware scanning, audit logging, backup/restore testing, rate limiting and a jurisdiction-specific legal/privacy review.
- This is a development handoff, not a claim that the platform is production-certified.
