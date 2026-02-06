# Database Validation - Visual Guide

## 🔄 The Complete Testing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     API TESTING FLOW                         │
└─────────────────────────────────────────────────────────────┘

Step 1: Run API Test
   ↓
┌──────────────────────┐
│  POST /accounts      │
│  { currency: "EUR" } │ ────→ API responds: { id: "abc-123", balance: 0 }
└──────────────────────┘
   ↓
Step 2: API Assertion (What most QA do)
   ↓
┌──────────────────────┐
│ ✅ Status: 201       │
│ ✅ Has ID            │
│ ✅ Balance: 0        │
└──────────────────────┘
   ↓
   ↓ BUT WAIT! Is the data REALLY in the database? 🤔
   ↓
Step 3: Database Validation (What you'll learn)
   ↓
┌──────────────────────────────────────┐
│  docker compose exec api npm run db:check-account -- abc-123 │
└──────────────────────────────────────┘
   ↓
┌──────────────────────────────────────┐
│ Database Shows:                      │
│ ✅ Account exists                    │
│ ✅ Currency: EUR (matches!)          │
│ ✅ Balance: 0.00 (matches!)          │
│ ✅ Linked to correct user            │
│ ✅ Created timestamp is recent       │
└──────────────────────────────────────┘
   ↓
Step 4: Full Confidence! 🎉
```

## 🏗️ Database Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE TABLES                          │
└─────────────────────────────────────────────────────────────┘

users
┌──────────────────────────────────────┐
│ id (UUID)                            │
│ email (unique)                       │
│ password_hash (encrypted!)           │
│ created_at                           │
└──────────────────────────────────────┘
           │
           │ one user has many accounts
           ↓
accounts
┌──────────────────────────────────────┐
│ id (UUID)                            │
│ user_id (→ users.id)                 │
│ currency (EUR or USD)                │
│ balance (≥ 0)                        │
│ created_at                           │
└──────────────────────────────────────┘
           │
           │ one account has many transactions
           ↓
transactions
┌──────────────────────────────────────┐
│ id (UUID)                            │
│ account_id (→ accounts.id)           │
│ type (deposit)                       │
│ amount (> 0)                         │
│ reference                            │
│ created_at                           │
└──────────────────────────────────────┘
```

## 🔍 What Each Script Checks

```
┌─────────────────────────────────────────────────────────────┐
│                    VALIDATION SCRIPTS                        │
└─────────────────────────────────────────────────────────────┘

docker compose exec api npm run db:check-users
├─ Shows: All users in system
├─ Checks: Email, creation date
└─ Security: Password is hashed ✅

docker compose exec api npm run db:check-user -- demo@qa.com
├─ Shows: User details
├─ Shows: All accounts for user
└─ Calculates: Total balance across accounts

docker compose exec api npm run db:check-accounts
├─ Shows: All accounts
├─ Shows: Currency and balance
└─ Shows: Which user owns each

docker compose exec api npm run db:check-account -- <id>
├─ Shows: Account details
├─ Shows: All transactions
├─ Validates: Balance = Sum(transactions)
└─ Checks: Account belongs to user

docker compose exec api npm run db:check-transactions -- <id>
├─ Shows: Transaction history
├─ Shows: Running balance
└─ Validates: Final balance matches

docker compose exec api npm run db:stats
├─ Counts: Users, accounts, transactions
├─ Shows: Total money by currency
├─ Shows: Recent activity
└─ Quick checks: Orphaned records, negative balances

docker compose exec api npm run db:verify-integrity
├─ Checks: All relationships valid
├─ Checks: No orphaned records
├─ Checks: All balances match transactions
├─ Checks: All constraints enforced
└─ Reports: Any issues found ⚠️
```

## 🎯 Testing Scenarios Visualization

### Scenario 1: Account Creation

```
API Test                    Database Validation
────────                    ───────────────────

POST /accounts          →   docker compose exec api npm run db:check-account -- <id>
├─ currency: EUR            ├─ ✅ Account exists
└─ Response: 201            ├─ ✅ Currency: EUR
                            ├─ ✅ Balance: 0.00
                            ├─ ✅ Linked to user
                            └─ ✅ No transactions yet
```

### Scenario 2: Making a Deposit

```
API Test                    Database Validation
────────                    ───────────────────

POST /deposits          →   docker compose exec api npm run db:check-account -- <id>
├─ amount: 100              ├─ ✅ Balance updated to 100
├─ reference: "Test"        ├─ ✅ Transaction created
└─ Response: 200            └─ ✅ Reference saved
    └─ balance: 100
                        →   docker compose exec api npm run db:check-transactions -- <id>
                            ├─ ✅ 1 transaction found
                            ├─ ✅ Type: deposit
                            ├─ ✅ Amount: 100.00
                            ├─ ✅ Reference: "Test"
                            └─ ✅ Sum = Balance
```

### Scenario 3: Multiple Deposits

```
API Tests                   Database Validation
─────────                   ───────────────────

Deposit #1: 100         →   docker compose exec api npm run db:check-transactions -- <id>
Deposit #2: 50
Deposit #3: 25              Transaction #1: 100 (Running: 100)
                            Transaction #2: 50  (Running: 150)
Final Balance: 175          Transaction #3: 25  (Running: 175)

                            ✅ Sum: 175
                            ✅ Balance: 175
                            ✅ MATCH!
```

## 🚨 Bug Detection Example

### What API Tests Miss

```
┌────────────────────────────────────────────────────────────┐
│  BUG SCENARIO: Balance Update Fails                       │
└────────────────────────────────────────────────────────────┘

API Test (PASSES ✅)
────────────────────
POST /deposits
amount: 100
→ Response: 200 OK
→ Body: { balance: 100 }

But... in the database...

Database Reality (FAILS ❌)
──────────────────────────
docker compose exec api npm run db:check-account -- <id>

Balance: 0.00  ❌ MISMATCH!
Transactions: 1
Sum of transactions: 100

⚠️  BUG FOUND: Transaction created but balance not updated!
   API returned wrong balance or database update failed.

Without DB validation, this bug would go to production! 💥
```

## 📊 Learning Path Visual

```
┌─────────────────────────────────────────────────────────────┐
│                   YOUR LEARNING JOURNEY                      │
└─────────────────────────────────────────────────────────────┘

Week 1: Beginner
────────────────
📖 Read: Getting Started Guide (5 min)
🎯 Do: Run each script command
✅ Goal: Understand why DB validation matters

Week 2: Practicing
───────────────────
📖 Read: Complete Guide (30 min)
🎯 Do: Validate after every test
✅ Goal: Make it a habit

Week 3: Intermediate
────────────────────
📖 Read: Example tests
🎯 Do: Find a data inconsistency
✅ Goal: Build validation intuition

Week 4: Advanced
────────────────
📖 Read: Helper code
🎯 Do: Add DB assertions to tests
✅ Goal: Automate validation

Month 2+: Expert
────────────────
📖 Create: Custom scripts
🎯 Do: Teach others
✅ Goal: Make it standard practice
```

## 🛠️ Tool Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  HOW THE TOOLS WORK                          │
└─────────────────────────────────────────────────────────────┘

Your Command
     ↓
docker compose exec api npm run db:check-account -- abc-123
     ↓
package.json → Runs tsx scripts/db-check-account.ts
     ↓
Script connects to → PostgreSQL Database
     │                      │
     │ ← Query: SELECT * FROM accounts WHERE id = ?
     │ → Returns: Account data
     ↓
Script formats and displays:
     ↓
┌──────────────────────────┐
│ 💰 ACCOUNT DETAILS       │
│   ID: abc-123            │
│   Currency: EUR          │
│   Balance: 100.00        │
│                          │
│ 📜 TRANSACTIONS          │
│   #1: deposit 100.00     │
│                          │
│ ✅ Balance verified!     │
└──────────────────────────┘
```

## 🔐 Security Validation Visual

```
┌─────────────────────────────────────────────────────────────┐
│               PASSWORD SECURITY CHECK                        │
└─────────────────────────────────────────────────────────────┘

❌ BAD (Plain Text - NEVER!)
────────────────────────────
email: demo@qa.com
password: demo123           ← Visible! Hackable! 😱

✅ GOOD (Hashed - Always!)
────────────────────────────
email: demo@qa.com
password_hash: $2b$10$KZe... ← Encrypted! Safe! 🔒

How to check:
docker compose exec api npm run db:check-user -- demo@qa.com
→ Shows password_hash starting with $2b$ ✅
```

## 📈 Validation Coverage Map

```
┌─────────────────────────────────────────────────────────────┐
│              WHAT WE VALIDATE                                │
└─────────────────────────────────────────────────────────────┘

Data Creation
├─ ✅ Record exists
├─ ✅ All fields populated
└─ ✅ Relationships correct

Data Accuracy
├─ ✅ Values match API
├─ ✅ Types correct
└─ ✅ Precision maintained

Data Integrity
├─ ✅ No duplicates (when unique)
├─ ✅ No orphaned records
├─ ✅ Constraints enforced
└─ ✅ Calculations correct

Security
├─ ✅ Passwords hashed
├─ ✅ User isolation
└─ ✅ Sensitive data protected

Relationships
├─ ✅ Accounts → Users
├─ ✅ Transactions → Accounts
└─ ✅ Cascade deletes work
```

## 🎯 Success Checklist

```
✅ I understand why DB validation is necessary
✅ I can run validation scripts from command line
✅ I know what to look for in the output
✅ I can identify data inconsistencies
✅ I validate after important operations
✅ I use db:verify-integrity regularly
✅ I can report bugs with DB evidence
✅ I've added DB assertions to my tests
```

---

## 💡 Remember

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│     API Tests = What the API SAYS happened                  │
│                                                              │
│     DB Validation = What ACTUALLY happened                  │
│                                                              │
│     Both Together = Complete Confidence! 🚀                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Start your journey:** [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md)
