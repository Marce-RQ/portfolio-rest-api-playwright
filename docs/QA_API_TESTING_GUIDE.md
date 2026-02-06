# QA Guide: REST API Testing (Beginner Friendly)

This guide shows you how to test this project’s REST API using Playwright, step by step.

Playwright supports API testing via its built-in request context and assertions.

## Table of contents
1. Prerequisites
2. Quick start (run + verify + test)
3. How this project is organized
4. What you need to know (HTTP basics)
5. How to find endpoints (source of truth order)
6. Your first API test (GET /health)
7. What to assert in responses
8. Test strategy (what to cover)
9. Helpers

---

## 1) Prerequisites
- Basics of coding with JS and TypeScript
- Basic understanding of REST APIs and HTTP methods [Learn Here](https://www.youtube.com/watch?v=tkfVQK6UxDI)
- Basic understanding of JSON [Learn Here](https://www.youtube.com/watch?v=KMLOWkGAxVc)
- Basics of Postman or similar API testing tool (Optional for manual testing) [Learn Here](https://www.youtube.com/watch?v=MFxk5BZulVU&t=60s)
- Basics of Playwright API testing (request context, assertions) [Learn Here](https://www.youtube.com/watch?v=P4Hswlt-KrI)
- Node.js 18+ installed [Download Here](https://nodejs.org/en/download/)
- Docker Installed [Download Here](https://docs.docker.com/get-docker/)

## 2) Quick start (run + verify + test)

For SETUP go to [README > Quick Setup Commands](README_NEWBIE.md#quick-setup-commands) for the full commands and prerequisites.


---

## 3) How this project is organized

### Requests vs responses
- A client sends an HTTP request (method + URL + headers + optional body).
- The server returns an HTTP response (status code + headers + optional body).

### Methods (CRUD mindset)
- GET: read data
- POST: create / trigger action
- PUT/PATCH: update
- DELETE: remove

### Status code groups
- 2xx: success    
- 4xx: client error (request is wrong or missing auth)
- 5xx: server error (server failed handling a valid request)

---

## 4) What you need to know (HTTP basics)

### Requests vs responses
- A client sends an HTTP request (method + URL + headers + optional body).
- The server returns an HTTP response (status code + headers + optional body).

### Methods (CRUD mindset)
- GET: read data
- POST: create / trigger action
- PUT/PATCH: update
- DELETE: remove

### Status code groups
- 2xx: success    
- 4xx: client error (request is wrong or missing auth)
- 5xx: server error (server failed handling a valid request)

---

## 5) How to find the "endpoints" for your testing (source of truth order)

In this project we have API Documentation [here](API_DOCUMENTATION.md), however, in cases you dont get clear information for what you need to test, use this in order to find the endpoints:

1. **TEAM**: Check with your team members FIRST if possible.
2. **README**: high-level overview and quick start. You might find endpoint information here.
3. **API docs**: Example requests/headers and endpoint list.
4. **Route code** (`src/routes/*`): what it *actually* does right now.
5. **Existing tests** (`tests/api/*`): examples of how the suite is structured.

**Tip:** Always check with other testers or developers before starting to test to avoid duplicates or conflicts.

---

## 6) Your first API test (GET /health)

**Tip:** Preferably, test manually first using a tool like Postman, Insomnia, Thunder Client, or curl, so you get a grasp of the expected response.

```bash
curl http://localhost:3000/health
```

## Expected

- Status: 200
- Body: `{"status":"ok"}`

## Automated test (Playwright)

Create `tests/api/health.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test.describe("Health Endpoint", () => {
  test("GET /health returns 200 with status ok", async ({ request }) => {
    const response = await request.get("/health");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toEqual({ status: "ok" });
  });
});
```

---

## 7) What to assert in responses

For most endpoints, assert in this order:

- Status code
- Response body shape (required fields exist)
- Values (business correctness)
- Types / formats (UUID, email, ISO date, etc.)
- Error structure (for negative tests)

Example status groups you'll see:

- `2xx` for success
- `4xx` for validation/auth problems
- `5xx` for server issues

---

## 8) Test strategy (what to cover)

For each endpoint, aim for:

- Happy path (valid request → expected `2xx`)
- Validation errors (bad input → `400`-style)
- Authentication (missing/invalid token → `401`-style)
- Authorization (wrong user → `403`-style)
- Not found (unknown id → `404`-style)
- Edge cases (limits, boundary values)
- Stateful checks (POST changes state; GET shows the change)

Keep tests independent:

- Each test should set up what it needs (login, create account, etc.)
- Avoid relying on test order. Meaning, dont create a user in one test and then try to use that specific user in another test to make a deposit.

---

## 9) Helpers

Use a helper so you don't repeat code in every test. For example:

### Helper A: Authentication token function

```ts

export async function getAuthToken(request: any, email: string = 'demo@qa.com', password: string='demo123') {
  const response = await request.post(`${BASE_URL}/auth/login`, {
    data: {
      email: email,
      password: password,
    },
  });

  const { token } = await response.json();

  return token;
}
```

#### Helper B: Account creation function

```ts
export async function createAccount(request: any, token: string, currency = 'EUR') {
  const response = await request.post(`${BASE_URL}/accounts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      currency,
    },
  });
  const { id } = await response.json();
  return id;
}
```

---


## 🎓 DB Validation Learning Path

### Beginner: Start Here

1. Read [DATABASE_VALIDATION_GUIDE.md](./DATABASE_VALIDATION_GUIDE.md)
2. Try each command with demo data
3. Run one test, then validate it

### Intermediate: Practice

1. Validate every new test you write
2. Look for patterns in data
3. Use integrity checks regularly

### Advanced: Automate

1. Use db-helpers in your tests
2. Add DB assertions to test code
3. Create custom validation scripts

---

## 🔗 Related Resources

- [Complete Guide](./DATABASE_VALIDATION_GUIDE.md) - Full documentation
- [API Documentation](./API_DOCUMENTATION.md) - API reference
- [Test Examples](../tests/api/db-validation-examples.spec.ts) - Code samples
- [DB Helpers](../tests/helpers/db-helpers.ts) - Programmatic access

