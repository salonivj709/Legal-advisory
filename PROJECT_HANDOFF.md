# Project handoff – CounselConnect

## Work completed in this update

- Fixed the client workspace flex layout so the sidebar and main content render side by side.
- Reworked the client dashboard with loading, error, refresh, and empty states.
- Completed client request, consultation request, message, and profile screens.
- Added advisor dashboard, assigned matter list, matter status updates, consultation list, messages, and profile screens.
- Added administrator legal request management with advisor assignment and request status controls.
- Added a contacts endpoint that returns clients/advisors connected through assigned legal matters.
- Scoped client data to the signed-in client and advisor matter/consultation data to assigned work.
- Added backend checks for request ownership, advisor assignment, and messaging relationships.
- Added environment templates and setup documentation.
- Removed the uploaded backend `.env` file from the deliverable. Configure a new local `.env` from `.env.example`.

## Validation performed

- All backend JavaScript files passed `node --check`.
- A frontend production build could not be completed in this execution environment because the uploaded `node_modules` package cache did not contain the platform-specific native Vite/Rolldown and Oxlint bindings. The dependencies were excluded from the deliverable. Run `npm install` in `frontend` on the development machine, then `npm run build`.

## Before using this project

1. Create a fresh `backend/.env` from `backend/.env.example`.
2. Use a new, strong `JWT_SECRET` and your own MySQL credentials.
3. Run the SQL schema in MySQL.
4. Install dependencies separately in `backend` and `frontend`.
5. Test client registration, administrator login, advisor creation/assignment, client request submission, advisor status update, consultation request, and message exchange with separate accounts.

The application is a working development foundation. Production readiness still requires end-to-end testing against your actual MySQL database, HTTPS, rate limiting, email verification/password recovery, audit logging, backup/retention policies, and legal/privacy review.
