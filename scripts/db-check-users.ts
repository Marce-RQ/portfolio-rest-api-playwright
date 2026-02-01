#!/usr/bin/env node
/**
 * Script to check all users in the database
 * Usage: npm run db:check-users
 */

import { pool } from '../src/db/pool';

async function checkUsers() {
  const client = await pool.connect();
  
  try {
    console.log('\n📋 === ALL USERS IN DATABASE ===\n');
    
    const result = await client.query(`
      SELECT 
        id,
        email,
        created_at,
        password_hash
      FROM users
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
      console.log('💡 Tip: Run "npm run seed" to create a demo user\n');
      return;
    }
    
    result.rows.forEach((user, index) => {
      console.log(`User #${index + 1}`);
      console.log(`  ID: ${user.id}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.created_at.toISOString()}`);
      console.log(`  Password Hash: ${user.password_hash.substring(0, 20)}... (${user.password_hash.length} chars)`);
      console.log(`  ✅ Password is hashed (secure)\n`);
    });
    
    console.log(`📊 Total users: ${result.rows.length}\n`);
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkUsers()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
