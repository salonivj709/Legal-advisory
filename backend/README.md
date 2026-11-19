# Backend

Express REST API backed by MySQL.

## Run locally

1. Run `database/schema.sql` in MySQL.
2. Copy `.env.example` to `.env` and set database credentials and a strong `JWT_SECRET`.
3. Run `npm install`.
4. Run `npm run dev`.

Health endpoint: `GET http://localhost:5000/api/health`.

Keep controller logic in `controllers/`, route declarations in `routes/`, and authentication/authorization in `middleware/`. Never commit `.env`.
