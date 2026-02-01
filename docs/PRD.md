# PRD — api-playwright-portfolio (Mini Fintech API + Playwright API Tests)

## 1) Purpose

Build a small, API-only backend (Express + Postgres) and an automated Playwright API test suite that demonstrates QA automation skills: auth, stateful data, validations, negative tests, and pagination.

This is a portfolio project. The tests are the “main product”; the backend stays intentionally small and easy to understand.
### Learning Documentation

Each phase includes a detailed learning guide (`PHASE_X_LEARNING_GUIDE.md`) that explains:
- **What** each component does
- **Why** it's needed
- **How** it connects to other parts
- Step-by-step walkthrough for beginners

These guides are designed for developers new to API development, with clear explanations of every file, library, and concept introduced.
---

## 2) Non-negotiables (Free-first)

- $0 cost: no cloud deployment required.
- Everything runs locally with Docker Compose (Postgres + API).
- CI runs on GitHub Actions in a public repo (free for standard GitHub-hosted runners in public repositories).  
  Source: GitHub docs. (Link in README)

---

## 3) Tech stack (fixed)

- API: Node.js + Express + TypeScript
- DB: Postgres
- Tests: Playwright Test (TypeScript), using API testing via the built-in request capabilities (no UI required)
- Orchestration: Docker Compose (local + CI)

---

## 4) API conventions

### Auth

- Protected endpoints require: `Authorization: Bearer <JWT>`

### Content type

- JSON only (request/response): `Content-Type: application/json`

### Error format (consistent)

Return JSON in this structure:

- 400: `{ "error": { "code": "VALIDATION_ERROR", "message": "..." } }`
- 401: `{ "error": { "code": "UNAUTHORIZED", "message": "..." } }`
- 404: `{ "error": { "code": "NOT_FOUND", "message": "..." } }`

---

## 5) Database schema (minimal)

### Tables

- users
  - id (uuid, pk)
  - email (text, unique)
  - password_hash (text)
  - created_at (timestamp)

- accounts
  - id (uuid, pk)
  - user_id (uuid, fk -> users.id)
  - currency (text)
  - balance (numeric)
  - created_at (timestamp)

- transactions
  - id (uuid, pk)
  - account_id (uuid, fk -> accounts.id)
  - type (text) // v1: "deposit"
  - amount (numeric)
  - reference (text, nullable)
  - created_at (timestamp)

### Data rules

- `accounts.balance` starts at 0
- Deposits must create a transaction row AND update balance inside a DB transaction

---

## 6) Phased delivery plan (build in order)

### Phase 0 — Repo + local runtime (foundation)

**Goal:** One command starts DB + API.

Deliverables:

- docker-compose.yml with:
  - db (postgres)
  - api (node/express)
- .env.example (no real secrets)
- DB migrations + a seed script (seed 1 demo user)
- Playwright installed + runnable

Acceptance criteria:

- `docker compose up -d --build` works
- `curl http://localhost:3000/health` works after Phase 1
- `npx playwright test` runs (can be a placeholder initially)

---

### Phase 1 — Health endpoint (easiest)

Endpoint:

- `GET /health`
  - 200: `{ "status": "ok" }`

Tests (Playwright):

- status = 200
- body.status = "ok"

Acceptance criteria:

- This endpoint is used as readiness check in CI.

---

### Phase 2 — Auth (JWT) + protected route

DB seed requirement:

- Create 1 user in Postgres, e.g. demo@qa.com / demo123 (password stored hashed)

Endpoints:

- `POST /auth/login`
  - body: `{ "email": string, "password": string }`
  - 200: `{ "token": string }`
  - 401 on invalid credentials
- `GET /me` (protected)
  - 200: `{ "id": string, "email": string }`
  - 401 if token missing/invalid

Tests:

- login success returns token
- login invalid returns 401
- /me without token returns 401
- /me with token returns expected user

Acceptance criteria:

- Tests can get a JWT once and reuse it cleanly (helper or fixture).

---

### Phase 3 — Accounts (Create + Read)

Endpoints (protected):

- `POST /accounts`
  - body: `{ "currency": "EUR" | "USD" }`
  - 201: `{ "id": string, "currency": string, "balance": number }` (balance 0)
  - 400 on invalid currency
- `GET /accounts/:id`
  - 200: `{ "id": string, "currency": string, "balance": number }`
  - 404 if not found

Tests:

- Create account then fetch it by id
- 404 for unknown id
- 401 when missing token
- 400 for invalid currency

Acceptance criteria:

- Tests do not rely on hardcoded account IDs.

---

### Phase 4 — Deposits (state mutation)

Endpoint (protected):

- `POST /deposits`
  - body: `{ "accountId": string, "amount": number, "reference"?: string }`
  - rules: amount > 0, account exists
  - behavior: (1) insert transaction (2) update balance, in a DB transaction
  - 201: `{ "transactionId": string, "newBalance": number }`

Tests:

- Deposit increases balance
- amount <= 0 returns 400
- unknown account returns 404
- missing token returns 401

Acceptance criteria:

- Balance and transaction record are consistent.

---

### Phase 5 — Transactions list + pagination

Endpoint (protected):

- `GET /transactions?accountId=&page=&limit=`
  - accountId required
  - defaults: page=1, limit=20
  - limit max: 100
  - sorting: deterministic (e.g., created_at desc)

Response:

- 200: `{ "items": Transaction[], "page": number, "limit": number, "total": number }`

Tests:

- Returns only the given account’s transactions
- limit respected
- page beyond last returns empty items
- invalid page/limit returns 400

Acceptance criteria:

- Tests can create multiple deposits and validate pagination.

---

## 7) What is intentionally NOT included (v1)

- External hosting / production deployment
- Transfers, idempotency keys, webhooks (optional v2 only)

---

## 8) CI requirements (free)

A GitHub Actions workflow must:

- Checkout
- Start docker compose (db + api)
- Wait for `GET /health` to return 200
- Run `npx playwright test`
- Always run `docker compose down -v`

---

# Appendix A — Suggested repo structure

.
├── PRD.md
├── README.md
├── docker-compose.yml
├── .env.example
├── package.json
├── playwright.config.ts
├── src/
│ ├── server.ts
│ ├── app.ts
│ ├── db/
│ │ ├── pool.ts
│ │ ├── migrations/
│ │ ├── seed.ts
│ └── routes/
│ ├── health.ts
│ ├── auth.ts
│ ├── accounts.ts
│ ├── deposits.ts
│ └── transactions.ts
└── tests/
└── api/
├── health.spec.ts
├── auth.spec.ts
├── accounts.spec.ts
├── deposits.spec.ts
└── transactions.spec.ts
