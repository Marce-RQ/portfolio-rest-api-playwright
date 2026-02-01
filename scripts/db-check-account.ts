#!/usr/bin/env node
/**
 * Script to check a specific account with its transactions
 * Usage: npm run db:check-account -- <account_id>
 * Example: npm run db:check-account -- 123e4567-e89b-12d3-a456-426614174000
 */

import { pool } from '../src/db/pool';

async function checkAccount(accountId: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 === CHECKING ACCOUNT: ${accountId} ===\n`);
    
    // Get account details
    const accountResult = await client.query(`
      SELECT 
        a.id,
        a.currency,
        a.balance,
        a.created_at,
        u.email as owner_email,
        u.id as owner_id
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `, [accountId]);
    
    if (accountResult.rows.length === 0) {
      console.log(`❌ Account not found: ${accountId}`);
      console.log('💡 Tip: Run "npm run db:check-accounts" to see all accounts\n');
      return;
    }
    
    const account = accountResult.rows[0];
    
    console.log('💰 ACCOUNT DETAILS:');
    console.log(`  ID: ${account.id}`);
    console.log(`  Currency: ${account.currency}`);
    console.log(`  Balance: ${account.balance}`);
    console.log(`  Owner: ${account.owner_email}`);
    console.log(`  Owner ID: ${account.owner_id}`);
    console.log(`  Created: ${account.created_at.toISOString()}\n`);
    
    // Get transactions
    const transactionsResult = await client.query(`
      SELECT 
        id,
        type,
        amount,
        reference,
        created_at
      FROM transactions
      WHERE account_id = $1
      ORDER BY created_at DESC
    `, [accountId]);
    
    console.log('📜 TRANSACTIONS:');
    if (transactionsResult.rows.length === 0) {
      console.log('  No transactions found for this account');
      
      if (parseFloat(account.balance) !== 0) {
        console.log(`  ⚠️  WARNING: Balance is ${account.balance} but no transactions exist!`);
        console.log('  This indicates a data inconsistency.\n');
      } else {
        console.log('  ✅ Balance is 0, which is correct for no transactions.\n');
      }
    } else {
      transactionsResult.rows.forEach((tx, index) => {
        console.log(`  Transaction #${index + 1}:`);
        console.log(`    ID: ${tx.id}`);
        console.log(`    Type: ${tx.type}`);
        console.log(`    Amount: ${tx.amount}`);
        console.log(`    Reference: ${tx.reference || '(none)'}`);
        console.log(`    Created: ${tx.created_at.toISOString()}`);
        console.log('');
      });
      
      // Verify balance matches transactions
      const calculatedBalance = transactionsResult.rows.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);
      const actualBalance = parseFloat(account.balance);
      
      console.log('🔍 VALIDATION:');
      console.log(`  Transactions count: ${transactionsResult.rows.length}`);
      console.log(`  Sum of transactions: ${calculatedBalance}`);
      console.log(`  Current balance: ${actualBalance}`);
      
      if (calculatedBalance === actualBalance) {
        console.log(`  ✅ Balance matches transaction sum\n`);
      } else {
        console.log(`  ❌ ERROR: Balance mismatch!`);
        console.log(`  Expected: ${calculatedBalance}`);
        console.log(`  Actual: ${actualBalance}`);
        console.log(`  Difference: ${actualBalance - calculatedBalance}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking account:', error);
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
  console.log('Usage: npm run db:check-account -- <account_id>');
  console.log('Example: npm run db:check-account -- 123e4567-e89b-12d3-a456-426614174000\n');
  process.exit(1);
}

checkAccount(accountId)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
