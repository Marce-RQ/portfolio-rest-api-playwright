import { pool } from './pool';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database...');
    
    // Check if demo user already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['demo@qa.com']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('  ↳ Demo user already exists, skipping seed');
      return;
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash('demo123', 10);
    
    // Insert demo user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash) 
       VALUES ($1, $2) 
       RETURNING id, email`,
      ['demo@qa.com', passwordHash]
    );
    
    const user = userResult.rows[0];
    console.log(`  ✓ Created demo user: ${user.email}`);
    console.log(`    Credentials: demo@qa.com / demo123`);
    console.log(`    User ID: ${user.id}\n`);
    
    console.log('✅ Database seeded successfully\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };
