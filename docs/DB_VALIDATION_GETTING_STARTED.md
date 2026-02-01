# Database Validation - Getting Started

## 👋 Welcome!

This document will help you get started with database validation in just 5 minutes.

## Prerequisites

Make sure your environment is running:

```bash
# Start the services
docker compose up -d

# Verify API is running
curl http://localhost:3000/health
```

## 🎯 Your First Database Validation (5-minute tutorial)

### Step 1: Check Existing Data (1 min)

Let's see what's already in the database:

```bash
# See all users
npm run db:check-users
```

**You should see:**

- The demo user (demo@qa.com)
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
npm run db:check-accounts
```

**Copy one of the account IDs from the output, then:**

```bash
# Check specific account (replace with actual ID)
npm run db:check-account -- <paste-account-id-here>
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
npm run db:check-accounts
```

**You should see accounts with non-zero balances now!**

Pick an account with a balance and check its transactions:

```bash
npm run db:check-transactions -- <account-id-with-balance>
```

**What to look for:**

- ✅ Transactions are listed
- ✅ Each has an amount and type
- ✅ Sum of transactions = account balance

### Step 5: Run Integrity Check (30 sec)

Finally, let's verify everything is consistent:

```bash
npm run db:verify-integrity
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
npm run db:check-accounts           # See what was created
npm run db:check-account -- <id>    # Check specific account
npm run db:check-transactions -- <id> # Check transactions

# 3. Verify integrity (do this daily or after major tests)
npm run db:verify-integrity
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
# Create demo user
npm run seed
```

**"Account not found"**

```bash
# List all accounts to find correct ID
npm run db:check-accounts
```

### Quick Reference

| What I Want            | Command                                 |
| ---------------------- | --------------------------------------- |
| See all users          | `npm run db:check-users`                |
| See all accounts       | `npm run db:check-accounts`             |
| Check specific account | `npm run db:check-account -- <id>`      |
| Check transactions     | `npm run db:check-transactions -- <id>` |
| Check everything is OK | `npm run db:verify-integrity`           |
| See statistics         | `npm run db:stats`                      |

## 📝 Practice Exercise

Try this on your own:

1. Run the account creation test
2. Find the account ID from the test output or database
3. Check that account in the database
4. Make a deposit to that account
5. Verify the transaction was recorded
6. Check the balance matches the transaction sum

**Challenge:** Can you find any data inconsistencies?

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
