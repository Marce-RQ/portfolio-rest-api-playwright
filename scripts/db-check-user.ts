#!/usr/bin/env node
/**
 * Script to check a specific user and their accounts
 * Usage: npm run db:check-user -- <email>
 * Example: npm run db:check-user -- demo@qa.com
 */

import { pool } from '../src/db/pool';

async function checkUser(email: string) {
  const client = await pool.connect();
  
  try {
    console.log(`\n🔍 === CHECKING USER: ${email} ===\n`);
    
    // Get user details
    const userResult = await client.query(
      'SELECT id, email, created_at, password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log(`❌ User not found: ${email}`);
      console.log('💡 Tip: Check the email spelling or run "npm run db:check-users" to see all users\n');
      return;
    }
    
    const user = userResult.rows[0];
    
    console.log('👤 USER DETAILS:');
    console.log(`  ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Created: ${user.created_at.toISOString()}`);
    console.log(`  Password Hash: ${user.password_hash.substring(0, 30)}...`);
    console.log(`  ✅ Password is hashed (${user.password_hash.length} characters)\n`);
    
    // Get user's accounts
    const accountsResult = await client.query(`
      SELECT 
        id,
        currency,
        balance,
        created_at
      FROM accounts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);
    
    console.log('💰 ACCOUNTS:');
    if (accountsResult.rows.length === 0) {
      console.log('  No accounts found for this user\n');
    } else {
      accountsResult.rows.forEach((account, index) => {
        console.log(`  Account #${index + 1}:`);
        console.log(`    ID: ${account.id}`);
        console.log(`    Currency: ${account.currency}`);
        console.log(`    Balance: ${account.balance}`);
        console.log(`    Created: ${account.created_at.toISOString()}`);
        console.log('');
      });
      
      const totalBalance = accountsResult.rows.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
      console.log(`  📊 Total accounts: ${accountsResult.rows.length}`);
      console.log(`  📊 Total balance: ${totalBalance}\n`);
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('\n❌ Error: Email argument required');
  console.log('Usage: npm run db:check-user -- <email>');
  console.log('Example: npm run db:check-user -- demo@qa.com\n');
  process.exit(1);
}

checkUser(email)
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
