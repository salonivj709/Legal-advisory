# Frontend

React application built with Vite.

## Run locally

1. Run `npm install`.
2. Copy `.env.example` to `.env` if the API is not at `http://localhost:5000/api`.
3. Run `npm run dev`.

Build for production with `npm run build`.

The frontend uses the shared Axios client in `src/services/api.js`; it adds the JWT from local storage to authenticated API requests. Route protection improves navigation UX, while the backend remains responsible for enforcing permissions.
