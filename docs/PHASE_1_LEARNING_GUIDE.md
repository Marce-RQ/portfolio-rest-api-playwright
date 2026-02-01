# 📗 Phase 1 Learning Guide — Health Endpoint

Purpose

- Implement a minimal health/readiness endpoint used by CI and monitoring to verify the API is running.

What

- `src/routes/health.ts`: Express route that returns 200 `{ "status": "ok" }` on `GET /health`.
- `tests/api/health.spec.ts`: Playwright test that verifies the endpoint returns 200 and the expected body.

Why

- A lightweight readiness check is used in CI to wait until the API is ready before running tests.
- Monitoring systems use a health endpoint to detect service outages quickly.

How it works (high level)

- The app exposes `GET /health` and returns `200` with a small JSON payload.
- CI scripts poll this endpoint until it returns 200 before running the test suite.

Step-by-step (for beginners)

1. Ensure the app is running (Docker or `npm run dev`).
2. Manually test the endpoint with `curl`:

```bash
curl -s http://localhost:3000/health
# Expected response: {"status":"ok"}
```

3. Example Playwright test (already in `tests/api/health.spec.ts`):

```typescript
import { test, expect } from "@playwright/test";

test("GET /health returns 200 with status ok", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body).toEqual({ status: "ok" });
});
```

Notes & tips

- Keep the health response intentionally tiny — it should be fast and deterministic.
- For more advanced checks, separate liveness from readiness and include lightweight DB checks only in readiness.

Files to review

- [src/routes/health.ts](src/routes/health.ts)
- [tests/api/health.spec.ts](tests/api/health.spec.ts)

## For QA engineers

- Purpose: confirm API readiness and CI readiness checks behave reliably.
- Test checklist:
  - `GET /health` returns `200` and `{ "status": "ok" }`.
  - Health endpoint responds quickly (low latency) and consistently.
  - CI wait-for-health logic succeeds before tests run.
- How to run manually:

```bash
curl -s http://localhost:3000/health
# Expect: {"status":"ok"}
```

-- How tests run in CI: docker compose up → poll `/health` until 200 → run `npx playwright test`.

CI integration — example (GitHub Actions)

Below is a minimal GitHub Actions job showing the pattern used in CI for this project: start services, wait for `GET /health`, run Playwright tests, then tear down.

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Compose
        run: docker compose up -d --build

      - name: Wait for /health
        run: |
          set -e
          for i in $(seq 1 60); do
            status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health || echo "000")
            if [ "$status" = "200" ]; then
              echo "API healthy"; exit 0
            fi
            echo "Waiting for API... ($i)"; sleep 2
          done
          echo "Health check failed"; exit 1

      - name: Run Playwright tests
        run: npx playwright test

      - name: Tear down
        if: always()
        run: docker compose down -v
```

Notes

- The `Wait for /health` step uses a small retry loop (60 tries × 2s). Adjust timeout to suit your environment.
- Alternatives: use `wait-for-it.sh`, `dockerize`, or a small node script that polls the endpoint. The curl loop is portable and has no extra deps.
- Ensure `JWT_SECRET` and other env vars are provided in Actions (via repository secrets or `.env` in the workflow) if tests need them.
