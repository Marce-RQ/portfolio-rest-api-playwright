# Portfolio API + Playwright Tests

**CV**: [marcelo-romero-cv.vercel.app](https://marcelo-romero-cv.vercel.app/)

Hi there! :)

This is a minimal Fintech API I created that you can locally run at "0" cost.

There is also a separate guide [here](README_NEWBIE.md) for new TESTERS so they can learn API automation testing.

## What This Demonstrates
The **main goal** is to demonstrate my ability to design and build a REST API testing suite using Playwright:

Key Areas:
-  **Playwright API Testing** - RESTful API test automation
-  **Test Architecture** - Clean helper functions and reusable patterns  
-  **Stateful Testing** - POST/GET operations with database verification
-  **Authentication Testing** - Token-based auth and authorization
-  **Error Handling** - Comprehensive negative test scenarios
-  **Database Validation** - Custom integrity check scripts

## Where to Look?

### Core Test Suite
- **[tests/api/auth.spec.ts](tests/api/auth.spec.ts)** - Authentication flow testing
- **[tests/api/accounts.spec.ts](tests/api/accounts.spec.ts)** - Account management & stateful operations
- **[tests/helpers/auth-helpers.ts](tests/helpers/auth-helpers.ts)** - Authentication test patterns
- **[tests/helpers/create-account-helpers.ts](tests/helpers/create-account-helpers.ts)** - Account creation utilities

### Database Validation Tools
- **[scripts/db-verify-integrity.ts](scripts/db-verify-integrity.ts)** - Data integrity checks
- **[scripts/db-stats.ts](scripts/db-stats.ts)** - Database statistics
- **[scripts/db-check-users.ts](scripts/db-check-users.ts)** - User validation

### Documentation
- **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API endpoint documentation
- **[docs/QA_API_TESTING_GUIDE.md](docs/QA_API_TESTING_GUIDE.md)** - Testing methodology and patterns (For new TESTERS)

## Do you want to run it?
Go to [README_NEWBIE.md#quick-setup-commands](README_NEWBIE.md#quick-setup-commands) for step-by-step instructions.


## 🛠️ Tech Stack

- **Testing**: Playwright (API testing)
- **API**: Express + TypeScript + Postgres
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Cost**: $0 (runs locally + GitHub Actions)
- **AI**: I am not a developer, so "Claude AI" was used to create the API. However, the automation code is 100% mine 🤓

---


