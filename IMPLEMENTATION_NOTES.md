# Implementation update

## Added in this update

### Client workspace
- Matter document centre with upload, listing and authenticated download.
- Deadline and task creation/listing with completion tracking.
- Notifications inbox with unread state and mark-as-read action.
- Direct dashboard navigation to the new areas.

### Advisor workspace
- Assigned-matter document centre.
- Matter deadlines and task tracking.
- Notifications inbox.
- Dashboard shortcuts and workspace navigation.

### Backend
- Added `matter_documents`, `matter_deadlines`, and `notifications` tables.
- Added authenticated collaboration API routes.
- Added matter membership checks for document listing, upload and download.
- Files are stored outside the public directory using generated storage names.
- Added 10 MB upload limit and an allow-list of file types.
- Added notifications for new client requests, matter status changes, document uploads and deadlines.

## Setup after extracting

1. Open a terminal in `backend`.
2. Run `npm install` (multer is now a backend dependency).
3. Copy `.env.example` to `.env` and enter your own MySQL credentials and a strong JWT secret.
4. Ensure MySQL is running and the configured database exists. The server applies the idempotent SQL schema at startup.
5. Start backend with `npm run dev`.
6. Open another terminal in `frontend`, run `npm install`, then `npm run dev`.
7. Sign in separately as a client and advisor. The advisor must be assigned to a client matter before that advisor can access the matter.

## Important verification notes

This archive contains the implementation, but it has not been run against your local MySQL database or browser session. Test the complete workflow with separate accounts before relying on it. Existing MySQL databases will receive the three new tables on the next backend start.

## Production hardening still required

- Store files in encrypted object storage with malware scanning and signed/short-lived download URLs.
- Add upload quotas, rate limiting, file content inspection and retention rules.
- Add audit history for file access, deadline changes and matter status changes.
- Add scheduled reminder delivery (email/SMS/in-app) and a background job runner. Current notifications are created in-app when application events occur; they are not scheduled reminders or email delivery.
- Add password reset, email verification, backup/restore testing, HTTPS, monitoring and jurisdiction-specific privacy/legal review.
