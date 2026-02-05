import { pool } from './pool';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  const client = await pool.connect();

  try {
    console.log('🌱 Seeding database...');

    // Check if demo users already exist
    const demoEmails = ['demo@qa.com', 'second-demo@qa.com'];
    const existingUsers = await client.query('SELECT email FROM users WHERE email = ANY($1)', [demoEmails]);

    const existingEmails = existingUsers.rows.map((row: any) => row.email);

    // Hash password
    const passwordHash = await bcrypt.hash('demo123', 10);

    for (const email of demoEmails) {
      if (existingEmails.includes(email)) {
        console.log(`  ↳ User ${email} already exists, skipping`);
        continue;
      }
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash) 
         VALUES ($1, $2) 
         RETURNING id, email`,
        [email, passwordHash]
      );
      const user = userResult.rows[0];
      console.log(`  ✓ Created demo user: ${user.email}`);
      console.log(`    Credentials: ${user.email} / demo123`);
      console.log(`    User ID: ${user.id}\n`);
    }

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
