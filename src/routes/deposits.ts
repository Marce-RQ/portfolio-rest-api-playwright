import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();

router.use(authMiddleware);

// POST /deposits
router.post('/', async (req: AuthRequest, res: Response) => {
  const { accountId, amount, reference } = req.body;
  
  // Validate required fields
  if (!accountId) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'accountId is required',
      },
    });
  }
  
  if (typeof amount !== 'number') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'amount must be a number',
      },
    });
  }
  
  // Validate amount > 0
  if (amount <= 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'amount must be greater than 0',
      },
    });
  }
  
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if account exists and belongs to user
    const accountResult = await client.query(
      'SELECT id, user_id, balance FROM accounts WHERE id = $1',
      [accountId]
    );
    
    if (accountResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found',
        },
      });
    }
    
    const account = accountResult.rows[0];
    
    // Verify account belongs to authenticated user
    if (account.user_id !== req.userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this account',
        },
      });
    }
    
    // Insert transaction
    const transactionResult = await client.query(
      `INSERT INTO transactions (id, account_id, type, amount, reference, created_at)
       VALUES (gen_random_uuid(), $1, 'deposit', $2, $3, NOW())
       RETURNING id`,
      [accountId, amount, reference || null]
    );
    
    const transactionId = transactionResult.rows[0].id;
    
    // Update account balance
    const newBalance = parseFloat(account.balance) + amount;
    await client.query(
      'UPDATE accounts SET balance = $1 WHERE id = $2',
      [newBalance, accountId]
    );
    
    await client.query('COMMIT');
    
    return res.status(201).json({
      transactionId,
      newBalance,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Deposit error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to process deposit',
      },
    });
  } finally {
    client.release();
  }
});

export default router;
