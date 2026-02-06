# Database Validation - Getting Started

## 👋 Welcome!

This document will help you get started with database validation in just 5 minutes.
Here, you DONT need to know SQL or database internals. If you want to skip this tutorial, go to the [full documentation](./DATABASE_VALIDATION_GUIDE.md).

## Prerequisites

Make sure your environment is running:

```bash
# Start the services
docker compose up -d --build

# Verify API is running
curl http://localhost:3000/health
```

## 🎯 Your First Database Validation (5-minute tutorial)

### Step 1: Check Existing Data (1 min)

From your terminal, see what's already in the database:

```bash
# See all users (run inside Docker container)
docker compose exec api npm run db:check-users
```

**You should see:**

- The demo users (demo@qa.com and second-demo@qa.com)
- A hashed password (secure!)
- Creation timestamp

### Step 2: Run a Test (1 min)

Let's create an account via API:

```bash
# Run account tests
npm test -- accounts.spec.ts
```

The test will create accounts and test various scenarios.

### Step 3: Validate in Database (2 min)

Now let's verify that data in the database:

```bash
# See all accounts that were created
docker compose exec api npm run db:check-accounts
```

**Copy one of the account IDs from the output, then:**

```bash
# Check specific account (replace with actual ID)
docker compose exec api npm run db:check-account -- <paste-account-id-here>
```

**What to look for:**

- ✅ Currency is EUR or USD
- ✅ Balance is shown
- ✅ Owner email matches demo@qa.com
- ✅ Created timestamp is recent

### Step 4: Check Deposits (1 min)

Let's run deposit tests and verify:

```bash
# Run deposit tests
npm test -- deposits.spec.ts

# Then check accounts again
docker compose exec api npm run db:check-accounts
```

**You should now see some accounts with balances > 0**

Pick an account with a balance and check its transactions:

```bash
docker compose exec api npm run db:check-transactions -- <account-id-with-balance>
```

**What to look for:**

- ✅ Transactions are listed
- ✅ Each has an amount and type
- ✅ Sum of transactions = account balance

### Step 5: Run Integrity Check (30 sec)

Finally, let's verify everything is consistent:

```bash
docker compose exec api npm run db:verify-integrity
```

**If everything is working correctly, you should see:**

```
✅ ALL CHECKS PASSED - Database integrity is good!
```

## 🎉 Congratulations!

You've just completed your first database validation! You now know how to:

1. ✅ View users and accounts in the database
2. ✅ Check specific account details
3. ✅ Verify transactions
4. ✅ Run integrity checks

## 🚀 Next Steps

### For Day-to-Day Testing

Use this workflow:

```bash
# 1. Run your API tests
npm test -- <test-file>.spec.ts

# 2. Validate the results
docker compose exec api npm run db:check-accounts           # See what was created
docker compose exec api npm run db:check-account -- <id>    # Check specific account
docker compose exec api npm run db:check-transactions -- <id> # Check transactions

# 3. Verify integrity (do this daily or after major tests)
docker compose exec api npm run db:verify-integrity
```

### Learn More

1. **Read the complete guide:**
   - [DATABASE_VALIDATION_GUIDE.md](./DATABASE_VALIDATION_GUIDE.md) - Full documentation with examples

2. **Quick reference for commands:**
   - [DB_VALIDATION_QUICK_REFERENCE.md](./DB_VALIDATION_QUICK_REFERENCE.md) - Cheat sheet

3. **See code examples:**
   - [tests/api/db-validation-examples.spec.ts](../tests/api/db-validation-examples.spec.ts) - Example tests

4. **Use in your tests:**
   - [tests/helpers/db-helpers.ts](../tests/helpers/db-helpers.ts) - Helper functions

## 🆘 Need Help?

### Common Issues

**"Cannot connect to database"**

```bash
# Check if database is running
docker compose ps

# Restart if needed
docker compose restart db
```

**"No users found"**

```bash
# Create demo user (runs inside container)
docker compose exec api npm run seed
```

**"Account not found"**

```bash
# List all accounts to find correct ID
docker compose exec api npm run db:check-accounts
```

### Quick Reference

| What I Want            | Command                                 |
| ---------------------- | --------------------------------------- |
| See all users          | `docker compose exec api npm run db:check-users`                |
| See all accounts       | `docker compose exec api npm run db:check-accounts`             |
| Check specific account | `docker compose exec api npm run db:check-account -- <id>`      |
| Check transactions     | `docker compose exec api npm run db:check-transactions -- <id>` |
| Check everything is OK | `docker compose exec api npm run db:verify-integrity`           |
| See statistics         | `docker compose exec api npm run db:stats`                      |


## 💡 Pro Tips

1. **Keep IDs handy** - Copy account IDs from API responses to validate quickly
2. **Check after each important operation** - Don't wait until the end
3. **Use integrity checks regularly** - Catch problems early
4. **Compare API vs DB** - They should always match!
5. **Look for patterns** - If one test fails validation, check related tests too

## 🎓 Remember

**API tests show what the API returns.**
**Database validation shows what actually happened.**

Both are essential for complete test coverage!

---

**Ready to start?** Run the 5-minute tutorial above, then dive into the full guide!

For questions or issues, refer to the [full documentation](./DATABASE_VALIDATION_GUIDE.md).
