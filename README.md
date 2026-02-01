# Portfolio API + Playwright Tests

A minimal fintech API with comprehensive Playwright API test suite. Built to demonstrate QA automation skills: authentication, stateful operations, validations, and pagination testing.

## 📋 What's Inside

- **API**: Express + TypeScript + Postgres
- **Tests**: Playwright API testing (no UI)
- **Orchestration**: Docker Compose
- **Cost**: $0 (runs locally + GitHub Actions)

## 🚀 Quick Start

### Prerequisites

- Docker Desktop or Docker Engine + Compose
- Node.js 20+
- npm

### Setup & Run (Docker-first — recommended)

Follow these commands from the project root. The project is built to run with Docker Compose; this is the recommended flow.

```bash
# 1. Clone and enter directory
cd portfolio-api-playwright

# 2. Copy environment file (do not commit .env)
cp .env.example .env

# 3. Install dependencies (required for building the API image)
npm install

# 4. Build and start services (Postgres + API)
docker compose up -d --build

# 5. Verify the API is ready
curl http://localhost:3000/health  # expect: {"status":"ok"}

# 6. Run Playwright tests
npm test

# 7. When finished, stop services (use -v to wipe DB data)
docker compose down        # stop but keep volumes (data persists)
docker compose down -v     # stop and remove volumes (reset DB)
```

If you prefer not to use Docker, see `DOCKER_SETUP.md` for platform-specific alternatives (local Postgres on macOS, Windows, or WSL). The repository and CI assume the Docker-first workflow.

### What Happens on Startup

When you run `docker compose up`:

1. Postgres starts and waits for readiness
2. API service builds and starts
3. Migrations run automatically (creates tables)
4. Seed script runs (creates demo@qa.com user)
5. API becomes available at http://localhost:3000

### Available Commands

```bash
# Development
npm run dev              # Run API in watch mode (outside Docker)
npm run build            # Compile TypeScript to dist/
npm run start            # Run compiled API

# Database
npm run migrate          # Run migrations manually
npm run seed             # Seed demo user manually

# Testing
npm test                 # Run all Playwright tests
npm run test:ui          # Run tests with Playwright UI

# Database Validation (QA Tools)
npm run db:check-users                    # List all users
npm run db:check-user -- <email>          # Check specific user
npm run db:check-accounts                 # List all accounts
npm run db:check-account -- <account_id>  # Check specific account
npm run db:check-transactions -- <id>     # List transactions
npm run db:stats                          # Database statistics
npm run db:verify-integrity               # Run integrity checks

# Docker
docker compose up -d     # Start services in background
docker compose down      # Stop services
docker compose down -v   # Stop and remove volumes (clean DB)
docker compose logs api  # View API logs
```

## 📚 Project Structure

```
.
├── docs/
│   └── PRD.md                    # Product Requirements
├── src/
│   ├── server.ts                 # Entry point
│   ├── app.ts                    # Express app setup
│   ├── db/
│   │   ├── pool.ts               # Postgres connection
│   │   ├── migrate.ts            # Database migrations
│   │   └── seed.ts               # Seed data (demo user)
│   └── routes/
│       └── health.ts             # Health check endpoint
├── tests/
│   └── api/
│       └── health.spec.ts        # Health endpoint tests
├── docker-compose.yml            # Local orchestration
├── Dockerfile                    # API container
├── playwright.config.ts          # Test configuration
└── package.json                  # Dependencies & scripts
```

## 🧪 Current Phase: Phase 0 ✅

- [x] Docker Compose setup
- [x] Database migrations (users, accounts, transactions tables)
- [x] Seed script (demo user)
- [x] Health endpoint (`GET /health`)
- [x] Playwright configured
- [x] First test passing

## 📖 Documentation

- [PRD.md](docs/PRD.md) - Full product requirements and phased delivery plan
- [DATABASE_VALIDATION_GUIDE.md](docs/DATABASE_VALIDATION_GUIDE.md) - Complete guide to database validation for QA
- [DB_VALIDATION_QUICK_REFERENCE.md](docs/DB_VALIDATION_QUICK_REFERENCE.md) - Quick reference for database validation commands
- [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) - API endpoints and usage

## 🔐 Demo Credentials

```
Email: demo@qa.com
Password: demo123
```

## 📝 License

MIT

## After running tests — simple cleanup steps

When tests finish, the project may leave small helper services running in Docker. These use memory and CPU. If you don’t need them anymore, stop them using one of the commands below.

- Stop and keep the data (recommended if you want to inspect results later):

```bash
docker compose down
```

- Stop and remove all data (reset to a clean state):

```bash
docker compose down -v
```

If you are not sure which to use:

- Run `docker compose down` — this safely stops services but keeps your data.
- If you want everything removed (for a fresh start), run `docker compose down -v`.

Quick checks (helpful if something looks wrong):

- See running containers: `docker ps`
- View API logs: `docker compose logs api`

Optional automatic cleanup:

- If you prefer the test runner to stop and remove containers automatically after tests, set this environment variable before running tests:

```bash
PLAYWRIGHT_AUTO_TEARDOWN=true npm test
```

Otherwise, run the `docker compose down` command manually when you're done.
