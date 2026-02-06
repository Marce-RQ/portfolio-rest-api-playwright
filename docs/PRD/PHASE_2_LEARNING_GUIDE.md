## Phase 2 — Auth (JWT) Learning Guide

Purpose

- Implement a simple JWT-based authentication system so tests and clients can authenticate and access protected endpoints.

What

- `src/middleware/auth.ts`: Express middleware that validates `Authorization: Bearer <JWT>` and attaches `userId` to the request.
- `src/routes/auth.ts`: `/auth/login` endpoint that verifies credentials and returns a signed JWT.
- `src/app.ts`: the protected `/me` endpoint mounted at root that returns the current user's `id` and `email`.
- `src/db/seed.ts`: creates a demo user (`demo@qa.com` / `demo123`) with a bcrypt-hashed password.
- `tests/api/auth.spec.ts`: Playwright API tests that exercise login and the protected `/me` route.

Why

- Authentication is required to protect user-specific resources (accounts, deposits, transactions).
- JWTs are stateless and simple to use in API tests; they let tests obtain a token once and reuse it for subsequent requests.

How it works (high level)

- Client posts email/password to `/auth/login`.
- Server looks up the user in Postgres and uses `bcrypt.compare` to verify the password.
- On success the server signs a JWT containing `{ userId }` and returns it.
- Protected endpoints use `authMiddleware` to verify the token and set `req.userId`.

Step-by-step (for beginners)

1. Ensure your `.env` has `JWT_SECRET` set (see `.env.example`).
2. Run database migrations and seed (creates demo user):

```bash
npm run migrate
npm run seed
```

3. Start the app locally (Docker or `npm run dev`).
4. To manually test login:

```bash
curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@qa.com","password":"demo123"}'
```

5. Use the returned token to call `/me`:

```bash
curl -s http://localhost:3000/me -H "Authorization: Bearer <TOKEN>"
```

Notes & tips

- Keep `JWT_SECRET` different in CI vs local; `.env.example` includes a placeholder.
- `bcrypt` is used for password hashing. In Docker we ensure `node_modules` are installed inside the container to avoid native binary mismatches.
- Playwright tests obtain a token via `/auth/login` and reuse it in headers for protected requests.

Files to review

- [src/middleware/auth.ts](src/middleware/auth.ts)
- [src/routes/auth.ts](src/routes/auth.ts)
- [src/db/seed.ts](src/db/seed.ts)
- [tests/api/auth.spec.ts](tests/api/auth.spec.ts)

## For QA engineers

- Purpose: validate auth correctness, error handling, and that protected routes enforce authorization.
- Test checklist:
  - `POST /auth/login` happy path: 200 + `{ token }` using seeded `demo@qa.com` / `demo123`.
  - `POST /auth/login` invalid credentials: 401 with `error.code = 'UNAUTHORIZED'`.
  - `POST /auth/login` missing fields: 400 with `error.code = 'VALIDATION_ERROR'`.
  - `GET /me` without token: 401 with `error.code = 'UNAUTHORIZED'`.
  - `GET /me` with invalid token: 401 with `error.code = 'UNAUTHORIZED'`.
  - `GET /me` with valid token: 200 + `{ id, email }` matching seeded user.
- Test data & setup:
  - Run `npm run migrate` and `npm run seed` to ensure the demo user exists.
  - Prefer requesting a token via `/auth/login` in tests rather than hardcoding tokens.
- How to run locally:

```bash
npm run migrate
npm run seed
npx playwright test tests/api/auth.spec.ts
```

- Tips: Assert consistent error JSON shape (code + message) in QA tests; verify token reuse across requests.
