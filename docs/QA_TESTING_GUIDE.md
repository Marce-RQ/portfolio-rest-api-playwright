# QA Guide: Testing REST APIs for Beginners

## Table of Contents

1. [What is REST API Testing?](#what-is-rest-api-testing)
2. [Does the Framework Matter?](#does-the-framework-matter)
3. [First Steps for a New QA](#first-steps-for-a-new-qa)
4. [Finding Endpoints to Test](#finding-endpoints-to-test)
5. [Creating Your First Test](#creating-your-first-test)
6. [Understanding API Responses](#understanding-api-responses)
7. [Test Strategy](#test-strategy)
8. [Common Testing Patterns](#common-testing-patterns)

---

## What is REST API Testing?

**REST API** = Application Programming Interface that follows REST (Representational State Transfer) principles.

Think of it as a **waiter in a restaurant**:

- You (client) make a **request** (order food)
- The waiter takes it to the **API** (kitchen)
- The kitchen **processes** your request
- The waiter brings back a **response** (your food)

**API Testing** validates:

- ✅ The API accepts correct requests
- ✅ Returns correct responses
- ✅ Rejects invalid requests
- ✅ Handles errors gracefully
- ✅ Maintains data consistency
- ✅ Performs within acceptable time

---

## Does the Framework Matter?

### Short answer: **No, the testing approach is the same.**

Whether the API is built with:

- **Express.js** (like this project)
- **Next.js API routes**
- **Django** (Python)
- **Spring Boot** (Java)
- **Ruby on Rails**
- **FastAPI** (Python)

**The fundamentals don't change:**

- You send HTTP requests (GET, POST, PUT, DELETE)
- You receive HTTP responses (status codes, JSON/XML data)
- You validate the responses match expectations

### What DOES matter:

1. **HTTP protocol** - All REST APIs use HTTP
2. **Request/Response format** - Usually JSON (sometimes XML)
3. **Status codes** - Standard across all frameworks (200, 400, 404, etc.)
4. **Authentication** - JWT, OAuth, API keys (implementation varies but testing approach is similar)

### Framework-specific differences (minimal):

| Aspect           | Next.js         | Express                | Django           | Impact on Testing       |
| ---------------- | --------------- | ---------------------- | ---------------- | ----------------------- |
| Route definition | `/api/users.ts` | `router.get('/users')` | `path('users/')` | None - you test the URL |
| Error format     | Can vary        | Can vary               | Can vary         | Check docs for format   |
| Deployment       | Vercel, etc     | Any                    | Any              | None for local testing  |

**Bottom line**: Once you learn API testing, you can test ANY REST API regardless of the framework.

---

## First Steps for a New QA

### Step 1: Understand what the API does

Before testing, understand the **business logic**:

- What is this API for? (e.g., banking, e-commerce, social media)
- Who are the users?
- What can they do?

**Example: This project**

- **Purpose**: Mini fintech API for account management
- **Users**: People managing their bank accounts
- **Actions**: Login, create accounts, deposit money, view transactions

### Step 2: Set up your environment

1. **Clone the repository**
2. **Read the README**: Setup instructions are usually there
3. **Get the API running locally**:
   ```bash
   docker compose up -d
   ```
4. **Verify it works**:
   ```bash
   curl http://localhost:3000/health
   ```

### Step 3: Choose your testing tool

**Options:**

- **Playwright** (this project) - Modern, supports API + UI testing
- **Postman** - Popular GUI tool, good for manual testing
- **curl** - Command line, good for quick tests
- **REST Client** (VS Code extension) - Test from your editor
- **Jest + Supertest** - Common for Node.js projects

**For this project, we use Playwright** because:

- ✅ Write tests in TypeScript/JavaScript
- ✅ Built-in assertions
- ✅ Good reporting
- ✅ Can test UI and API with same tool

### Step 4: Learn HTTP basics

You need to understand:

#### HTTP Methods:

- **GET** - Retrieve data (read-only)
- **POST** - Create new data
- **PUT/PATCH** - Update existing data
- **DELETE** - Remove data

#### HTTP Status Codes:

- **2xx** = Success
  - 200 OK - Request succeeded
  - 201 Created - Resource created
  - 204 No Content - Success, no response body
- **4xx** = Client Error (you did something wrong)
  - 400 Bad Request - Invalid data
  - 401 Unauthorized - Not authenticated
  - 403 Forbidden - Authenticated but no permission
  - 404 Not Found - Resource doesn't exist
- **5xx** = Server Error (server did something wrong)
  - 500 Internal Server Error - Generic server error

#### Request Components:

```
POST /accounts                          ← URL
Authorization: Bearer <token>           ← Header
Content-Type: application/json          ← Header

{                                       ← Body
  "currency": "EUR"
}
```

#### Response Components:

```
HTTP/1.1 201 Created                    ← Status
Content-Type: application/json          ← Header

{                                       ← Body
  "id": "123",
  "currency": "EUR",
  "balance": 0
}
```

---

## Finding Endpoints to Test

### Where to look in a project:

#### 1. **README.md** (Start here!)

Often contains:

- List of endpoints
- Example requests
- Authentication details

#### 2. **PRD (Product Requirements Document)**

- **This project**: `docs/PRD.md`
- Defines all endpoints and expected behavior
- Your testing source of truth!

#### 3. **API Documentation**

Look for files like:

- `API.md`
- `docs/API.md`
- `swagger.json` / `openapi.yaml`

#### 4. **Route files** (in the code)

Navigate to the routes/controllers directory:

**This project**: `/src/routes/`

```
src/routes/
  ├── health.ts       → GET /health
  ├── auth.ts         → POST /auth/login
  ├── accounts.ts     → POST /accounts, GET /accounts/:id
  ├── deposits.ts     → POST /deposits
  └── transactions.ts → GET /transactions
```

**How to read route files:**

**Example from `src/routes/accounts.ts`:**

```typescript
router.post("/", async (req, res) => {
  // POST /accounts
  // Creates a new account
});

router.get("/:id", async (req, res) => {
  // GET /accounts/:id
  // Gets account by id
});
```

#### 5. **Main application file**

**This project**: `src/app.ts`

```typescript
app.use("/health", healthRouter); // /health/*
app.use("/auth", authRouter); // /auth/*
app.use("/accounts", accountsRouter); // /accounts/*
app.use("/deposits", depositsRouter); // /deposits/*
app.use("/transactions", transactionsRouter); // /transactions/*
```

This shows you all the base routes!

#### 6. **Existing tests** (if any)

**This project**: `tests/api/`

```
tests/api/
  ├── health.spec.ts
  ├── auth.spec.ts
  ├── accounts.spec.ts
  ├── deposits.spec.ts
  └── transactions.spec.ts
```

Each test file corresponds to an endpoint group.

### Creating Your Endpoint Inventory

Create a checklist of all endpoints:

**Example for this project:**

```markdown
## Endpoints to Test

### Authentication

- [ ] POST /auth/login

### Health Check

- [ ] GET /health

### User

- [ ] GET /me

### Accounts

- [ ] POST /accounts
- [ ] GET /accounts/:id

### Deposits

- [ ] POST /deposits

### Transactions

- [ ] GET /transactions
```

---

## Creating Your First Test

### Step 1: Pick the simplest endpoint

Usually a health check or GET endpoint.

**This project**: Start with `GET /health`

### Step 2: Manual test first (with curl or Postman)

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

**What to observe:**

- ✅ Status code: 200
- ✅ Response body: `{"status":"ok"}`
- ✅ Response time: < 100ms (reasonable)
- ✅ Content-Type: application/json

### Step 3: Write automated test

**Create file**: `tests/api/health.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Health Endpoint", () => {
  test("GET /health returns 200 with status ok", async ({ request }) => {
    // Make the request
    const response = await request.get("/health");

    // Assert status code
    expect(response.status()).toBe(200);

    // Assert response body
    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });
});
```

**Breaking it down:**

1. **Import testing framework**:

   ```typescript
   import { test, expect } from "@playwright/test";
   ```

2. **Group related tests**:

   ```typescript
   test.describe("Health Endpoint", () => {
     // All health tests go here
   });
   ```

3. **Define a test**:

   ```typescript
   test("description of what you are testing", async ({ request }) => {
     // Test code
   });
   ```

4. **Make request**:

   ```typescript
   const response = await request.get("/health");
   ```

5. **Assert status**:

   ```typescript
   expect(response.status()).toBe(200);
   ```

6. **Assert body**:
   ```typescript
   const body = await response.json();
   expect(body).toEqual({ status: "ok" });
   ```

### Step 4: Run the test

```bash
npm test tests/api/health.spec.ts
```

**Expected output:**

```
Running 1 test using 1 worker
  1 passed (150ms)
```

---

## Understanding API Responses

### How do you know what should be returned?

#### 1. **Check the PRD/Documentation**

**Example from PRD**:

```markdown
POST /accounts

- body: { "currency": "EUR" | "USD" }
- 201: { "id": string, "currency": string, "balance": number }
- 400 on invalid currency
```

This tells you:

- **Success response**: Status 201, JSON with id, currency, balance
- **Error response**: Status 400 when currency is invalid

#### 2. **Read the route code**

**Example from `src/routes/accounts.ts`**:

```typescript
return res.status(201).json({
  id: account.id,
  currency: account.currency,
  balance: parseFloat(account.balance),
});
```

This tells you the exact response structure!

#### 3. **Check the database schema**

**From migrations**:

```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  currency TEXT NOT NULL,
  balance NUMERIC(15,2) DEFAULT 0
);
```

This tells you:

- `id` is a UUID (string format)
- `currency` is text
- `balance` is a number with 2 decimals

#### 4. **Look at existing tests**

**Example from `tests/api/accounts.spec.ts`**:

```typescript
const body = await response.json();
expect(body).toHaveProperty("id");
expect(body.currency).toBe("EUR");
expect(body.balance).toBe(0);
```

This shows what fields exist and their expected values.

#### 5. **Test manually and observe**

When in doubt, make a real request and see what comes back:

```bash
curl -X POST http://localhost:3000/accounts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"currency":"EUR"}' | jq
```

### What to verify in responses:

#### ✅ Status Code

```typescript
expect(response.status()).toBe(201);
```

#### ✅ Response structure (has expected fields)

```typescript
const body = await response.json();
expect(body).toHaveProperty("id");
expect(body).toHaveProperty("currency");
expect(body).toHaveProperty("balance");
```

#### ✅ Response values (correct data)

```typescript
expect(body.currency).toBe("EUR");
expect(body.balance).toBe(0);
```

#### ✅ Data types

```typescript
expect(typeof body.id).toBe("string");
expect(typeof body.balance).toBe("number");
```

#### ✅ Data format (for specific fields)

```typescript
// UUID format (8-4-4-4-12 characters)
expect(body.id).toMatch(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
);

// Email format
expect(body.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);

// Date format (ISO 8601)
expect(body.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
```

#### ✅ Error responses

```typescript
expect(response.status()).toBe(400);

const body = await response.json();
expect(body.error.code).toBe("VALIDATION_ERROR");
expect(body.error.message).toContain("currency");
```

---

## Test Strategy

### The Test Pyramid

```
        /\
       /  \      ← Few: End-to-end tests (full flows)
      /____\
     /      \    ← More: Integration tests (API tests)
    /________\
   /          \  ← Most: Unit tests (individual functions)
  /____________\
```

**API tests are integration tests** - they test how components work together.

### What to test (Coverage Strategy)

#### 1. **Happy Path** (Everything works)

```typescript
test("successful account creation", async ({ request }) => {
  const response = await request.post("/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    data: { currency: "EUR" },
  });

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body.currency).toBe("EUR");
  expect(body.balance).toBe(0);
});
```

#### 2. **Validation Errors** (Invalid input)

```typescript
test("invalid currency returns 400", async ({ request }) => {
  const response = await request.post("/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    data: { currency: "GBP" }, // Not EUR or USD
  });

  expect(response.status()).toBe(400);
});
```

#### 3. **Authentication/Authorization** (Security)

```typescript
test("missing token returns 401", async ({ request }) => {
  const response = await request.post("/accounts", {
    data: { currency: "EUR" },
  });

  expect(response.status()).toBe(401);
});
```

#### 4. **Not Found** (Resource doesn't exist)

```typescript
test("unknown account returns 404", async ({ request }) => {
  const response = await request.get(
    "/accounts/00000000-0000-0000-0000-000000000000",
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  expect(response.status()).toBe(404);
});
```

#### 5. **Edge Cases** (Boundary conditions)

```typescript
test("deposit with amount 0 returns 400", async ({ request }) => {
  // Test boundary: amount must be > 0
});

test("pagination beyond last page returns empty", async ({ request }) => {
  // Test boundary: page 999 when only 2 pages exist
});

test("limit exceeding max returns 400", async ({ request }) => {
  // Test boundary: limit 101 when max is 100
});
```

#### 6. **State Mutations** (Data changes)

```typescript
test("deposit increases balance", async ({ request }) => {
  // Create account
  const account = await createAccount(request, token);

  // Make deposit
  await request.post("/deposits", {
    headers: { Authorization: `Bearer ${token}` },
    data: { accountId: account.id, amount: 100 },
  });

  // Verify balance increased
  const accountResponse = await request.get(`/accounts/${account.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const updatedAccount = await accountResponse.json();
  expect(updatedAccount.balance).toBe(100);
});
```

#### 7. **Data Isolation** (Filtering)

```typescript
test("returns only user own transactions", async ({ request }) => {
  // Verify user A can't see user B's transactions
});
```

### Test Organization

**Group by endpoint/feature:**

```
tests/api/
  ├── auth.spec.ts          ← All auth tests
  ├── accounts.spec.ts      ← All account tests
  ├── deposits.spec.ts      ← All deposit tests
  └── transactions.spec.ts  ← All transaction tests
```

**Within each file, group by operation:**

```typescript
test.describe('Accounts API', () => {

  test.describe('POST /accounts', () => {
    test('happy path: create EUR account', ...);
    test('happy path: create USD account', ...);
    test('error: invalid currency', ...);
    test('error: missing currency', ...);
    test('error: missing token', ...);
  });

  test.describe('GET /accounts/:id', () => {
    test('happy path: fetch existing account', ...);
    test('error: account not found', ...);
    test('error: missing token', ...);
  });

});
```

---

## Common Testing Patterns

### Pattern 1: Helper Functions (DRY - Don't Repeat Yourself)

**Problem**: You need to login in every test.

**Solution**: Create a helper function.

```typescript
// Helper function
async function getAuthToken(request: any): Promise<string> {
  const response = await request.post("/auth/login", {
    data: {
      email: "demo@qa.com",
      password: "demo123",
    },
  });
  const { token } = await response.json();
  return token;
}

// Use in tests
test("create account", async ({ request }) => {
  const token = await getAuthToken(request); // Reusable!

  const response = await request.post("/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    data: { currency: "EUR" },
  });
  // ... assertions
});
```

### Pattern 2: Test Fixtures (Setup/Teardown)

**Problem**: Every test needs an account.

**Solution**: Use fixtures or setup functions.

```typescript
// Helper to create account
async function createAccount(request: any, token: string): Promise<string> {
  const response = await request.post("/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    data: { currency: "EUR" },
  });
  const { id } = await response.json();
  return id;
}

// Use in tests
test("make deposit", async ({ request }) => {
  const token = await getAuthToken(request);
  const accountId = await createAccount(request, token); // Setup

  // Now test deposits
  const response = await request.post("/deposits", {
    headers: { Authorization: `Bearer ${token}` },
    data: { accountId, amount: 100 },
  });
  // ... assertions
});
```

### Pattern 3: Parameterized Tests (Test multiple inputs)

```typescript
const invalidCurrencies = ["GBP", "JPY", "CNY", "", null, undefined, 123];

invalidCurrencies.forEach((currency) => {
  test(`invalid currency "${currency}" returns 400`, async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post("/accounts", {
      headers: { Authorization: `Bearer ${token}` },
      data: { currency },
    });

    expect(response.status()).toBe(400);
  });
});
```

### Pattern 4: Chaining Tests (Multi-step flows)

```typescript
test("complete flow: signup → create account → deposit → check balance", async ({
  request,
}) => {
  // Step 1: Login
  const token = await getAuthToken(request);

  // Step 2: Create account
  const accountResponse = await request.post("/accounts", {
    headers: { Authorization: `Bearer ${token}` },
    data: { currency: "EUR" },
  });
  const { id: accountId } = await accountResponse.json();

  // Step 3: Make deposit
  const depositResponse = await request.post("/deposits", {
    headers: { Authorization: `Bearer ${token}` },
    data: { accountId, amount: 100 },
  });
  expect(depositResponse.status()).toBe(201);

  // Step 4: Verify balance
  const balanceResponse = await request.get(`/accounts/${accountId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const account = await balanceResponse.json();
  expect(account.balance).toBe(100);
});
```

### Pattern 5: Negative Testing (What should fail)

Always test what SHOULDN'T work:

```typescript
test.describe("Negative tests", () => {
  test("deposit with negative amount fails", async ({ request }) => {
    const token = await getAuthToken(request);
    const accountId = await createAccount(request, token);

    const response = await request.post("/deposits", {
      headers: { Authorization: `Bearer ${token}` },
      data: { accountId, amount: -50 },
    });

    expect(response.status()).toBe(400);
  });

  test("deposit to non-existent account fails", async ({ request }) => {
    const token = await getAuthToken(request);

    const response = await request.post("/deposits", {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        accountId: "00000000-0000-0000-0000-000000000000",
        amount: 50,
      },
    });

    expect(response.status()).toBe(404);
  });
});
```

---

## Checklist for Testing Any REST API

### Before You Start:

- [ ] API is running locally
- [ ] You have access to documentation (PRD, README, API docs)
- [ ] You understand the authentication mechanism
- [ ] You have test data/accounts set up

### For Each Endpoint:

- [ ] Happy path works (valid request → success response)
- [ ] Invalid input returns appropriate error (400)
- [ ] Missing required fields returns error
- [ ] Authentication required endpoints reject unauthenticated requests (401)
- [ ] Authorization works (users can't access others' data) (403)
- [ ] Non-existent resources return 404
- [ ] Response structure matches documentation
- [ ] Response data types are correct
- [ ] Edge cases handled (boundaries, limits)
- [ ] State mutations work correctly (data persists)

### Overall:

- [ ] Tests are independent (can run in any order)
- [ ] Tests clean up after themselves (if needed)
- [ ] Tests are readable and well-named
- [ ] Tests run quickly (< 5 seconds each)
- [ ] Tests are reliable (not flaky)

---

## Next Steps

1. **Run existing tests**: `npm test`
2. **Read test files**: `tests/api/*.spec.ts`
3. **Make manual requests**: Use curl or Postman
4. **Write your first test**: Start with GET /health
5. **Expand coverage**: Add more test cases
6. **Learn advanced topics**: Mocking, performance testing, contract testing

---

## Resources

### Official Playwright API Testing Docs:

https://playwright.dev/docs/api-testing

### HTTP Status Codes Reference:

https://httpstatuses.com/

### REST API Best Practices:

https://restfulapi.net/

### This Project's Documentation:

- `docs/PRD.md` - Requirements
- `docs/PHASE_*_LEARNING_GUIDE.md` - Implementation guides
- `tests/api/*.spec.ts` - Example tests

---

**Remember**: Testing is a skill that improves with practice. Start simple, learn from existing tests, and gradually tackle more complex scenarios. Every bug you catch makes the product better! 🚀
