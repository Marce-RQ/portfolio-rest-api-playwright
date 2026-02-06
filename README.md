# REST API Playwright Tests

This is a minimal fintech API that you can clone and run locally for FREE.

Check out the [GUIDE](docs/QA_API_TESTING_GUIDE.md) if you are new to API testing automation.


## 📋 What's Inside

- **API**: Express + TypeScript + Postgres
- **Tests**: Playwright API testing (no UI)
- **Orchestration**: Docker Compose
- **Cost**: $0

## Coverage
- **Authentication** (login, logout, register)
- **Stateful POST/GET operations** (account creation, deposits)
- **Input validation** (invalid credentials, invalid data)
- **Pagination** (account list)
- **Authorization** (unauthorized access)

## Prerequisites & Setup

### Required Knowledge
- Basic understanding of HTTP methods (GET, POST, PUT, DELETE)
- Familiarity with JSON data format
- Basic command line usage

### Tools You'll Need Installed
- **Docker Desktop** [Download](https://www.docker.com/products/docker-desktop/)
- **Node.js 20+** [Download](https://nodejs.org/en/download/) (includes npm)
- **API Testing Tool** (Optional) recommended for manual testing first:
  - Postman, Insomnia, Thunder Client, or curl
- **Code Editor** (VS Code recommended)
- **Playwright** (Installed automatically with npm install)

----

### Quick Setup Commands

**Clone and run these commands:**
```bash
# 1. Clone and enter directory
git clone https://github.com/Marce-RQ/portfolio-rest-api-playwright.git
cd portfolio-api-playwright

# 2. Copy environment file (do not commit .env)
cp .env.example .env

# 3. Install dependencies
npm install

# 4. Install Playwright browsers (required for testing)
npx playwright install

# 5. Start services with Docker (assuming Docker Desktop is downloaded and running)
docker compose up -d --build

# 6. Verify API is running
curl http://localhost:3000/health

# 7. Run tests
npm test

# 8. Stop services when done (Use this once you stop testing to free up your computer's resources)
docker compose down
```

## 📚 Documentation & Guides
- **[QA_API_TESTING_GUIDE.md](docs/QA_API_TESTING_GUIDE.md)** - Complete API testing guide with patterns and examples
- **[API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - API endpoints and usage
- **[DATABASE_VALIDATION_GUIDE.md](docs/DATABASE_VALIDATION_GUIDE.md)** - Database validation for QA
- **[DB_VALIDATION_QUICK_REFERENCE.md](docs/DB_VALIDATION_QUICK_REFERENCE.md)** - Quick database commands


## 📁 Project Structure
```
.
├── docs/
│   ├── QA_API_TESTING_GUIDE.md      # API testing guide
│   ├── API_DOCUMENTATION.md         # Endpoint documentation
│   ├── DATABASE_VALIDATION_GUIDE.md # Database validation guide
│   └── DB_VALIDATION_QUICK_REFERENCE.md # Quick database commands
├── src/
│   ├── server.ts                    # API entry point
│   ├── app.ts                       # Express app setup
│   ├── db/
│   │   ├── pool.ts                  # Postgres connection
│   │   ├── migrate.ts               # Database migrations
│   │   └── seed.ts                  # Seed data (demo user)
│   ├── middleware/
│   │   └── auth.ts                  # Authentication middleware
│   └── routes/
│       ├── auth.ts                  # Authentication endpoints
│       ├── accounts.ts              # Account management
│       ├── deposits.ts              # Deposit operations
│       └── health.ts                # Health check endpoint
├── tests/
│   ├── api/
│   │   ├── auth.spec.ts             # Authentication tests
│   │   ├── accounts.spec.ts         # Account tests
│   │   └── health.spec.ts           # Health endpoint tests
│   └── helpers/
│       ├── auth-helpers.ts          # Auth test utilities
│       ├── create-account-helpers.ts # Account creation helpers
│       └── db-helpers.ts            # Database test utilities
├── scripts/
│   ├── db-check-user.ts             # User validation script
│   ├── db-check-users.ts            # Users list script
│   ├── db-check-account.ts          # Account validation script
│   ├── db-check-accounts.ts         # Accounts list script
│   ├── db-check-transactions.ts     # Transaction validation script
│   ├── db-stats.ts                  # Database statistics
│   └── db-verify-integrity.ts       # Data integrity checks
├── docker-compose.yml               # Local development orchestration
├── Dockerfile                       # API container definition
├── playwright.config.ts             # Test configuration
├── package.json                     # Dependencies and scripts
└── .env.example                     # Environment variables template
```

## 🔐 Demo Credentials
```
User 1:
Email: demo@qa.com
Password: demo123

User 2:
Email: second-demo@qa.com
Password: demo123

```

## 🛠️ Useful Commands
```bash
# Testing
npm test                 # Run all tests
npm run test:ui          # Run tests with UI

# Database validation
npm run db:check-users   # List all users
npm run db:stats         # Database statistics

# Docker
docker compose logs api  # View API logs
docker compose down -v   # Stop and remove all data
```
