#!/usr/bin/env node
/**
 * Script to show database statistics
 * Usage: npm run db:stats
 */

import { pool } from '../src/db/pool';

async function showStats() {
  const client = await pool.connect();
  
  try {
    console.log('\n📊 === DATABASE STATISTICS ===\n');
    
    // User statistics
    const userStats = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        MIN(created_at) as first_user,
        MAX(created_at) as latest_user
      FROM users
    `);
    
    console.log('👥 USERS:');
    console.log(`  Total users: ${userStats.rows[0].total_users}`);
    if (userStats.rows[0].total_users > 0) {
      console.log(`  First user created: ${userStats.rows[0].first_user?.toISOString() || 'N/A'}`);
      console.log(`  Latest user created: ${userStats.rows[0].latest_user?.toISOString() || 'N/A'}`);
    }
    console.log('');
    
    // Account statistics
    const accountStats = await client.query(`
      SELECT 
        COUNT(*) as total_accounts,
        SUM(CASE WHEN currency = 'EUR' THEN 1 ELSE 0 END) as eur_accounts,
        SUM(CASE WHEN currency = 'USD' THEN 1 ELSE 0 END) as usd_accounts,
        SUM(CASE WHEN currency = 'EUR' THEN balance ELSE 0 END) as eur_balance,
        SUM(CASE WHEN currency = 'USD' THEN balance ELSE 0 END) as usd_balance,
        AVG(balance) as avg_balance,
        MIN(balance) as min_balance,
        MAX(balance) as max_balance
      FROM accounts
    `);
    
    console.log('💰 ACCOUNTS:');
    console.log(`  Total accounts: ${accountStats.rows[0].total_accounts}`);
    if (accountStats.rows[0].total_accounts > 0) {
      console.log(`  EUR accounts: ${accountStats.rows[0].eur_accounts} (Total: €${parseFloat(accountStats.rows[0].eur_balance).toFixed(2)})`);
      console.log(`  USD accounts: ${accountStats.rows[0].usd_accounts} (Total: $${parseFloat(accountStats.rows[0].usd_balance).toFixed(2)})`);
      console.log(`  Average balance: ${parseFloat(accountStats.rows[0].avg_balance).toFixed(2)}`);
      console.log(`  Min balance: ${parseFloat(accountStats.rows[0].min_balance).toFixed(2)}`);
      console.log(`  Max balance: ${parseFloat(accountStats.rows[0].max_balance).toFixed(2)}`);
    }
    console.log('');
    
    // Transaction statistics
    const txStats = await client.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount,
        COUNT(DISTINCT account_id) as accounts_with_tx
      FROM transactions
    `);
    
    console.log('📜 TRANSACTIONS:');
    console.log(`  Total transactions: ${txStats.rows[0].total_transactions}`);
    if (txStats.rows[0].total_transactions > 0) {
      console.log(`  Total amount: ${parseFloat(txStats.rows[0].total_amount).toFixed(2)}`);
      console.log(`  Average amount: ${parseFloat(txStats.rows[0].avg_amount).toFixed(2)}`);
      console.log(`  Min amount: ${parseFloat(txStats.rows[0].min_amount).toFixed(2)}`);
      console.log(`  Max amount: ${parseFloat(txStats.rows[0].max_amount).toFixed(2)}`);
      console.log(`  Accounts with transactions: ${txStats.rows[0].accounts_with_tx}`);
    }
    console.log('');
    
    // Recent activity
    const recentActivity = await client.query(`
      SELECT 
        'user' as type,
        email as description,
        created_at
      FROM users
      UNION ALL
      SELECT 
        'account' as type,
        currency as description,
        created_at
      FROM accounts
      UNION ALL
      SELECT 
        'transaction' as type,
        type || ': ' || amount as description,
        created_at
      FROM transactions
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (recentActivity.rows.length > 0) {
      console.log('🕐 RECENT ACTIVITY (Last 10):');
      recentActivity.rows.forEach((activity, index) => {
        console.log(`  ${index + 1}. [${activity.type.toUpperCase()}] ${activity.description} - ${activity.created_at.toISOString()}`);
      });
      console.log('');
    }
    
    // Data integrity checks
    console.log('✅ QUICK INTEGRITY CHECK:');
    
    // Check for negative balances
    const negativeBalances = await client.query(
      'SELECT COUNT(*) as count FROM accounts WHERE balance < 0'
    );
    
    if (negativeBalances.rows[0].count > 0) {
      console.log(`  ❌ Found ${negativeBalances.rows[0].count} accounts with negative balance!`);
    } else {
      console.log('  ✅ No negative balances');
    }
    
    // Check for orphaned accounts
    const orphanedAccounts = await client.query(`
      SELECT COUNT(*) as count 
      FROM accounts a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE u.id IS NULL
    `);
    
    if (orphanedAccounts.rows[0].count > 0) {
      console.log(`  ❌ Found ${orphanedAccounts.rows[0].count} orphaned accounts!`);
    } else {
      console.log('  ✅ No orphaned accounts');
    }
    
    // Check for orphaned transactions
    const orphanedTransactions = await client.query(`
      SELECT COUNT(*) as count 
      FROM transactions t 
      LEFT JOIN accounts a ON t.account_id = a.id 
      WHERE a.id IS NULL
    `);
    
    if (orphanedTransactions.rows[0].count > 0) {
      console.log(`  ❌ Found ${orphanedTransactions.rows[0].count} orphaned transactions!`);
    } else {
      console.log('  ✅ No orphaned transactions');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ Error getting statistics:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

showStats()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
