# Database Validation Quick Reference

## 🚀 Quick Start

### Check Database After API Tests

```bash
# 1. After login test - verify user exists
npm run db:check-user -- demo@qa.com

# 2. After account creation - verify account
npm run db:check-account -- <account_id>

# 3. After deposit - verify transaction
npm run db:check-transactions -- <account_id>

# 4. Check overall database health
npm run db:stats
npm run db:verify-integrity
```

---

## 📋 All Available Commands

| Command                                 | What It Does                         | When to Use                          |
| --------------------------------------- | ------------------------------------ | ------------------------------------ |
| `npm run db:check-users`                | Lists all users                      | After user registration tests        |
| `npm run db:check-user -- <email>`      | Shows specific user + their accounts | Verify user exists and owns accounts |
| `npm run db:check-accounts`             | Lists all accounts                   | See all accounts in system           |
| `npm run db:check-account -- <id>`      | Shows account details + transactions | After account creation or deposits   |
| `npm run db:check-transactions -- <id>` | Lists all transactions for account   | Verify transaction history           |
| `npm run db:stats`                      | Shows database statistics            | Overview of entire system            |
| `npm run db:verify-integrity`           | Runs all integrity checks            | After test suite or when debugging   |

---

## 🎯 Common Validation Scenarios

### Scenario 1: Just Created an Account

```bash
# API returned account ID: abc123
npm run db:check-account -- abc123

# ✅ Check for:
# - Account exists
# - Currency matches (EUR or USD)
# - Balance is 0.00
# - Belongs to correct user
```

### Scenario 2: Made a Deposit

```bash
# After depositing 100 to account abc123
npm run db:check-account -- abc123

# ✅ Check for:
# - Balance is 100.00
# - Transaction exists
# - Transaction amount is 100.00
# - Balance = Sum of transactions
```

### Scenario 3: Multiple Deposits

```bash
# After 3 deposits: 100, 50, 25
npm run db:check-transactions -- abc123

# ✅ Check for:
# - 3 transactions exist
# - Total = 175
# - Balance = 175
# - Transactions in correct order
```

### Scenario 4: Testing User Data

```bash
# Check user and all their data
npm run db:check-user -- demo@qa.com

# ✅ Check for:
# - User exists
# - Password is hashed (not plain text)
# - All accounts shown
# - Total balances calculated
```

### Scenario 5: End of Test Suite

```bash
# Verify everything is consistent
npm run db:verify-integrity

# ✅ Checks for:
# - No orphaned records
# - No negative balances
# - Balances match transactions
# - No data corruption
```

---

## 🔍 What to Look For

### ✅ GOOD Signs

```
✅ Balance matches transaction sum
✅ Password is hashed
✅ No negative balances
✅ No orphaned records
✅ Timestamps are recent
✅ Record counts match expectations
```

### ❌ BAD Signs

```
❌ Balance mismatch
❌ Plain text passwords
❌ Negative balances
❌ Missing records
❌ Extra duplicate records
❌ Old timestamps for new data
```

---

## 🧪 Testing Workflow

### Step-by-Step Process

```bash
# 1. Before tests - check baseline
npm run db:stats

# 2. Run your API test
npm test -- auth.spec.ts

# 3. Immediately after - validate in DB
npm run db:check-user -- demo@qa.com

# 4. If something looks wrong
npm run db:verify-integrity
```

---

## 💡 Pro Tips

### Tip 1: Copy Account IDs from API Responses

```bash
# When API returns: { "id": "abc-123-def", ... }
npm run db:check-account -- abc-123-def
```

### Tip 2: Use Verify Integrity Regularly

```bash
# Run after every major test or daily
npm run db:verify-integrity
```

### Tip 3: Check Stats for Overview

```bash
# Quick health check
npm run db:stats
# Shows: total users, accounts, transactions, balances
```

### Tip 4: Compare API Response to DB

```
API says: balance = 100
DB command: npm run db:check-account -- <id>
DB shows: balance = 100 ✅ Match!
```

### Tip 5: Look for Patterns in Transactions

```bash
npm run db:check-transactions -- <id>
# Check: timestamps in order, amounts correct, types valid
```

---

## 🐛 Troubleshooting

### Problem: "Account not found"

**Cause:** Wrong ID or account was deleted

**Solution:**

```bash
npm run db:check-accounts  # See all accounts
# Find the correct ID and try again
```

### Problem: "No users found"

**Cause:** Database not seeded

**Solution:**

```bash
npm run seed  # Creates demo user
npm run db:check-users  # Verify
```

### Problem: Balance mismatch

**Cause:** Bug in application or database corruption

**Action:**

1. Note the difference
2. Check transaction history
3. Report as bug with evidence:
   ```
   Account: abc-123
   API balance: 100
   DB balance: 95
   Difference: -5
   ```

---

## 📊 Interpreting Results

### Understanding Account Output

```
💰 ACCOUNT DETAILS:
  ID: abc-123-def-456
  Currency: EUR               ← Should be EUR or USD
  Balance: 150.50             ← Should match transaction sum
  Owner: demo@qa.com          ← Should match logged-in user
  Created: 2026-02-01...      ← Should be recent
```

### Understanding Transaction Output

```
📜 TRANSACTIONS:
  Transaction #1:
    Type: deposit             ← Should be 'deposit'
    Amount: 100.00            ← Should match API request
    Reference: First deposit  ← Should match if provided
    Created: 2026-02-01...    ← Should be in chronological order
```

### Understanding Integrity Check

```
✅ No negative balances      ← All balances >= 0
✅ No orphaned accounts       ← All accounts have valid users
✅ Balance matches sum        ← Balance = sum of transactions
❌ Found 2 balance mismatches ← PROBLEM! Investigate these
```

---

## 📝 Reporting Bugs with DB Evidence

### Good Bug Report Template

```markdown
## Bug: Account Balance Incorrect After Deposit

**API Test:** ✅ PASS (returned 200)
**DB Validation:** ❌ FAIL

**Steps:**

1. Created account (ID: abc-123)
2. POST /deposits with amount: 100
3. API returned: { balance: 100 }
4. DB shows: balance: 95

**Evidence:**
npm run db:check-account -- abc-123

**Expected:** 100.00
**Actual:** 95.00
**Difference:** -5.00

**Impact:** Critical - money is missing
**Reproducible:** Yes, every time
```

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

---

## ⚡ Cheat Sheet

```bash
# Most common commands you'll use daily:

# Quick health check
npm run db:stats

# Check after account creation
npm run db:check-account -- <account_id>

# Check after deposit
npm run db:check-transactions -- <account_id>

# Full integrity check
npm run db:verify-integrity

# View all users
npm run db:check-users

# View all accounts
npm run db:check-accounts
```

**Remember:** API tests + DB validation = Complete confidence! 🎯
