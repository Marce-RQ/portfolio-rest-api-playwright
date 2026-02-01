# Database Validation - Troubleshooting Guide

## 🔧 Common Issues and Solutions

This guide helps you solve problems you might encounter when using database validation tools.

---

## Connection Issues

### Error: "Connection refused" or "ECONNREFUSED"

**Symptom:**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Cause:** PostgreSQL database is not running

**Solutions:**

1. **Check if Docker is running:**

   ```bash
   docker ps
   ```

   If you see "CONTAINER ID IMAGE COMMAND CREATED STATUS PORTS NAMES" with no containers, database isn't running.

2. **Start the database:**

   ```bash
   docker compose up -d
   ```

3. **Verify database is ready:**

   ```bash
   docker compose logs db | grep "ready to accept connections"
   ```

4. **Test connection:**
   ```bash
   npm run db:check-users
   ```

### Error: "database does not exist"

**Cause:** Database hasn't been created yet

**Solution:**

```bash
# Restart with clean slate
docker compose down -v
docker compose up -d

# Wait 5 seconds, then run migrations
npm run migrate
npm run seed
```

### Error: "password authentication failed"

**Cause:** Wrong credentials in DATABASE_URL

**Solution:**

1. Check your `.env` file:

   ```bash
   cat .env | grep DATABASE_URL
   ```

2. Compare with `.env.example`:

   ```bash
   cat .env.example | grep DATABASE_URL
   ```

3. If different, fix `.env` and restart:
   ```bash
   docker compose restart
   ```

---

## Data Issues

### Error: "No users found in database"

**Symptom:** Script returns "No users found"

**Cause:** Database hasn't been seeded

**Solution:**

```bash
npm run seed
```

**Verify:**

```bash
npm run db:check-users
# Should show demo@qa.com
```

### Error: "Account not found"

**Symptom:**

```
❌ Account not found: abc-123-def
```

**Possible Causes & Solutions:**

1. **Wrong ID - Check if you copied it correctly:**

   ```bash
   npm run db:check-accounts
   # Find the correct ID
   ```

2. **Account was deleted:**

   ```bash
   # Check if any accounts exist
   npm run db:check-accounts

   # If empty, create one via API
   npm test -- accounts.spec.ts
   ```

3. **Looking at wrong database:**

   ```bash
   # Verify DATABASE_URL
   echo $DATABASE_URL

   # Should point to localhost:5432
   ```

### Warning: "User has no accounts"

**Symptom:** Script shows user but no accounts

**Is this a problem?**

- ❌ Yes, if you just created an account via API
- ✅ No, if user is newly created and hasn't created accounts yet

**If it's a bug:**

```bash
# 1. Run test again
npm test -- accounts.spec.ts

# 2. Get account ID from test output
# 3. Check if account exists
npm run db:check-account -- <id>

# 4. If still not found, this is a bug!
```

---

## Validation Issues

### Warning: "Balance mismatch detected"

**Symptom:**

```
❌ ERROR: Balance mismatch!
Expected: 100
Actual: 95
Difference: -5
```

**This is a REAL BUG!** Document it:

1. **Capture evidence:**

   ```bash
   npm run db:check-account -- <id> > bug-evidence.txt
   npm run db:check-transactions -- <id> >> bug-evidence.txt
   ```

2. **Test reproducibility:**

   ```bash
   # Run the same test again
   npm test -- <test-that-caused-issue>
   # Check if balance mismatch happens again
   ```

3. **Report the bug** with:
   - Account ID
   - Expected vs actual balance
   - Transaction history
   - Steps to reproduce
   - `bug-evidence.txt` file

### Error: "Negative balance found"

**Symptom:**

```
⚠️ Found 1 accounts with negative balance!
```

**This is a CRITICAL BUG!**

**Investigate:**

```bash
# Find the account
npm run db:check-accounts | grep -B5 "-"

# Check its history
npm run db:check-transactions -- <account-id>

# Look for:
# - Was there a withdrawal? (shouldn't exist in this app)
# - Did a calculation go wrong?
# - Was there database corruption?
```

### Error: "Orphaned records found"

**Symptom:**

```
❌ Found 2 orphaned accounts!
```

**Meaning:** Accounts exist but their users don't

**Possible Causes:**

1. User was deleted but accounts weren't (cascade delete failed)
2. Direct database manipulation
3. Bug in delete logic

**Investigation:**

```bash
# Run full integrity check
npm run db:verify-integrity

# Look at the details in the output
```

---

## Script Errors

### Error: "Cannot find module" or TypeScript errors

**Symptom:**

```
Cannot find module '../src/db/pool'
```

**Solution:**

```bash
# Reinstall dependencies
npm install

# Try again
npm run db:check-users
```

### Error: "Permission denied"

**Symptom:**

```
Error: permission denied for table users
```

**Cause:** Database user doesn't have permissions

**Solution:**

```bash
# Check DATABASE_URL in .env
# Make sure user has proper permissions
# Or recreate database:
docker compose down -v
docker compose up -d
npm run migrate
npm run seed
```

### Script hangs / never returns

**Symptom:** Command runs but never finishes

**Possible Causes:**

1. **Database is slow to respond:**

   ```bash
   # Check database logs
   docker compose logs db --tail=50
   ```

2. **Connection not closed:**
   - This is a bug in the script
   - Press Ctrl+C to stop
   - Report the issue

3. **Too much data:**

   ```bash
   # Check how many records exist
   npm run db:stats

   # If millions of records, queries will be slow
   ```

---

## Test Issues

### Tests pass but database shows wrong data

**This means you found a bug!**

**Document it:**

```markdown
## Bug: API returns success but doesn't save to DB

**Test:** accounts.spec.ts - create EUR account
**API Result:** ✅ PASS (201 status, valid response)
**DB Validation:** ❌ FAIL (account not in database)

**Steps:**

1. POST /accounts with { currency: "EUR" }
2. API returns 201 with account ID
3. npm run db:check-account -- <id>
4. Result: Account not found

**Evidence:**
[Include script output]

**Impact:** CRITICAL - data loss
```

### Script shows data but test assertions fail

**Symptom:**

- Database validation shows data exists
- Test assertions fail

**Possible Causes:**

1. **Wrong account ID in test:**

   ```javascript
   // Check that you're using the right ID
   const { id } = await response.json();
   // Use THIS id, not a hardcoded one
   ```

2. **Timing issue:**

   ```javascript
   // Add small delay for database to sync
   await new Promise((r) => setTimeout(r, 100));
   ```

3. **Different environment:**
   ```bash
   # Make sure test uses same database
   echo $DATABASE_URL
   # Should match what's in .env
   ```

---

## Performance Issues

### Scripts are very slow

**Possible Causes & Solutions:**

1. **Too much data in database:**

   ```bash
   # Check size
   npm run db:stats

   # If huge, clean up test data
   docker compose down -v
   docker compose up -d
   npm run migrate
   npm run seed
   ```

2. **Database under load:**

   ```bash
   # Check what's running
   docker stats

   # Restart database
   docker compose restart db
   ```

3. **Network issues:**
   ```bash
   # Verify connection is local
   cat .env | grep DATABASE_URL
   # Should be localhost, not remote host
   ```

---

## Docker Issues

### Error: "docker: command not found"

**Cause:** Docker is not installed

**Solution:**

1. Install Docker Desktop (Mac/Windows)
2. Install Docker Engine (Linux)
3. Verify: `docker --version`

### Error: "Cannot connect to Docker daemon"

**Cause:** Docker is not running

**Solution:**

- Mac: Start Docker Desktop app
- Linux: `sudo systemctl start docker`
- Verify: `docker ps`

### Database container keeps restarting

**Symptom:**

```bash
docker ps
# Shows db container with "Restarting (1) X seconds ago"
```

**Investigation:**

```bash
# Check logs
docker compose logs db

# Look for errors like:
# - Port already in use
# - Permission denied
# - Disk full
```

**Common Solutions:**

1. **Port conflict:**

   ```bash
   # Check if port 5432 is in use
   lsof -i :5432

   # Stop the other process or change port in docker-compose.yml
   ```

2. **Permission issues:**
   ```bash
   # Reset volumes
   docker compose down -v
   docker compose up -d
   ```

---

## Environment Issues

### Error: "DATABASE_URL is not set"

**Cause:** Missing .env file

**Solution:**

```bash
# Copy example
cp .env.example .env

# Verify
cat .env
```

### Different behavior on different machines

**Possible Causes:**

1. **Different DATABASE_URL:**

   ```bash
   # Check each machine
   cat .env | grep DATABASE_URL
   ```

2. **Different data:**

   ```bash
   # Sync databases
   # On machine 1: export data
   # On machine 2: import data
   # Or just use same Docker volume
   ```

3. **Different Node version:**
   ```bash
   node --version
   # Should be 20+
   ```

---

## Cleanup Issues

### Can't remove old test data

**Symptom:** Old accounts/transactions persist

**Solutions:**

1. **Nuclear option (removes everything):**

   ```bash
   docker compose down -v
   docker compose up -d
   npm run migrate
   npm run seed
   ```

2. **Selective cleanup (keep structure):**

   ```bash
   # Connect to database
   docker compose exec db psql -U user -d fintech_portfolio

   # Delete all data
   TRUNCATE users, accounts, transactions CASCADE;

   # Exit
   \q

   # Reseed
   npm run seed
   ```

### Volume won't delete

**Symptom:**

```bash
docker compose down -v
# Still shows old data
```

**Solution:**

```bash
# Force remove
docker volume ls
docker volume rm portfolio-api-playwright_postgres_data

# Restart fresh
docker compose up -d
```

---

## Getting Help

### When asking for help, include:

1. **What you tried:**

   ```bash
   npm run db:check-account -- abc-123
   ```

2. **What you expected:**

   ```
   Account details with balance 100
   ```

3. **What you got:**

   ```
   Error: Account not found
   ```

4. **Your environment:**

   ```bash
   docker ps
   node --version
   cat .env | grep DATABASE_URL (hide password!)
   ```

5. **Recent actions:**
   ```
   - Ran test X
   - Created account
   - Made deposit
   - Checked database
   - Got error
   ```

### Useful debug commands:

```bash
# System check
docker --version
node --version
npm --version

# Docker status
docker ps
docker compose ps

# Database status
docker compose logs db --tail=20

# API status
docker compose logs api --tail=20
curl http://localhost:3000/health

# Database content
npm run db:stats
npm run db:verify-integrity
```

---

## Quick Fixes Checklist

Try these in order:

- [ ] Is Docker running? `docker ps`
- [ ] Is database up? `docker compose ps`
- [ ] Is .env file present? `cat .env`
- [ ] Are migrations run? `npm run migrate`
- [ ] Is demo user created? `npm run seed`
- [ ] Can you connect? `npm run db:check-users`
- [ ] Is API running? `curl http://localhost:3000/health`

If all checked and still issues, restart everything:

```bash
docker compose down -v
docker compose up -d
sleep 5
npm run migrate
npm run seed
npm run db:check-users
```

---

## Prevention Tips

### Avoid issues before they happen:

1. **Always start with fresh database for critical tests:**

   ```bash
   docker compose down -v
   docker compose up -d
   npm run migrate
   npm run seed
   ```

2. **Verify database before running tests:**

   ```bash
   npm run db:stats
   npm run db:verify-integrity
   ```

3. **Clean up after tests:**

   ```bash
   # In your test cleanup
   await dbCleanup.deleteAccount(accountId);
   ```

4. **Check database regularly:**

   ```bash
   # Daily check
   npm run db:verify-integrity
   ```

5. **Keep .env in sync:**
   ```bash
   # After pulling code
   diff .env .env.example
   ```

---

## Still Having Issues?

1. Check [Getting Started Guide](./DB_VALIDATION_GETTING_STARTED.md)
2. Check [Quick Reference](./DB_VALIDATION_QUICK_REFERENCE.md)
3. Check [Complete Guide](./DATABASE_VALIDATION_GUIDE.md)
4. Ask for help with the debug info above

**Remember:** Most issues are due to database not running or not seeded. Start there! 🚀
