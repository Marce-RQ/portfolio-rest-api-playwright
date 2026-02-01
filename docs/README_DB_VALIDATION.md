# Database Validation Resources - Index

This directory contains comprehensive resources for QA testers learning database validation.

## 📚 Documentation Files

### 1. [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md) ⭐ START HERE

**For:** Complete beginners
**Time:** 5-10 minutes
**What you'll learn:**

- How to run your first database validation
- Step-by-step tutorial with real examples
- What to look for when validating data

### 2. [Complete Validation Guide](./DATABASE_VALIDATION_GUIDE.md)

**For:** Learning the concepts and details
**Time:** 30-45 minutes
**What you'll learn:**

- Why database validation is necessary
- Understanding the database structure
- Common validation scenarios
- Best practices and real-world examples
- Security checks
- Troubleshooting

### 3. [Quick Reference](./DB_VALIDATION_QUICK_REFERENCE.md)

**For:** Daily use / quick lookup
**Time:** Reference material
**What you'll find:**

- All available commands
- Common scenarios and solutions
- Cheat sheets
- Troubleshooting tips
- How to report bugs with DB evidence

### 4. [Visual Guide](./DB_VALIDATION_VISUAL_GUIDE.md)

**For:** Visual learners
**What you'll find:**

- Diagrams and flowcharts
- Visual representation of database structure
- Step-by-step testing flows
- Bug detection examples

### 5. [Troubleshooting Guide](./DB_VALIDATION_TROUBLESHOOTING.md)

**For:** When things go wrong
**What you'll find:**

- Common errors and solutions
- Connection issues
- Data problems
- Performance tips
- Getting help checklist

### 6. [API Documentation](./API_DOCUMENTATION.md)

**For:** Understanding the API endpoints
**What you'll find:**

- All API endpoints and their usage
- Request/response examples
- How the API interacts with the database

## 🛠️ Code Resources

### 1. [Database Helper Functions](../tests/helpers/db-helpers.ts)

**For:** Writing automated tests with DB validation
**What you'll find:**

- Programmatic access to database
- Helper functions for common checks
- Examples of usage in tests

### 2. [Example Tests](../tests/api/db-validation-examples.spec.ts)

**For:** Learning by example
**What you'll find:**

- 8 complete test examples
- How to combine API testing with DB validation
- Real-world scenarios
- Best practices in action

## 🚀 Database Validation Scripts

All scripts are located in `/scripts` directory and can be run via npm commands:

### User Validation Scripts

```bash
npm run db:check-users              # List all users
npm run db:check-user -- <email>    # Check specific user
```

### Account Validation Scripts

```bash
npm run db:check-accounts           # List all accounts
npm run db:check-account -- <id>    # Check specific account
```

### Transaction Validation Scripts

```bash
npm run db:check-transactions -- <account_id>  # List transactions
```

### System Validation Scripts

```bash
npm run db:stats                    # Database statistics
npm run db:verify-integrity         # Run all integrity checks
```

## 🎯 Learning Path

### Level 1: Beginner (Week 1)

1. ✅ Read [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md)
2. ✅ Complete the 5-minute tutorial
3. ✅ Run each script command with demo data
4. ✅ Bookmark [Quick Reference](./DB_VALIDATION_QUICK_REFERENCE.md)

**Goal:** Understand why DB validation matters and how to run basic checks

### Level 2: Intermediate (Week 2-3)

1. ✅ Read [Complete Validation Guide](./DATABASE_VALIDATION_GUIDE.md)
2. ✅ Practice validation after every test you run
3. ✅ Try to find data inconsistencies
4. ✅ Use `npm run db:verify-integrity` daily

**Goal:** Build confidence in database validation and make it part of your testing routine

### Level 3: Advanced (Week 4+)

1. ✅ Study [db-helpers.ts](../tests/helpers/db-helpers.ts)
2. ✅ Review [example tests](../tests/api/db-validation-examples.spec.ts)
3. ✅ Add DB validation to your own tests
4. ✅ Create custom validation functions

**Goal:** Automate database validation in your test suite

## 📋 Quick Start Checklist

Before you begin, make sure:

- [ ] Docker is installed and running
- [ ] Database is running: `docker compose up -d`
- [ ] Demo user exists: `npm run seed`
- [ ] You can run: `npm run db:check-users`

If any checkbox fails, see [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md) troubleshooting section.

## 🎓 Concepts Covered

### Database Fundamentals

- Understanding tables and relationships
- Users → Accounts → Transactions
- Primary keys and foreign keys
- Data types and constraints

### Validation Techniques

- Comparing API responses to database state
- Verifying data persistence
- Checking data integrity
- Validating relationships
- Security checks (hashed passwords)
- Transaction validation

### Testing Best Practices

- When to validate the database
- What to check
- How to document findings
- Test data management
- Isolation and cleanup

## 💡 Real-World Scenarios

The guides cover these practical scenarios:

1. **User Registration** - Verify user created, password hashed
2. **Account Creation** - Check account exists, linked to user, correct balance
3. **Deposits** - Verify transaction recorded, balance updated
4. **Multiple Operations** - Check balance calculations across multiple transactions
5. **Data Integrity** - Ensure no orphaned records, negative balances, or corruption
6. **Security** - Validate password hashing, user isolation
7. **Concurrency** - Check data consistency after parallel operations

## 🐛 Common Issues & Solutions

### Issue: "Connection refused"

**Solution:** Start database with `docker compose up -d`

### Issue: "No users found"

**Solution:** Run `npm run seed` to create demo user

### Issue: "Account not found"

**Solution:** Run `npm run db:check-accounts` to see all account IDs

### Issue: "Balance mismatch detected"

**Solution:** This is a real bug! Document it with:

- Account ID
- Expected vs actual balance
- Transaction history
- Steps to reproduce

See [Quick Reference](./DB_VALIDATION_QUICK_REFERENCE.md) for more troubleshooting.

## 📊 What Makes Good Database Validation?

### ✅ Complete Validation Includes:

1. **Existence checks** - Record was created
2. **Field validation** - Values are correct
3. **Relationship validation** - Links to other tables are correct
4. **Constraint validation** - Business rules enforced
5. **Integrity validation** - No orphaned or inconsistent data
6. **Security validation** - Sensitive data is protected

### ❌ Incomplete Validation:

- Only checking if record exists
- Not verifying related data
- Ignoring constraints
- Skipping integrity checks
- Not validating security

## 🔍 What to Validate

The guides teach you to validate:

✅ **Data Creation**

- Records are created in the database
- All required fields are populated
- Default values are applied correctly

✅ **Data Accuracy**

- Field values match API responses
- Data types are correct
- Precision is maintained (e.g., decimal places)

✅ **Data Relationships**

- Foreign keys point to existing records
- Parent-child relationships are correct
- Cascade deletes work properly

✅ **Data Integrity**

- No duplicate records when uniqueness is required
- Constraints are enforced (e.g., non-negative balances)
- Calculated fields match their sources

✅ **Security**

- Passwords are hashed, not plain text
- Users can only access their own data
- Sensitive information is properly protected

## 🎯 Success Criteria

You'll know you've mastered database validation when you can:

1. ✅ Explain why API tests alone aren't sufficient
2. ✅ Run validation checks without looking at documentation
3. ✅ Identify data inconsistencies in the database
4. ✅ Write tests that include database assertions
5. ✅ Create custom validation scripts for new scenarios
6. ✅ Report bugs with complete database evidence

## 📞 Getting Help

### Self-Service Resources

1. [Quick Reference](./DB_VALIDATION_QUICK_REFERENCE.md) - Command lookup
2. [Complete Guide](./DATABASE_VALIDATION_GUIDE.md) - Detailed explanations
3. [Example Tests](../tests/api/db-validation-examples.spec.ts) - Code samples

### What to Include When Asking for Help

1. What command you ran
2. What you expected to see
3. What you actually saw
4. Error messages (if any)
5. Output of `docker compose ps`

## 🚦 Next Steps

1. **Today:** Read [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md) and complete the tutorial
2. **This Week:** Use DB validation after every test you run
3. **This Month:** Add DB assertions to your automated tests
4. **Ongoing:** Make DB validation a standard part of your testing process

---

**Remember:** Database validation is not extra work - it's essential for complete test coverage!

Start with the [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md) and you'll be validating databases like a pro in no time! 🚀
