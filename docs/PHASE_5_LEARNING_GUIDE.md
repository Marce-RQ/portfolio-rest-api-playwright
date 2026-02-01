# Phase 5 — Transactions List & Pagination Learning Guide

## Purpose

Implement transaction listing with pagination to allow users to view their transaction history efficiently, even when there are hundreds or thousands of records.

## What

- **`src/routes/transactions.ts`**: Protected endpoint for listing transactions (`GET /transactions`)
- **Pagination parameters**: `page`, `limit`, `accountId`
- **Sorting**: Deterministic ordering by `created_at DESC` (newest first)
- **`tests/api/transactions.spec.ts`**: Playwright tests validating pagination, filtering, and error cases

## Why

- **Performance**: Loading all transactions at once would be slow with large datasets
- **UX**: Users typically want to see recent transactions first
- **Scalability**: Pagination allows the API to handle millions of transactions
- **Filtering**: Users should only see transactions for their own accounts

## How it works (high level)

1. Client requests `GET /transactions?accountId=xxx&page=1&limit=20`
2. Server validates parameters (accountId required, page/limit positive integers)
3. Server checks account exists and belongs to user
4. Server counts total transactions for this account
5. Server calculates offset: `(page - 1) * limit`
6. Server fetches transactions with `LIMIT` and `OFFSET`
7. Returns `{ items: [], page, limit, total }`

## Pagination concepts for beginners

### What is pagination?

Instead of returning ALL records, we return them in "pages":

```
Total records: 47
Page 1 (limit 20): Records 1-20
Page 2 (limit 20): Records 21-40
Page 3 (limit 20): Records 41-47 (only 7 items)
Page 4 (limit 20): No items (beyond end)
```

### Why these parameters?

- **`accountId`**: Which account's transactions to show (required)
- **`page`**: Which page to show (default: 1)
- **`limit`**: How many items per page (default: 20, max: 100)
- **`total`**: Total count of all transactions (helps calculate total pages)

### SQL for pagination

```sql
-- Get page 2 with 20 items per page
SELECT * FROM transactions
WHERE account_id = 'xxx'
ORDER BY created_at DESC
LIMIT 20              -- How many to return
OFFSET 20;            -- How many to skip (page-1 × limit)
```

**OFFSET calculation**:

- Page 1: offset = (1-1) × 20 = 0
- Page 2: offset = (2-1) × 20 = 20
- Page 3: offset = (3-1) × 20 = 40

## Code walkthrough

### 1. Route setup and parameter extraction

```typescript
import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  // Extract query parameters with defaults
  const { accountId, page = '1', limit = '20' } = req.query;
```

**Why string defaults?** Query parameters come from the URL as strings: `?page=2` → `req.query.page = "2"`

### 2. Validation

```typescript
// Validate accountId is required
if (!accountId || typeof accountId !== "string") {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "accountId is required",
    },
  });
}

// Parse and validate page
const pageNum = parseInt(page as string, 10);
if (isNaN(pageNum) || pageNum < 1) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "page must be a positive integer",
    },
  });
}

// Parse and validate limit
const limitNum = parseInt(limit as string, 10);
if (isNaN(limitNum) || limitNum < 1) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "limit must be a positive integer",
    },
  });
}

// Enforce maximum limit
if (limitNum > 100) {
  return res.status(400).json({
    error: {
      code: "VALIDATION_ERROR",
      message: "limit cannot exceed 100",
    },
  });
}
```

**Why validate so much?**

- Prevents SQL injection
- Prevents performance issues (e.g., requesting 1 million records)
- Provides clear error messages to API consumers

### 3. Authorization check

```typescript
// Check if account exists and belongs to user
const accountResult = await pool.query(
  "SELECT id, user_id FROM accounts WHERE id = $1",
  [accountId],
);

if (accountResult.rows.length === 0) {
  return res.status(404).json({
    error: { code: "NOT_FOUND", message: "Account not found" },
  });
}

const account = accountResult.rows[0];

// Verify account belongs to authenticated user
if (account.user_id !== req.userId) {
  return res.status(403).json({
    error: {
      code: "FORBIDDEN",
      message: "You do not have access to this account",
    },
  });
}
```

**Security note**: Users should only see their own transactions!

### 4. Get total count

```typescript
// Get total count for pagination metadata
const countResult = await pool.query(
  "SELECT COUNT(*) FROM transactions WHERE account_id = $1",
  [accountId],
);
const total = parseInt(countResult.rows[0].count, 10);
```

**Why count separately?** The client needs to know how many total pages exist:

```
total: 47, limit: 20 → 3 pages (47/20 = 2.35, rounded up = 3)
```

### 5. Calculate offset and fetch transactions

```typescript
// Calculate offset
const offset = (pageNum - 1) * limitNum;

// Get transactions with pagination
const transactionsResult = await pool.query(
  `SELECT id, account_id, type, amount, reference, created_at
     FROM transactions
     WHERE account_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
  [accountId, limitNum, offset],
);

return res.status(200).json({
  items: transactionsResult.rows,
  page: pageNum,
  limit: limitNum,
  total,
});
```

### 6. Why `ORDER BY created_at DESC`?

**DESC = Descending** (newest first):

```
2026-01-05 10:00 (most recent) ← shown first
2026-01-04 15:30
2026-01-03 09:15
2026-01-01 12:00 (oldest)
```

**Deterministic ordering** means the order is always the same, which is important for pagination consistency.

## Response structure explained

```json
{
  "items": [
    {
      "id": "uuid",
      "account_id": "uuid",
      "type": "deposit",
      "amount": "100.50",
      "reference": "Salary",
      "created_at": "2026-01-05T10:00:00.000Z"
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 47
}
```

**Why include metadata?**

- `page`: Which page the client is on
- `limit`: Items per page (client knows what to expect)
- `total`: Client can calculate: `totalPages = Math.ceil(total / limit)`

## Step-by-step testing (manual)

1. **Setup: Create account and make deposits**:

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@qa.com","password":"demo123"}' | jq -r '.token')

# Create account
ACCOUNT_ID=$(curl -s -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currency":"EUR"}' | jq -r '.id')

# Make several deposits
curl -s -X POST http://localhost:3000/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"accountId":"'$ACCOUNT_ID'","amount":100,"reference":"First"}'

curl -s -X POST http://localhost:3000/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"accountId":"'$ACCOUNT_ID'","amount":50,"reference":"Second"}'

curl -s -X POST http://localhost:3000/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"accountId":"'$ACCOUNT_ID'","amount":75,"reference":"Third"}'
```

2. **Get transactions (default page 1, limit 20)**:

```bash
curl -s "http://localhost:3000/transactions?accountId=$ACCOUNT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

3. **Get transactions with custom limit**:

```bash
curl -s "http://localhost:3000/transactions?accountId=$ACCOUNT_ID&limit=2" \
  -H "Authorization: Bearer $TOKEN" | jq
```

4. **Get page 2**:

```bash
curl -s "http://localhost:3000/transactions?accountId=$ACCOUNT_ID&page=2&limit=2" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## Test coverage (automated)

The `tests/api/transactions.spec.ts` file includes 13 tests:

✅ **Happy path:**

- Returns transactions for account
- Returns only transactions for specified account
- Respects limit parameter
- Respects page parameter
- Page beyond last returns empty items
- Transactions ordered by created_at descending
- Defaults work correctly (page=1, limit=20)

✅ **Error cases:**

- Missing accountId returns 400
- Invalid page returns 400
- Invalid limit returns 400
- Limit exceeding 100 returns 400
- Unknown account returns 404
- Missing token returns 401

Run tests:

```bash
npm test tests/api/transactions.spec.ts
```

## Common mistakes and how to avoid them

### ❌ Mistake 1: Forgetting to validate limit

```typescript
// WRONG - someone could request limit=999999999
const limit = req.query.limit || 20;
```

### ✅ Correct: Enforce maximum

```typescript
if (limitNum > 100) {
  return res.status(400).json({ error: ... });
}
```

### ❌ Mistake 2: Not using OFFSET correctly

```typescript
// WRONG - returns same items for every page
LIMIT ${limit}
```

### ✅ Correct: Calculate offset

```typescript
const offset = (page - 1) * limit;
LIMIT ${limit} OFFSET ${offset}
```

### ❌ Mistake 3: Inconsistent ordering

```typescript
// WRONG - order might change between requests
SELECT * FROM transactions WHERE account_id = $1
```

### ✅ Correct: Deterministic ORDER BY

```typescript
SELECT * FROM transactions
WHERE account_id = $1
ORDER BY created_at DESC  -- Always same order
```

### ❌ Mistake 4: Not including total count

```typescript
// WRONG - client doesn't know how many pages exist
return { items: rows };
```

### ✅ Correct: Include metadata

```typescript
return { items: rows, page, limit, total };
```

## Pagination best practices

### 1. Default values

Always provide sensible defaults:

```typescript
const { page = "1", limit = "20" } = req.query;
```

### 2. Maximum limits

Protect your API from abuse:

```typescript
const MAX_LIMIT = 100;
if (limit > MAX_LIMIT) {
  /* error */
}
```

### 3. Validate types

Query params are strings, always parse:

```typescript
const pageNum = parseInt(page, 10);
if (isNaN(pageNum)) {
  /* error */
}
```

### 4. Return metadata

Help clients build UI:

```json
{
  "items": [...],
  "page": 2,
  "limit": 20,
  "total": 47
}
```

Client can calculate:

- Current page: `page`
- Total pages: `Math.ceil(total / limit)` = 3
- Has next page: `page < totalPages`
- Has previous page: `page > 1`

### 5. Consistent ordering

Use `ORDER BY` with a deterministic field (timestamp, id):

```sql
ORDER BY created_at DESC, id DESC
```

## Performance considerations

### Why pagination matters

**Without pagination:**

```sql
-- Returns 1,000,000 rows!
SELECT * FROM transactions WHERE account_id = 'xxx';
```

- ❌ Slow query
- ❌ Huge response payload
- ❌ Frontend crashes
- ❌ Poor user experience

**With pagination:**

```sql
-- Returns 20 rows
SELECT * FROM transactions
WHERE account_id = 'xxx'
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;
```

- ✅ Fast query
- ✅ Small response
- ✅ Smooth scrolling/paging
- ✅ Great UX

### Database indexing

For optimal performance, ensure indexes exist:

```sql
CREATE INDEX idx_transactions_account_created
ON transactions(account_id, created_at DESC);
```

This makes pagination queries very fast even with millions of records.

## What frontend devs need to know

When consuming this API:

1. **First request**: `GET /transactions?accountId=xxx`
   - Gets default page 1, limit 20
   - Check `total` to calculate total pages

2. **Next page**: `GET /transactions?accountId=xxx&page=2`
   - Continue incrementing page until `items` is empty

3. **Custom page size**: `GET /transactions?accountId=xxx&limit=50`
   - Get more items per request (max 100)

4. **Building a UI**:

```javascript
const response = await fetch("/transactions?accountId=xxx&page=1");
const { items, page, limit, total } = await response.json();

const totalPages = Math.ceil(total / limit);
const hasNextPage = page < totalPages;
const hasPrevPage = page > 1;
```

## Connections to other phases

- **Phase 2 (Auth)**: Provides authentication to identify user
- **Phase 3 (Accounts)**: Defines which accounts to filter by
- **Phase 4 (Deposits)**: Creates the transaction records we're listing
- **Future**: Could add filtering by date range, transaction type, etc.

## Extension ideas (not in v1)

Future enhancements could include:

- **Filtering**: `?type=deposit&from=2026-01-01&to=2026-01-31`
- **Sorting**: `?sort=amount&order=desc`
- **Search**: `?search=salary` (search in reference field)
- **Cursor-based pagination**: More efficient for very large datasets
- **Aggregations**: Total deposits, total by month, etc.
