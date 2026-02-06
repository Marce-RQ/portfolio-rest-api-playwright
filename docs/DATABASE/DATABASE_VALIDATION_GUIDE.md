# Database Validation Guide for QA Testers

## Table of Contents

1. [Introduction](#introduction)
2. [Why Validate the Database?](#why-validate-the-database)
3. [Understanding Our Database Structure](#understanding-our-database-structure)
4. [How to Access the Database](#how-to-access-the-database)
5. [Common Validation Scenarios](#common-validation-scenarios)
6. [Using the DB Validation Scripts](#using-the-db-validation-scripts)
7. [Best Practices](#best-practices)

---

## Introduction

This guide is designed for QA testers with no prior experience in database validation. It will teach you **what** database validation is, **why** it matters, **when** to use it, and **how** to perform it in this project.

Don't worry if you've never worked with databases before - we'll explain everything step by step!

---

## Why Validate the Database?

### Understanding the Full Picture

When you test an API, you're usually checking:

- ✅ Does the API respond correctly? (Status code 200, 400, 401, etc.)
- ✅ Does the response body contain the right data?
- ✅ Are error messages correct?

**But here's what API tests alone DON'T tell you:**

- ❓ Was the data actually saved to the database?
- ❓ Was it saved in the correct format?
- ❓ Are there any unexpected side effects (extra records, deleted records)?
- ❓ Are database constraints being enforced?
- ❓ Is sensitive data (like passwords) properly encrypted?

### Real-World Example

Imagine this scenario:

```javascript
// Your API test
test("Create account with EUR currency", async ({ request }) => {
  const response = await request.post("/accounts", {
    data: { currency: "EUR" },
  });

  expect(response.status()).toBe(201); // ✅ Pass
  expect(body.currency).toBe("EUR"); // ✅ Pass
});
```

This test passes! But what if:

- The API returns success but **doesn't actually save to the database**?
- The account is created but with **wrong initial balance** (should be 0)?
- The account is created **without linking to the user**?
- **Multiple duplicate accounts** are created instead of one?

**These bugs would NOT be caught by API testing alone!**

That's why we need database validation.

---

## Understanding Our Database Structure

Our application uses **PostgreSQL** and has three main tables:

### 1. Users Table

Stores user authentication information.

| Column        | Type      | Description                            |
| ------------- | --------- | -------------------------------------- |
| id            | UUID      | Unique identifier                      |
| email         | TEXT      | User's email (unique)                  |
| password_hash | TEXT      | Encrypted password (never plain text!) |
| created_at    | TIMESTAMP | When the user was created              |

### 2. Accounts Table

Stores financial accounts belonging to users.

| Column     | Type      | Description                             |
| ---------- | --------- | --------------------------------------- |
| id         | UUID      | Unique identifier                       |
| user_id    | UUID      | Links to the user who owns this account |
| currency   | TEXT      | Either 'EUR' or 'USD'                   |
| balance    | NUMERIC   | Current balance (must be >= 0)          |
| created_at | TIMESTAMP | When the account was created            |

### 3. Transactions Table

Stores all transactions (deposits, etc.) for accounts.

| Column     | Type      | Description                                 |
| ---------- | --------- | ------------------------------------------- |
| id         | UUID      | Unique identifier                           |
| account_id | UUID      | Links to the account                        |
| type       | TEXT      | Transaction type (currently only 'deposit') |
| amount     | NUMERIC   | Transaction amount (must be > 0)            |
| reference  | TEXT      | Optional reference note                     |
| created_at | TIMESTAMP | When the transaction was created            |

### Relationships

```
users (1) ──→ accounts
              Each user can have multiple accounts

accounts (1) ──→ transactions
                 Each account can have multiple transactions
```

---

## How to Access the Database

### Method 1: Using Our Custom Scripts (Recommended for QA)

We've created easy-to-use scripts that don't require you to know SQL. See [Using the DB Validation Scripts](#using-the-db-validation-scripts) section below.

### Method 2: Using `psql` Command Line (For Advanced Users)

If you want to run custom queries:

1. **Connect to the database:**

   ```bash
   # On macOS/Linux
   psql $DATABASE_URL

   # Or if you have connection details separately
   psql -h localhost -p 5432 -U your_user -d your_database
   ```

2. **Common psql commands:**
   ```sql
   \dt              -- List all tables
   \d users         -- Show structure of 'users' table
   \q               -- Quit psql
   ```

### Method 3: Using Database GUI Tools

You can also use visual tools like:

- **pgAdmin** (Free, full-featured)
- **DBeaver** (Free, cross-platform)
- **Postico** (macOS, paid)
- **TablePlus** (macOS/Windows, freemium)

Connection details are in your `.env` file under `DATABASE_URL`.

---

## Common Validation Scenarios

### Scenario 1: User Registration/Login

**What to validate:**

- ✅ User exists in the database after API call
- ✅ Email is stored correctly
- ✅ Password is hashed (NOT plain text!)
- ✅ User ID matches what API returned
- ✅ Only ONE user was created (no duplicates)

**When to validate:**

- After user registration
- When testing duplicate email prevention
- When checking password security

**Example check:**

```bash
docker compose exec api npm run db:check-user -- demo@qa.com
```

### Scenario 2: Account Creation

**What to validate:**

- ✅ Account exists in the database
- ✅ Account is linked to correct user
- ✅ Currency is stored correctly (EUR or USD)
- ✅ Initial balance is 0 (not null or negative)
- ✅ Account ID matches API response
- ✅ Created timestamp is recent and correct

**When to validate:**

- After creating an account via API
- When testing multi-currency support
- When checking user isolation (User A can't see User B's accounts)

**Example check:**

```bash
docker compose exec api npm run db:check-accounts -- <account_id>
```

### Scenario 3: Deposits/Transactions

**What to validate:**

- ✅ Transaction record is created
- ✅ Account balance is updated correctly
- ✅ Transaction amount matches deposit amount
- ✅ Transaction type is correct ('deposit')
- ✅ Reference text is stored if provided
- ✅ Multiple transactions sum to correct balance

**When to validate:**

- After making a deposit
- When testing balance calculations
- When checking transaction history
- After concurrent deposits (race conditions)

**Example check:**

```bash
docker compose exec api npm run db:check-transactions -- <account_id>
```

### Scenario 4: Data Integrity & Constraints

**What to validate:**

- ✅ Balances never go negative
- ✅ Deleted users cascade delete their accounts
- ✅ Deleted accounts cascade delete their transactions
- ✅ Invalid currencies are rejected
- ✅ Duplicate emails are prevented

**When to validate:**

- When testing edge cases
- After bulk operations
- During security testing

---

## Using the DB Validation Scripts

We've created helper scripts that make database validation easy, even if you don't know SQL!

### Available Scripts

#### 1. Check All Users

```bash
docker compose exec api npm run db:check-users
```

**What it shows:**

- List of all users
- Their IDs, emails, and creation dates
- Total number of users

**Example output:**

```
=== All Users ===
ID: 123e4567-e89b-12d3-a456-426614174000
Email: demo@qa.com
Created: 2026-01-15 10:30:45
---
Total users: 1
```

#### 2. Check Specific User

```bash
docker compose exec api npm run db:check-user -- <email>
# Example:
docker compose exec api npm run db:check-user -- demo@qa.com
```

**What it shows:**

- User details
- All accounts belonging to this user
- Total balance across all accounts

#### 3. Check All Accounts

```bash
docker compose exec api npm run db:check-accounts
```

**What it shows:**

- All accounts in the system
- Their currencies and balances
- Which user owns each account

#### 4. Check Specific Account

```bash
docker compose exec api npm run db:check-account -- <account_id>
# Example:
docker compose exec api npm run db:check-account -- 987fcdeb-51a2-43d7-9f3e-8b6c2a1d4e3f
```

**What it shows:**

- Account details (balance, currency)
- Owner information
- All transactions for this account
- Calculated vs stored balance verification

#### 5. Check Transactions

```bash
docker compose exec api npm run db:check-transactions -- <account_id>
# Example:
docker compose exec api npm run db:check-transactions -- 987fcdeb-51a2-43d7-9f3e-8b6c2a1d4e3f
```

**What it shows:**

- All transactions for the account
- Transaction types, amounts, references
- Sum of all transactions
- Whether sum matches current balance

#### 6. Check Database Statistics

```bash
docker compose exec api npm run db:stats
```

**What it shows:**

- Total users, accounts, transactions
- Total money in system by currency
- Average balance per account
- Recent activity

#### 7. Verify Data Integrity

```bash
docker compose exec api npm run db:verify-integrity
```

**What it checks:**

- ✅ All accounts have valid users
- ✅ All transactions have valid accounts
- ✅ Balances match transaction sums
- ✅ No negative balances
- ✅ No orphaned records
- Reports any issues found

---

## Best Practices

### 1. When to Validate the Database

**DO validate after:**

- ✅ Critical operations (create account, make deposit)
- ✅ Bulk operations (creating multiple records)
- ✅ Data modifications (updates, deletes)
- ✅ Security-critical operations (authentication, authorization)
- ✅ When API response seems suspicious

**DON'T validate for:**

- ❌ Every single API call (too slow, unnecessary)
- ❌ Simple read operations (GET requests)
- ❌ Already well-tested CRUD operations

### 2. Validation Timing

**Option A: Immediate validation**

```javascript
test("Create account and verify in DB", async ({ request }) => {
  // 1. Create account via API
  const response = await request.post("/accounts", {
    data: { currency: "EUR" },
  });
  const { id } = await response.json();

  // 2. Verify API response
  expect(response.status()).toBe(201);

  // 3. Immediately verify in database
  // Run: docker compose exec api npm run db:check-account -- {id}
  // Or use programmatic check (see advanced section)
});
```

**Option B: Periodic validation**

```javascript
test.afterAll(async () => {
  // After all tests, verify data integrity
  // Run: docker compose exec api npm run db:verify-integrity
});
```

### 3. What to Check

**Minimum checks:**

1. Record exists
2. Key fields match (IDs, amounts, types)
3. Record count is correct

**Thorough checks:**

1. All fields match expected values
2. Relationships are correct
3. Timestamps are reasonable
4. Constraints are enforced
5. No side effects on other data

### 4. Documenting Database Checks

When reporting bugs, include:

```markdown
## Bug: Account created with negative balance

**API Test Result:** ✅ Pass
**Database Validation:** ❌ Fail

**Steps:**

1. POST /accounts with currency: EUR
2. API returned 201 with balance: 0
3. Database shows balance: -100

**Database Query:**
docker compose exec api npm run db:check-account -- 987fcdeb-51a2-43d7-9f3e-8b6c2a1d4e3f

**Expected:** balance = 0
**Actual:** balance = -100

**Impact:** Critical - violates business rules
```

### 5. Test Data Management

**Keep database clean:**

```bash
# If using Docker
docker-compose down -v  # Removes all data
docker-compose up -d    # Fresh start

# Then re-initialize
npm run migrate
npm run seed
```

**Isolate tests:**

- Each test should create its own data
- Don't rely on existing data
- Clean up after tests if needed

### 6. Security Checks

**Always verify:**

- ✅ Passwords are hashed (never plain text in database)
- ✅ Users can only see their own data
- ✅ Deleted users' data is properly handled
- ✅ Sensitive fields are not logged

**Example check:**

```bash
# Check that password is hashed
docker compose exec api npm run db:check-user -- demo@qa.com
# Should see: password_hash: $2b$10$... (NOT "demo123")
```

---

## Practical Example: Complete Test Flow

Let's walk through a complete example:

### Scenario: Test Deposit Functionality

**Step 1: Perform API test**

```javascript
test("Make deposit", async ({ request }) => {
  const token = await getAuthToken(request);
  const accountId = await createAccount(request, token);

  // Make deposit
  const response = await request.post("/deposits", {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      accountId,
      amount: 100,
      reference: "Test deposit",
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.balance).toBe(100);
});
```

**Step 2: Validate in database**

```bash
# Check the account balance
docker compose exec api npm run db:check-account -- <account_id>

# Check the transaction was recorded
docker compose exec api npm run db:check-transactions -- <account_id>
```

**Step 3: Verify results**

**What to look for:**

- Account balance is exactly 100
- One transaction exists with:
- ✅ Account balance is exactly 100
- ✅ One transaction exists with:
  - type: 'deposit'
  - amount: 100
  - reference: 'Test deposit'
- ✅ Transaction timestamp is recent (within last few seconds)

**Step 4: Test edge case with DB validation**

Make multiple deposits and verify:

```bash
# After 3 deposits of 100, 50, 25
docker compose exec api npm run db:check-transactions -- <account_id>

# Verify:
# - 3 transactions exist
# - Sum = 175
# - Balance = 175
```

---

## Troubleshooting

### "Connection refused" error

**Problem:** Can't connect to database

**Solutions:**

1. Check if database is running:
   ```bash
   docker-compose ps
   ```
2. Verify `DATABASE_URL` in `.env` file
3. Restart database:
   ```bash
   docker-compose restart db
   ```

### "Permission denied" error

**Problem:** Don't have access to database

**Solutions:**

1. Check database credentials in `.env`
2. Verify user has correct permissions
3. Try connecting as superuser first

### "Table doesn't exist" error

**Problem:** Database not initialized

**Solution:**

```bash
npm run migrate  # Creates tables
npm run seed     # Creates demo user
```

### Empty results

**Problem:** Query returns no data

**Possible causes:**

1. Wrong ID being queried
2. Data was never created
3. Looking at wrong database
4. Data was cleaned up by test teardown

---

## Learning Resources

### SQL Basics (Optional but helpful)

If you want to write custom queries:

```sql
-- Get all users
SELECT * FROM users;

-- Get specific user
SELECT * FROM users WHERE email = 'demo@qa.com';

-- Get user with their accounts
SELECT u.email, a.currency, a.balance
FROM users u
JOIN accounts a ON u.id = a.user_id
WHERE u.email = 'demo@qa.com';

-- Count transactions per account
SELECT account_id, COUNT(*), SUM(amount)
FROM transactions
GROUP BY account_id;
```

### Recommended Reading

1. "SQL for QA Engineers" - Understanding basic queries
2. "Database Testing Best Practices" - Industry standards
3. PostgreSQL documentation - Understanding data types

---

## Summary

**Key Takeaways:**

1. **API tests alone are not enough** - they don't verify actual data persistence
2. **Database validation catches bugs** that API tests miss
3. **Use our scripts** - you don't need to know SQL to validate data
4. **Focus on critical paths** - don't validate everything, validate what matters
5. **Document your findings** - include both API and DB results in bug reports

**Next Steps:**

1. ✅ Read this guide completely
2. ✅ Try each script command with the demo data
3. ✅ Run a real test and validate the results
4. ✅ Report any discrepancies you find
5. ✅ Learn basic SQL (optional but recommended)

---

## Quick Reference Card

```bash
# User checks
docker compose exec api npm run db:check-users                    # List all users
docker compose exec api npm run db:check-user -- demo@qa.com      # Check specific user

# Account checks
docker compose exec api npm run db:check-accounts                 # List all accounts
docker compose exec api npm run db:check-account -- <account_id>  # Check specific account

# Transaction checks
docker compose exec api npm run db:check-transactions -- <account_id>  # List transactions

# System checks
docker compose exec api npm run db:stats                          # Database statistics
docker compose exec api npm run db:verify-integrity               # Verify data integrity

# Maintenance
docker compose exec api npm run migrate                           # Create tables
docker compose exec api npm run seed                              # Create demo user
```

**Questions?** Refer to the [API Documentation](API_DOCUMENTATION.md) or ask your team lead!

---

## 🎓 Learning Path

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
