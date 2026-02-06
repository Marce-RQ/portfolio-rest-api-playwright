## Phase 3 — Accounts Learning Guide

Purpose

- Implement account creation and retrieval so users can create currency-specific accounts and later perform deposits (Phase 4).

What

- `src/routes/accounts.ts`: Protected endpoints for creating accounts (`POST /accounts`) and fetching by id (`GET /accounts/:id`).
- DB migrations: `src/db/migrate.ts` includes the `accounts` table with `user_id`, `currency`, `balance`.
- `tests/api/accounts.spec.ts`: Playwright tests validating create/read behavior and error cases.

Why

- Accounts model separates balances per currency and per user, providing a clear boundary for transactions and reporting.

How it works (high level)

- `POST /accounts` expects `{ "currency": "EUR"|"USD" }` and creates an account row with `balance = 0` linked to the authenticated user.
- `GET /accounts/:id` returns the account only if it belongs to the authenticated user; otherwise `404`.
- Validation enforces allowed currencies and requires authentication.

Step-by-step (for beginners)

1. Ensure database is migrated and seeded (demo user exists):

```bash
npm run migrate
npm run seed
```

2. Start the app (Docker or `npm run dev`).
3. Obtain a token via `/auth/login` (see Phase 2 guide).
4. Create an account (example):

```bash
curl -s -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"currency":"EUR"}'
```

5. Fetch the account by id:

```bash
curl -s http://localhost:3000/accounts/<ACCOUNT_ID> \
  -H "Authorization: Bearer <TOKEN>"
```

Error cases covered in tests

- Missing or invalid `currency` → `400` `{ error: { code: 'VALIDATION_ERROR', ... } }`.
- Missing token → `401` `{ error: { code: 'UNAUTHORIZED', ... } }`.
- Requesting an account that doesn't exist (or doesn't belong to user) → `404`.

How to extend

- Add additional currencies by updating the DB constraint and the route validation.
- Add listing of accounts for a user: `GET /accounts` with pagination.
- Add integration with `transactions` in Phase 4 to mutate `balance`.

Files to review

- [src/routes/accounts.ts](src/routes/accounts.ts)
- [src/db/migrate.ts](src/db/migrate.ts)
- [tests/api/accounts.spec.ts](tests/api/accounts.spec.ts)

## For QA engineers

- Purpose: verify account creation, validation, and access control for user accounts.
- Test checklist:
  - `POST /accounts` happy path: 201 + `{ id, currency, balance: 0 }` when authenticated.
  - `POST /accounts` invalid currency: 400 with `error.code = 'VALIDATION_ERROR'`.
  - `POST /accounts` without token: 401 with `error.code = 'UNAUTHORIZED'`.
  - `GET /accounts/:id` for existing account: 200 with expected fields (only when owned by auth user).
  - `GET /accounts/:id` unknown or not-owned: 404 with `error.code = 'NOT_FOUND'`.
- Test data & setup:
  - Obtain token via `/auth/login` using seeded demo user.
  - Create accounts within tests and use returned IDs for retrieval — avoid hardcoded IDs.
- How to run locally:

```bash
npm run migrate
npm run seed
npx playwright test tests/api/accounts.spec.ts
```

- Tips: Verify DB side-effects where useful (e.g., `balance` is numeric 0) and include negative cases.
