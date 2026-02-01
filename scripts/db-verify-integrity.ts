#!/usr/bin/env node
/**
 * Script to verify database integrity
 * Usage: npm run db:verify-integrity
 */

import { pool } from '../src/db/pool';

interface IntegrityIssue {
  type: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
  details?: any;
}

async function verifyIntegrity() {
  const client = await pool.connect();
  const issues: IntegrityIssue[] = [];
  
  try {
    console.log('\n🔍 === DATABASE INTEGRITY VERIFICATION ===\n');
    
    // Check 1: Orphaned accounts (accounts without users)
    console.log('Checking for orphaned accounts...');
    const orphanedAccounts = await client.query(`
      SELECT a.id, a.currency, a.balance
      FROM accounts a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    if (orphanedAccounts.rows.length > 0) {
      issues.push({
        type: 'ORPHANED_ACCOUNTS',
        severity: 'ERROR',
        message: `Found ${orphanedAccounts.rows.length} accounts without valid users`,
        details: orphanedAccounts.rows
      });
    }
    
    // Check 2: Orphaned transactions (transactions without accounts)
    console.log('Checking for orphaned transactions...');
    const orphanedTransactions = await client.query(`
      SELECT t.id, t.type, t.amount
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE a.id IS NULL
    `);
    
    if (orphanedTransactions.rows.length > 0) {
      issues.push({
        type: 'ORPHANED_TRANSACTIONS',
        severity: 'ERROR',
        message: `Found ${orphanedTransactions.rows.length} transactions without valid accounts`,
        details: orphanedTransactions.rows
      });
    }
    
    // Check 3: Negative balances
    console.log('Checking for negative balances...');
    const negativeBalances = await client.query(`
      SELECT id, currency, balance
      FROM accounts
      WHERE balance < 0
    `);
    
    if (negativeBalances.rows.length > 0) {
      issues.push({
        type: 'NEGATIVE_BALANCES',
        severity: 'ERROR',
        message: `Found ${negativeBalances.rows.length} accounts with negative balances`,
        details: negativeBalances.rows
      });
    }
    
    // Check 4: Balance mismatch with transactions
    console.log('Checking balance consistency with transactions...');
    const balanceMismatches = await client.query(`
      SELECT 
        a.id,
        a.balance as stored_balance,
        COALESCE(SUM(t.amount), 0) as calculated_balance
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      GROUP BY a.id, a.balance
      HAVING a.balance != COALESCE(SUM(t.amount), 0)
    `);
    
    if (balanceMismatches.rows.length > 0) {
      issues.push({
        type: 'BALANCE_MISMATCH',
        severity: 'ERROR',
        message: `Found ${balanceMismatches.rows.length} accounts with incorrect balances`,
        details: balanceMismatches.rows.map(row => ({
          account_id: row.id,
          stored_balance: row.stored_balance,
          calculated_balance: row.calculated_balance,
          difference: parseFloat(row.stored_balance) - parseFloat(row.calculated_balance)
        }))
      });
    }
    
    // Check 5: Invalid currencies
    console.log('Checking for invalid currencies...');
    const invalidCurrencies = await client.query(`
      SELECT id, currency
      FROM accounts
      WHERE currency NOT IN ('EUR', 'USD')
    `);
    
    if (invalidCurrencies.rows.length > 0) {
      issues.push({
        type: 'INVALID_CURRENCIES',
        severity: 'ERROR',
        message: `Found ${invalidCurrencies.rows.length} accounts with invalid currencies`,
        details: invalidCurrencies.rows
      });
    }
    
    // Check 6: Invalid transaction types
    console.log('Checking for invalid transaction types...');
    const invalidTxTypes = await client.query(`
      SELECT id, type
      FROM transactions
      WHERE type NOT IN ('deposit')
    `);
    
    if (invalidTxTypes.rows.length > 0) {
      issues.push({
        type: 'INVALID_TRANSACTION_TYPES',
        severity: 'ERROR',
        message: `Found ${invalidTxTypes.rows.length} transactions with invalid types`,
        details: invalidTxTypes.rows
      });
    }
    
    // Check 7: Zero or negative transaction amounts
    console.log('Checking for invalid transaction amounts...');
    const invalidAmounts = await client.query(`
      SELECT id, type, amount
      FROM transactions
      WHERE amount <= 0
    `);
    
    if (invalidAmounts.rows.length > 0) {
      issues.push({
        type: 'INVALID_AMOUNTS',
        severity: 'ERROR',
        message: `Found ${invalidAmounts.rows.length} transactions with zero or negative amounts`,
        details: invalidAmounts.rows
      });
    }
    
    // Check 8: Duplicate emails
    console.log('Checking for duplicate emails...');
    const duplicateEmails = await client.query(`
      SELECT email, COUNT(*) as count
      FROM users
      GROUP BY email
      HAVING COUNT(*) > 1
    `);
    
    if (duplicateEmails.rows.length > 0) {
      issues.push({
        type: 'DUPLICATE_EMAILS',
        severity: 'ERROR',
        message: `Found ${duplicateEmails.rows.length} duplicate email addresses`,
        details: duplicateEmails.rows
      });
    }
    
    // Check 9: Users without accounts (Warning, not error)
    console.log('Checking for users without accounts...');
    const usersWithoutAccounts = await client.query(`
      SELECT u.id, u.email
      FROM users u
      LEFT JOIN accounts a ON u.id = a.user_id
      WHERE a.id IS NULL
    `);
    
    if (usersWithoutAccounts.rows.length > 0) {
      issues.push({
        type: 'USERS_WITHOUT_ACCOUNTS',
        severity: 'WARNING',
        message: `Found ${usersWithoutAccounts.rows.length} users without any accounts`,
        details: usersWithoutAccounts.rows
      });
    }
    
    // Check 10: Accounts without transactions but with non-zero balance
    console.log('Checking for accounts with balance but no transactions...');
    const accountsWithBalanceNoTx = await client.query(`
      SELECT a.id, a.currency, a.balance
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      WHERE t.id IS NULL AND a.balance != 0
    `);
    
    if (accountsWithBalanceNoTx.rows.length > 0) {
      issues.push({
        type: 'BALANCE_WITHOUT_TRANSACTIONS',
        severity: 'ERROR',
        message: `Found ${accountsWithBalanceNoTx.rows.length} accounts with balance but no transactions`,
        details: accountsWithBalanceNoTx.rows
      });
    }
    
    // Report results
    console.log('\n' + '='.repeat(60));
    console.log('VERIFICATION RESULTS');
    console.log('='.repeat(60) + '\n');
    
    if (issues.length === 0) {
      console.log('✅ ALL CHECKS PASSED - Database integrity is good!\n');
    } else {
      const errors = issues.filter(i => i.severity === 'ERROR');
      const warnings = issues.filter(i => i.severity === 'WARNING');
      
      console.log(`❌ Found ${errors.length} ERROR(S) and ${warnings.length} WARNING(S)\n`);
      
      if (errors.length > 0) {
        console.log('🚨 ERRORS (must be fixed):');
        errors.forEach((issue, index) => {
          console.log(`\n${index + 1}. ${issue.type}`);
          console.log(`   ${issue.message}`);
          if (issue.details && issue.details.length > 0) {
            console.log('   Details:');
            issue.details.slice(0, 3).forEach((detail: any) => {
              console.log(`   - ${JSON.stringify(detail)}`);
            });
            if (issue.details.length > 3) {
              console.log(`   ... and ${issue.details.length - 3} more`);
            }
          }
        });
        console.log('');
      }
      
      if (warnings.length > 0) {
        console.log('⚠️  WARNINGS (should be reviewed):');
        warnings.forEach((issue, index) => {
          console.log(`\n${index + 1}. ${issue.type}`);
          console.log(`   ${issue.message}`);
          if (issue.details && issue.details.length > 0) {
            console.log('   Details:');
            issue.details.slice(0, 3).forEach((detail: any) => {
              console.log(`   - ${JSON.stringify(detail)}`);
            });
            if (issue.details.length > 3) {
              console.log(`   ... and ${issue.details.length - 3} more`);
            }
          }
        });
        console.log('');
      }
      
      console.log('💡 TIP: Run individual check scripts for more details:');
      console.log('   npm run db:check-accounts');
      console.log('   npm run db:check-transactions -- <account_id>');
      console.log('   npm run db:stats\n');
    }
    
  } catch (error) {
    console.error('❌ Error during integrity verification:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

verifyIntegrity()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
