# Database Validation Quick Reference

## 🚀 Quick Start

### Check Database After API Tests

```bash
# 1. After login test - verify user exists
docker compose exec api npm run db:check-user -- demo@qa.com

# 2. After account creation - verify account
docker compose exec api npm run db:check-account -- <account_id>

# 3. After deposit - verify transaction
docker compose exec api npm run db:check-transactions -- <account_id>

# 4. Check overall database health
docker compose exec api npm run db:stats
docker compose exec api npm run db:verify-integrity
```

---

## 📋 All Available Commands

| Command                                 | What It Does                         | When to Use                          |
| --------------------------------------- | ------------------------------------ | ------------------------------------ |
| `docker compose exec api npm run db:check-users`                | Lists all users                      | After user registration tests        |
| `docker compose exec api npm run db:check-user -- <email>`      | Shows specific user + their accounts | Verify user exists and owns accounts |
| `docker compose exec api npm run db:check-accounts`             | Lists all accounts                   | See all accounts in system           |
| `docker compose exec api npm run db:check-account -- <id>`      | Shows account details + transactions | After account creation or deposits   |
| `docker compose exec api npm run db:check-transactions -- <id>` | Lists all transactions for account   | Verify transaction history           |
| `docker compose exec api npm run db:stats`                      | Shows database statistics            | Overview of entire system            |
| `docker compose exec api npm run db:verify-integrity`           | Runs all integrity checks            | After test suite or when debugging   |

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


## 🐛 Troubleshooting

### Problem: "Account not found"

**Cause:** Wrong ID or account was deleted

**Solution:**

```bash
docker compose exec api npm run db:check-accounts  # See all accounts
# Find the correct ID and try again
```

### Problem: "No users found"

**Cause:** Database not seeded

**Solution:**

```bash
docker compose exec api npm run seed  # Creates demo user
docker compose exec api npm run db:check-users  # Verify
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

## ⚡ Cheat Sheet

```bash
# Most common commands you'll use daily:

# Quick health check
docker compose exec api npm run db:stats

# Check after account creation
docker compose exec api npm run db:check-account -- <account_id>

# Check after deposit
docker compose exec api npm run db:check-transactions -- <account_id>

# Full integrity check
docker compose exec api npm run db:verify-integrity

# View all users
docker compose exec api npm run db:check-users

# View all accounts
docker compose exec api npm run db:check-accounts
```

**Remember:** API tests + DB validation = Complete confidence! 🎯
