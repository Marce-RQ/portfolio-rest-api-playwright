# Portfolio API + Playwright Tests

Hi there! 👋

This is a minimal Fintech API I created that you can locally run at "0" cost.

There is a separate guide [here](docs/QA_API_TESTING_GUIDE.md) for new software testers to RUN and LEARN API automation testing.

## What This Demonstrates
The **main goal** is to demonstrate my ability to design and build a REST API testing suite using Playwright:

Key Areas:
-  **Playwright API Test Automation** - RESTful API
-  **Test Architecture** - Clean helper functions and reusable patterns  
-  **Stateful Testing** - POST/GET operations on this version
-  **Authentication Testing** - Token-based authorization
-  **Error Handling** - Comprehensive negative test scenarios

## Where to Look?

### Core Test Suite
- **[tests/api/auth.spec.ts](tests/api/auth.spec.ts)** - Authentication flow testing
- **[tests/api/accounts.spec.ts](tests/api/accounts.spec.ts)** - Account management & stateful operations
- **[tests/helpers/auth-helpers.ts](tests/helpers/auth-helpers.ts)** - Authentication test patterns
- **[tests/helpers/create-account-helpers.ts](tests/helpers/create-account-helpers.ts)** - Account creation utilities
- **[tests/](tests/)** - for complete test suite

### Documentation
- **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** - Complete API endpoint documentation
- **[docs/QA_API_TESTING_GUIDE.md](docs/QA_API_TESTING_GUIDE.md)** - Testing methodology and patterns (For new TESTERS)

## Do you want to run it?
Go to [README > Quick Setup Commands](../README.md#quick-setup-commands) for step-by-step instructions.


## 🛠️ Tech Stack

- **Testing**: Playwright (API testing)
- **API**: Express + TypeScript + Postgres
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions
- **Cost**: $0 (runs locally + GitHub Actions)
- **AI**: I am not a developer, so "Claude AI" was used to create the API. However, the automation code is 100% mine 🤓

---
## ☎️ Contact Me
Do not hesitate to contact me if you have any questions or need further clarification:

- **LinkedIn**: [LinkedIn](https://www.linkedin.com/in/marcelo-romero/)
- **Email**: contact.marcelo.romero@gmail.com
