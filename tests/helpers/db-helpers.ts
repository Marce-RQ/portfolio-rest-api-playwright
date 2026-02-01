/**
 * Database validation helpers for use in Playwright tests
 * 
 * These functions allow you to validate database state directly in your tests.
 * 
 * Example usage in a test:
 * 
 * import { dbHelpers } from './helpers/db-helpers';
 * 
 * test('deposit creates transaction in DB', async ({ request }) => {
 *   const token = await getAuthToken(request);
 *   const accountId = await createAccount(request, token);
 *   
 *   // Make deposit via API
 *   await request.post('/deposits', {
 *     headers: { Authorization: `Bearer ${token}` },
 *     data: { accountId, amount: 100 }
 *   });
 *   
 *   // Validate in database
 *   const account = await dbHelpers.getAccountById(accountId);
 *   expect(account.balance).toBe('100.00');
 *   
 *   const transactions = await dbHelpers.getTransactionsByAccount(accountId);
 *   expect(transactions).toHaveLength(1);
 *   expect(transactions[0].amount).toBe('100.00');
 * });
 */

import { pool } from '../../src/db/pool';

export const dbHelpers = {
  /**
   * Get a user by email
   */
  async getUserByEmail(email: string) {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  },

  /**
   * Get a user by ID
   */
  async getUserById(userId: string) {
    const result = await pool.query(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get all accounts for a user
   */
  async getAccountsByUserId(userId: string) {
    const result = await pool.query(
      'SELECT id, user_id, currency, balance, created_at FROM accounts WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );
    return result.rows;
  },

  /**
   * Get an account by ID
   */
  async getAccountById(accountId: string) {
    const result = await pool.query(
      'SELECT id, user_id, currency, balance, created_at FROM accounts WHERE id = $1',
      [accountId]
    );
    return result.rows[0] || null;
  },

  /**
   * Get all transactions for an account
   */
  async getTransactionsByAccount(accountId: string) {
    const result = await pool.query(
      'SELECT id, account_id, type, amount, reference, created_at FROM transactions WHERE account_id = $1 ORDER BY created_at',
      [accountId]
    );
    return result.rows;
  },

  /**
   * Get a transaction by ID
   */
  async getTransactionById(transactionId: string) {
    const result = await pool.query(
      'SELECT id, account_id, type, amount, reference, created_at FROM transactions WHERE id = $1',
      [transactionId]
    );
    return result.rows[0] || null;
  },

  /**
   * Count total users
   */
  async countUsers(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*)::int as count FROM users');
    return result.rows[0].count;
  },

  /**
   * Count total accounts
   */
  async countAccounts(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*)::int as count FROM accounts');
    return result.rows[0].count;
  },

  /**
   * Count total transactions
   */
  async countTransactions(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*)::int as count FROM transactions');
    return result.rows[0].count;
  },

  /**
   * Verify account balance matches transaction sum
   */
  async verifyAccountBalance(accountId: string): Promise<{
    isValid: boolean;
    storedBalance: string;
    calculatedBalance: string;
    difference: number;
  }> {
    const result = await pool.query(`
      SELECT 
        a.balance as stored_balance,
        COALESCE(SUM(t.amount), 0) as calculated_balance
      FROM accounts a
      LEFT JOIN transactions t ON a.id = t.account_id
      WHERE a.id = $1
      GROUP BY a.balance
    `, [accountId]);

    if (result.rows.length === 0) {
      throw new Error(`Account not found: ${accountId}`);
    }

    const stored = parseFloat(result.rows[0].stored_balance);
    const calculated = parseFloat(result.rows[0].calculated_balance);
    const difference = stored - calculated;

    return {
      isValid: difference === 0,
      storedBalance: result.rows[0].stored_balance,
      calculatedBalance: result.rows[0].calculated_balance,
      difference
    };
  },

  /**
   * Check if an account has any negative balance
   */
  async hasNegativeBalance(accountId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT balance FROM accounts WHERE id = $1',
      [accountId]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Account not found: ${accountId}`);
    }
    
    return parseFloat(result.rows[0].balance) < 0;
  },

  /**
   * Get the most recent transaction for an account
   */
  async getLatestTransaction(accountId: string) {
    const result = await pool.query(
      `SELECT id, account_id, type, amount, reference, created_at 
       FROM transactions 
       WHERE account_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [accountId]
    );
    return result.rows[0] || null;
  },

  /**
   * Check if a user exists by email
   */
  async userExists(email: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE email = $1',
      [email]
    );
    return result.rows.length > 0;
  },

  /**
   * Check if an account exists by ID
   */
  async accountExists(accountId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM accounts WHERE id = $1',
      [accountId]
    );
    return result.rows.length > 0;
  },

  /**
   * Get total balance for a user across all accounts
   */
  async getTotalBalanceForUser(userId: string): Promise<{ EUR: string; USD: string }> {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN currency = 'EUR' THEN balance ELSE 0 END), 0) as eur_balance,
        COALESCE(SUM(CASE WHEN currency = 'USD' THEN balance ELSE 0 END), 0) as usd_balance
      FROM accounts
      WHERE user_id = $1
    `, [userId]);

    return {
      EUR: result.rows[0].eur_balance,
      USD: result.rows[0].usd_balance
    };
  },

  /**
   * Verify password is properly hashed (not stored in plain text)
   */
  async isPasswordHashed(email: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`User not found: ${email}`);
    }
    
    const hash = result.rows[0].password_hash;
    // bcrypt hashes start with $2a$, $2b$, or $2y$
    return hash.startsWith('$2');
  }
};

/**
 * Helper to clean up test data
 * Use this in test cleanup to remove data created during tests
 */
export const dbCleanup = {
  /**
   * Delete a user and all related data (cascades to accounts and transactions)
   */
  async deleteUser(userId: string) {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
  },

  /**
   * Delete an account and all related transactions
   */
  async deleteAccount(accountId: string) {
    await pool.query('DELETE FROM accounts WHERE id = $1', [accountId]);
  },

  /**
   * Delete all transactions for an account
   */
  async deleteTransactions(accountId: string) {
    await pool.query('DELETE FROM transactions WHERE account_id = $1', [accountId]);
  },

  /**
   * Delete all data from all tables (use with caution!)
   */
  async deleteAllData() {
    await pool.query('TRUNCATE users, accounts, transactions CASCADE');
  }
};
