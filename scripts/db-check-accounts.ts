#!/usr/bin/env node
/**
 * Script to check all accounts in the database
 * Usage: npm run db:check-accounts
 */

import { pool } from '../src/db/pool';

async function checkAccounts() {
  const client = await pool.connect();
  
  try {
    console.log('\n💰 === ALL ACCOUNTS IN DATABASE ===\n');
    
    const result = await client.query(`
      SELECT 
        a.id,
        a.currency,
        a.balance,
        a.created_at,
        u.email as owner_email,
        u.id as owner_id
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No accounts found in database');
      console.log('💡 Tip: Create an account via the API first\n');
      return;
    }
    
    result.rows.forEach((account, index) => {
      console.log(`Account #${index + 1}`);
      console.log(`  ID: ${account.id}`);
      console.log(`  Currency: ${account.currency}`);
      console.log(`  Balance: ${account.balance}`);
      console.log(`  Owner: ${account.owner_email} (${account.owner_id})`);
      console.log(`  Created: ${account.created_at.toISOString()}`);
      console.log('');
    });
    
    // Calculate statistics
    const totalEUR = result.rows
      .filter(a => a.currency === 'EUR')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);
    
    const totalUSD = result.rows
      .filter(a => a.currency === 'USD')
      .reduce((sum, a) => sum + parseFloat(a.balance), 0);
    
    console.log('📊 STATISTICS:');
    console.log(`  Total accounts: ${result.rows.length}`);
    console.log(`  EUR accounts: ${result.rows.filter(a => a.currency === 'EUR').length} (Total: €${totalEUR})`);
    console.log(`  USD accounts: ${result.rows.filter(a => a.currency === 'USD').length} (Total: $${totalUSD})`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error checking accounts:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkAccounts()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
