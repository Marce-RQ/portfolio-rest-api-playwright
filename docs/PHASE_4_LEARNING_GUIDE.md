# Phase 4 — Deposits Learning Guide

## Purpose

Implement deposit functionality that allows users to add money to their accounts while maintaining data consistency through database transactions.

## What

- **`src/routes/deposits.ts`**: Protected endpoint for creating deposits (`POST /deposits`)
- **Database transactions**: Uses PostgreSQL transactions to ensure atomicity (both transaction record AND balance update happen together)
- **`tests/api/deposits.spec.ts`**: Playwright tests validating deposit behavior, balance updates, and error cases

## Why

- **State mutation**: Unlike previous phases which only read data, deposits modify account balances—this requires careful handling
- **Data integrity**: We need to ensure that a transaction record is created AND the balance is updated together (no partial updates)
- **Atomicity**: If either operation fails, both should rollback to prevent inconsistent data
- **Audit trail**: Every deposit creates a transaction record for compliance and reporting

## How it works (high level)

1. Client sends `POST /deposits` with `accountId`, `amount`, and optional `reference`
2. Server validates:
   - Amount must be > 0
   - Account must exist
   - Account must belong to authenticated user
3. Server starts a database transaction
4. Creates a record in the `transactions` table
5. Updates the `balance` in the `accounts` table
6. Commits the transaction (or rolls back on error)
7. Returns `transactionId` and `newBalance`

## Database transactions explained

**What is a database transaction?**
A transaction is a sequence of operations that either all succeed or all fail together. It's like a safety mechanism.

**Why do we need it here?**

```
Scenario without transaction:
1. Insert transaction record ✓
2. Update balance ✗ (server crashes)
Result: Transaction recorded but balance not updated = DATA CORRUPTION
```

**With transaction:**

```javascript
BEGIN;                    // Start transaction
  INSERT INTO transactions...
  UPDATE accounts...
COMMIT;                   // Both succeed together
```

If anything fails, `ROLLBACK` undoes everything.

## Code walkthrough

### 1. Route setup

```typescript
import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { pool } from "../db/pool";

const router = Router();
router.use(authMiddleware); // All routes require authentication
```

### 2. Validation

```typescript
router.post('/', async (req: AuthRequest, res: Response) => {
  const { accountId, amount, reference } = req.body;

  // Validate required fields
  if (!accountId) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'accountId is required' }
    });
  }

  // Validate amount is a number and > 0
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'amount must be greater than 0' }
    });
  }
```

### 3. Database transaction

```typescript
  // Get a dedicated database client for the transaction
  const client = await pool.connect();

  try {
    // Begin transaction
    await client.query('BEGIN');

    // Check account exists and belongs to user
    const accountResult = await client.query(
      'SELECT id, user_id, balance FROM accounts WHERE id = $1',
      [accountId]
    );

    if (accountResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Account not found' }
      });
    }

    // Verify ownership
    if (account.user_id !== req.userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: { code: 'FORBIDDEN', message: 'You do not have access to this account' }
      });
    }

    // Insert transaction record
    const transactionResult = await client.query(
      `INSERT INTO transactions (id, account_id, type, amount, reference, created_at)
       VALUES (gen_random_uuid(), $1, 'deposit', $2, $3, NOW())
       RETURNING id`,
      [accountId, amount, reference || null]
    );

    // Update balance
    const newBalance = parseFloat(account.balance) + amount;
    await client.query(
      'UPDATE accounts SET balance = $1 WHERE id = $2',
      [newBalance, accountId]
    );

    // Commit transaction (make it permanent)
    await client.query('COMMIT');

    return res.status(201).json({
      transactionId: transactionResult.rows[0].id,
      newBalance
    });

  } catch (error) {
    // Rollback on any error
    await client.query('ROLLBACK');
    console.error('Deposit error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process deposit' }
    });
  } finally {
    // Always release the client back to the pool
    client.release();
  }
});
```

## Key concepts for beginners

### 1. Why use `pool.connect()` instead of `pool.query()`?

- **`pool.query()`**: Gets a client, runs ONE query, releases client
- **`pool.connect()`**: Gets a dedicated client for MULTIPLE queries (needed for transactions)

### 2. What is `gen_random_uuid()`?

PostgreSQL function that generates a unique ID. We use it to create transaction IDs.

### 3. Why check user_id?

Security! A user shouldn't be able to deposit into another user's account.

### 4. Why `parseFloat()`?

PostgreSQL returns numeric values as strings to preserve precision. We convert to number for calculation.

### 5. What happens in `finally`?

Always runs whether success or failure. Ensures we don't leak database connections.

## Step-by-step testing (manual)

1. **Start the app**:

```bash
docker compose up -d
```

2. **Get authentication token**:

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@qa.com","password":"demo123"}' | jq -r '.token')
```

3. **Create an account**:

```bash
ACCOUNT_ID=$(curl -s -X POST http://localhost:3000/accounts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"currency":"EUR"}' | jq -r '.id')
```

4. **Make a deposit**:

```bash
curl -X POST http://localhost:3000/deposits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "accountId": "'$ACCOUNT_ID'",
    "amount": 100.50,
    "reference": "Initial deposit"
  }' | jq
```

Expected response:

```json
{
  "transactionId": "uuid-here",
  "newBalance": 100.5
}
```

5. **Verify balance updated**:

```bash
curl -s http://localhost:3000/accounts/$ACCOUNT_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

Should show `"balance": 100.50`

## Test coverage (automated)

The `tests/api/deposits.spec.ts` file includes:

- ✅ Successful deposit increases balance
- ✅ Multiple deposits accumulate correctly
- ✅ Amount <= 0 returns 400
- ✅ Negative amount returns 400
- ✅ Unknown account returns 404
- ✅ Missing token returns 401
- ✅ Missing accountId returns 400
- ✅ Missing amount returns 400
- ✅ Deposit with reference works

Run tests:

```bash
npm test tests/api/deposits.spec.ts
```

## Common mistakes and how to avoid them

### ❌ Mistake 1: Not using transactions

```typescript
// WRONG - these could fail independently
await pool.query("INSERT INTO transactions...");
await pool.query("UPDATE accounts...");
```

### ✅ Correct: Use transactions

```typescript
const client = await pool.connect();
await client.query("BEGIN");
// ... do work
await client.query("COMMIT");
client.release();
```

### ❌ Mistake 2: Not releasing client

```typescript
const client = await pool.connect();
await client.query("BEGIN");
// ... do work
// FORGOT client.release() - connection leak!
```

### ✅ Correct: Always use finally

```typescript
const client = await pool.connect();
try {
  // ... work
} finally {
  client.release();
}
```

### ❌ Mistake 3: Not checking ownership

```typescript
// WRONG - any authenticated user could deposit to any account
const account = await pool.query("SELECT * FROM accounts WHERE id = $1");
```

### ✅ Correct: Verify user_id

```typescript
if (account.user_id !== req.userId) {
  return res.status(403).json({ error: ... });
}
```

## What's next?

Phase 5 will implement transaction listing with pagination, allowing users to see their deposit history.

## Connections to other phases

- **Phase 2 (Auth)**: Provides authentication middleware to identify the user
- **Phase 3 (Accounts)**: Created accounts that deposits modify
- **Phase 5 (Transactions)**: Will list the transaction records we create here
