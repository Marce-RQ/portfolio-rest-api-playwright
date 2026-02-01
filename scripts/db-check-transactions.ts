#!/usr/bin/env node
/**
 * Script to check transactions for an account
 * Usage: npm run db:check-transactions -- <account_id>
 * Example: npm run db:check-transactions -- 123e4567-e89b-12d3-a456-426614174000
 */

import { pool } from '../src/db/pool';

async function checkTransactions(accountId: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n📜 === TRANSACTIONS FOR ACCOUNT: ${accountId} ===\n`);
    
    // First, verify account exists
    const accountResult = await client.query(
      'SELECT currency, balance FROM accounts WHERE id = $1',
      [accountId]
    );
    
    if (accountResult.rows.length === 0) {
      console.log(`❌ Account not found: ${accountId}`);
      console.log('💡 Tip: Run "npm run db:check-accounts" to see all accounts\n');
      return;
    }
    
    const account = accountResult.rows[0];
    console.log(`Account: ${accountId}`);
    console.log(`Currency: ${account.currency}`);
    console.log(`Current Balance: ${account.balance}\n`);
    
    // Get all transactions
    const transactionsResult = await client.query(`
      SELECT 
        id,
        type,
        amount,
        reference,
        created_at
      FROM transactions
      WHERE account_id = $1
      ORDER BY created_at ASC
    `, [accountId]);
    
    if (transactionsResult.rows.length === 0) {
      console.log('❌ No transactions found for this account\n');
      
      if (parseFloat(account.balance) === 0) {
        console.log('✅ Balance is 0, consistent with no transactions\n');
      } else {
        console.log(`⚠️  WARNING: Balance is ${account.balance} but no transactions exist!`);
        console.log('This indicates a data problem.\n');
      }
      return;
    }
    
    console.log('📋 TRANSACTION HISTORY:');
    console.log('');
    
    let runningBalance = 0;
    transactionsResult.rows.forEach((tx, index) => {
      runningBalance += parseFloat(tx.amount);
      
      console.log(`[${index + 1}] ${tx.created_at.toISOString()}`);
      console.log(`    ID: ${tx.id}`);
      console.log(`    Type: ${tx.type}`);
      console.log(`    Amount: ${tx.amount}`);
      console.log(`    Reference: ${tx.reference || '(none)'}`);
      console.log(`    Running Balance: ${runningBalance}`);
      console.log('');
    });
    
    // Summary
    console.log('📊 SUMMARY:');
    console.log(`  Total transactions: ${transactionsResult.rows.length}`);
    
    const deposits = transactionsResult.rows.filter(tx => tx.type === 'deposit');
    const totalDeposits = deposits.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
    console.log(`  Deposits: ${deposits.length} (Total: ${totalDeposits})`);
    
    console.log(`  Sum of all transactions: ${runningBalance}`);
    console.log(`  Current account balance: ${account.balance}`);
    
    // Validation
    console.log('\n🔍 VALIDATION:');
    if (parseFloat(account.balance) === runningBalance) {
      console.log('  ✅ Balance matches transaction sum - DATA IS CONSISTENT\n');
    } else {
      console.log('  ❌ ERROR: Balance mismatch - DATA INCONSISTENCY DETECTED');
      console.log(`  Expected balance: ${runningBalance}`);
      console.log(`  Actual balance: ${account.balance}`);
      console.log(`  Difference: ${parseFloat(account.balance) - runningBalance}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error checking transactions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get account ID from command line arguments
const accountId = process.argv[2];

if (!accountId) {
  console.error('\n❌ Error: Account ID argument required');
  console.log('Usage: npm run db:check-transactions -- <account_id>');
  console.log('Example: npm run db:check-transactions -- 123e4567-e89b-12d3-a456-426614174000\n');
  process.exit(1);
}

checkTransactions(accountId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
