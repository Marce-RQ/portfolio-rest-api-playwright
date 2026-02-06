# 📘 Phase 0 Learning Guide — Building Your First API

_This guide explains every file and concept in Phase 0 for someone learning API development. Each section answers: What is it? Why do we need it? What does it do?_

---

## 🎯 What We Built in Phase 0

A foundation for an API that:

- Runs in a container (so it works the same everywhere)
- Connects to a database (Postgres)
- Has a simple health check endpoint
- Can be tested automatically with Playwright

Think of this as building the "skeleton" before adding the "muscles" (features).

---

## 📦 Step 1: Package Management (`package.json`)

### What is it?

A manifest file that lists all the code libraries (dependencies) your project needs.

### Why do we need it?

Instead of writing everything from scratch, we reuse battle-tested libraries:

- `express` → makes building web APIs easy
- `pg` → talks to Postgres database
- `bcrypt` → securely hashes passwords
- `jsonwebtoken` → creates secure login tokens
- `playwright` → tests your API automatically

### Key Scripts

```json
"scripts": {
  "dev": "tsx watch src/server.ts",    // Start API, auto-reload on changes
  "build": "tsc",                       // Compile TypeScript → JavaScript
  "migrate": "tsx src/db/migrate.ts",   // Create database tables
  "seed": "tsx src/db/seed.ts",         // Add demo data
  "test": "playwright test"             // Run all tests
}
```

### What you run

```bash
npm install  # Downloads all dependencies listed in package.json
```

---

## 🔧 Step 2: TypeScript Configuration (`tsconfig.json`)

### What is it?

Tells TypeScript how to compile your `.ts` files into `.js` files that Node.js can run.

### Why TypeScript instead of JavaScript?

- **Catch errors before running**: TypeScript checks types (e.g., "this should be a number, not a string")
- **Better autocomplete**: Your editor knows what properties exist
- **Self-documenting**: Code is easier to understand

### Key Settings

- `"strict": true` → Enable all type-checking rules (recommended)
- `"outDir": "./dist"` → Compiled JavaScript goes here
- `"rootDir": "./src"` → Your source code lives here

---

## 🐳 Step 3: Docker Setup (`docker-compose.yml` + `Dockerfile`)

### What is Docker?

A tool that packages your app + all its dependencies into a "container" — a mini computer that runs the same on every machine.

When someone clones your repo, they get the code but not necessarily the exact versions of the runtime and system dependencies the code expects (for example, a Python interpreter and OS libraries). Those differences across computers are a common reason apps behave differently even though the code is identical.

Docker standardizes what’s “around” the code by packaging what’s needed to run it (dependencies, libraries, settings) into a container image and running it as a container. That means a newcomer doesn’t have to manually install and match a long list of tools on their own machine to get started; they mainly need Docker and the project’s container setup files (like a Dockerfile).

### Why use Docker?

- **"Works on my machine" problem solved**: Same environment everywhere (dev, CI, production)
- **Easy database setup**: No manual Postgres installation
- **Isolation**: Your API and database run in their own containers

### `docker-compose.yml` Breakdown

```yaml
services:
  db:
    image: postgres:16-alpine # Use official Postgres image
    environment:
      POSTGRES_USER: api_user
      POSTGRES_PASSWORD: api_pass
      POSTGRES_DB: fintech_api
    ports:
      - "5432:5432" # Expose Postgres on localhost:5432
    healthcheck: # Wait until DB is ready
      test: ["CMD-SHELL", "pg_isready -U api_user -d fintech_api"]
      interval: 5s

  api:
    build:
      context: .
      dockerfile: Dockerfile # Build API from our Dockerfile
    ports:
      - "3000:3000" # Expose API on localhost:3000
    depends_on:
      db:
        condition: service_healthy # Wait for DB to be ready
    command: sh -c "npm run migrate && npm run seed && npm run dev"
```

**Flow:**

1. DB starts → waits until healthy
2. API builds → waits for DB
3. API runs migrations → seeds data → starts server

### `Dockerfile` Breakdown

```dockerfile
FROM node:20-alpine                    # Base image (lightweight Node.js)

WORKDIR /app                           # Set working directory inside container

COPY package*.json ./                  # Copy package files first (caching)
RUN npm install                        # Install dependencies

COPY . .                               # Copy rest of the code
RUN npm run build                      # Compile TypeScript

EXPOSE 3000                            # Document which port the app uses

CMD ["npm", "start"]                   # Default command (run compiled code)
```

**Why copy package.json first?**  
Docker caches layers. If dependencies don't change, it skips `npm install` (much faster rebuilds).

---

## 🗄️ Step 4: Database Connection (`src/db/pool.ts`)

### What is it?

A "pool" of reusable database connections.

### Why not create a new connection every time?

Opening/closing connections is slow. A pool maintains 5-10 open connections and reuses them.

```typescript
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // e.g., postgresql://user:pass@db:5432/fintech_api
});
```

**How it's used:**

```typescript
const result = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
```

---

## 🏗️ Step 5: Migrations (`src/db/migrate.ts`)

### What are migrations?

Scripts that create/modify database tables in a repeatable, version-controlled way. Each person gets their own local db when they run the project.

- When someone clones and runs docker compose up, Docker starts a Postgres container on their machine and the migrations/seed create DB objects inside that container. Those users do not see your local DB.
- The demo user/account seeded by the project exists only in the local DB container started for that clone.
- CI runs in ephemeral containers too, so each job gets its own DB instance unless you explicitly use a shared external database.

### Why not create tables manually?

- **Repeatable**: Run `npm run migrate` on any machine → same schema
- **Version control**: Schema changes are tracked in Git
- **Team sync**: Everyone gets the same tables

### Our Migrations

**Migration 1: Users table**

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),   -- Auto-generated unique ID
  email TEXT UNIQUE NOT NULL,                      -- User's email (must be unique)
  password_hash TEXT NOT NULL,                     -- Hashed password (never store plaintext!)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- When user was created
);
```

**Migration 2: Accounts table**

```sql
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- Foreign key to users
  currency TEXT NOT NULL CHECK (currency IN ('EUR', 'USD')),     -- Only allow EUR or USD
  balance NUMERIC(15, 2) DEFAULT 0 CHECK (balance >= 0),         -- Can't go negative
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration 3: Transactions table**

```sql
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('deposit')),               -- Only deposits in v1
  amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),            -- Must be positive
  reference TEXT,                                                -- Optional note
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);  -- Speed up lookups
```

**Why UUIDs instead of auto-incrementing IDs?**

- Harder to guess (security)
- No collisions when merging databases
- Can generate client-side

---

## 🌱 Step 6: Seed Data (`src/db/seed.ts`)

### What is seeding?

Adding initial data (like a demo user) so you can test the API immediately.

### Our Seed Script

```typescript
// Hash the password securely
const passwordHash = await bcrypt.hash("demo123", 10);

// Insert demo user
await client.query(`INSERT INTO users (email, password_hash) VALUES ($1, $2)`, [
  "demo@qa.com",
  passwordHash,
]);
```

**Why hash passwords?**  
If someone steals the database, they can't see plaintext passwords. Hashing is one-way: you can check if a password matches, but can't reverse the hash.

**Demo credentials:**

- Email: `demo@qa.com`
- Password: `demo123`

---

## 🌐 Step 7: Express API (`src/app.ts` + `src/server.ts`)

### What is Express?

A lightweight web framework for Node.js. It handles HTTP requests/responses.

### Architecture

**`server.ts`** (entry point)

```typescript
import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
```

**`app.ts`** (app configuration)

```typescript
import express from "express";
import healthRouter from "./routes/health";

const app = express();

app.use(express.json()); // Parse JSON request bodies
app.use("/health", healthRouter); // Register health route

// 404 handler (when no route matches)
app.use((req, res) => {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Route not found" },
  });
});

export default app;
```

### Request Flow

```
Client → Express → Middleware → Route Handler → Response
```

1. **Client** sends HTTP request (e.g., `GET /health`)
2. **Middleware** runs first (`express.json()` parses body, logging, etc.)
3. **Route Handler** executes (`healthRouter`)
4. **Response** sent back to client

---

## 🏥 Step 8: Health Endpoint (moved to Phase 1)

The health endpoint is covered in the Phase 1 learning guide. It provides a simple readiness check used by CI and health monitoring.

See: [PHASE_1_LEARNING_GUIDE.md](PHASE_1_LEARNING_GUIDE.md) for the implementation, rationale, and Playwright test examples.

---

## 🧪 Step 9: Playwright Setup (`playwright.config.ts`)

### What is Playwright?

A testing framework originally for browser automation, but also great for testing APIs.

### Why Playwright for API testing?

- Built-in `request` object (no need for axios/fetch)
- Parallel test execution
- Rich assertions
- Great reporting

### Configuration

```typescript
export default defineConfig({
  testDir: "./tests", // Where tests live
  fullyParallel: true, // Run tests in parallel
  use: {
    baseURL: "http://localhost:3000", // Default base URL
    extraHTTPHeaders: {
      "Content-Type": "application/json", // All requests send JSON
    },
  },
});
```

---

## ✅ Step 10: First Test (`tests/api/health.spec.ts`)

### Anatomy of a Test

```typescript
import { test, expect } from "@playwright/test";

test.describe("Health Endpoint", () => {
  // Group related tests
  test("GET /health returns 200 with status ok", async ({ request }) => {
    // ARRANGE: (no setup needed for health check)

    // ACT: Make HTTP request
    const response = await request.get("/health");

    // ASSERT: Check response
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });
});
```

### Test Structure (AAA Pattern)

1. **Arrange**: Set up test data (login, create resources, etc.)
2. **Act**: Perform the action you're testing (make API call)
3. **Assert**: Verify the outcome (check status, body, etc.)

---

## 🔐 Step 11: Environment Variables (`.env.example`)

### What are environment variables?

Configuration values that change per environment (dev, CI, production).

### Why not hardcode them?

- **Security**: Secrets (passwords, API keys) shouldn't be in code
- **Flexibility**: Different values for dev vs production
- **12-Factor App**: Best practice for modern apps

### Our Variables

```bash
# Database
DATABASE_URL=postgresql://api_user:api_pass@db:5432/fintech_api

# API
PORT=3000
JWT_SECRET=your-secret-key-change-in-production

# Tests
API_BASE_URL=http://localhost:3000
```

**Setup:**

```bash
cp .env.example .env   # Copy template to .env (Git-ignored)
```

---

## 🚀 Step 12: Running Everything

### One Command to Rule Them All

```bash
docker compose up -d --build
```

**What happens (in order):**

1. 📥 Docker builds the API image (Dockerfile)
2. 🗄️ Postgres starts → healthcheck passes
3. 🔄 API service starts
4. 🏗️ Migrations run (`CREATE TABLE ...`)
5. 🌱 Seed runs (creates demo@qa.com)
6. 🚀 API server listens on port 3000

### Verify It's Working

```bash
# Check health endpoint
curl http://localhost:3000/health
# Response: {"status":"ok"}

# Run tests
npm test
# Should see 1 passing test
```

---

## 🧩 How It All Connects

```
┌─────────────────────────────────────────────────────┐
│  Developer                                          │
│  runs: docker compose up                            │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Docker Compose                                     │
│  - Starts Postgres (port 5432)                     │
│  - Starts API (port 3000)                          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  API Container                                      │
│  1. npm run migrate → Creates tables               │
│  2. npm run seed    → Adds demo user               │
│  3. npm run dev     → Starts Express               │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Express App (src/app.ts)                          │
│  - Registers routes (/health, /auth, etc.)        │
│  - Handles JSON parsing                            │
│  - Error handling                                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│  Route Handler (src/routes/health.ts)              │
│  - Receives GET /health                            │
│  - Returns { status: 'ok' }                        │
└─────────────────────────────────────────────────────┘
```

---

## 🎓 Key Takeaways

1. **Docker Compose** = Easy multi-service orchestration (DB + API)
2. **Migrations** = Version-controlled database schema
3. **Seed data** = Pre-populated data for testing
4. **Express** = Web framework for building APIs
5. **Playwright** = Testing framework for API automation
6. **TypeScript** = JavaScript + type safety
7. **Environment variables** = Configuration without hardcoding

---

## 🔜 What's Next?

Now that the foundation is solid, we'll add:

- **Phase 1**: Authentication (login, JWT tokens)
- **Phase 2**: Accounts (create, read)
- **Phase 3**: Deposits (state mutations)
- **Phase 4**: Transactions (pagination, filtering)
- **Phase 5**: CI pipeline (GitHub Actions)

Each phase builds on the previous one. You now have a working API skeleton—everything else is just adding routes and tests!

## For QA engineers

- Purpose: verify the local runtime, DB, migrations, and basic API readiness before feature testing.
- Key checks:
  - Docker and database containers start successfully.
  - `npm run migrate` completes without errors.
  - `npm run seed` creates the demo user (`demo@qa.com`).
  - `GET /health` returns `200` (readiness check — Phase 1 will detail this).
- Test data/setup:
  - Use the seeded demo user for downstream feature tests.
  - Avoid depending on host-specific `node_modules`; run inside the container if testing native modules.
- How to run locally:

```bash
docker compose up -d --build
npm run migrate
npm run seed
```

- Tips: Validate error shapes (consistent `error.code`) in early smoke tests so later tests can rely on them.

---

## 📚 Further Reading

- [Express.js Documentation](https://expressjs.com/)
- [Playwright API Testing](https://playwright.dev/docs/api-testing)
- [PostgreSQL Basics](https://www.postgresql.org/docs/current/tutorial.html)
- [Docker Compose Guide](https://docs.docker.com/compose/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

**Questions?** Each phase will have its own learning guide like this one. Keep this open as reference when working through later phases!
