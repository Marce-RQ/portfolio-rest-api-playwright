import { Router, Response } from 'express';
import { pool } from '../db/pool';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// All account routes require authentication
router.use(authMiddleware);

// POST /accounts
router.post('/', async (req: AuthRequest, res: Response) => {
  const { currency } = req.body;
  
  // Validation
  if (!currency) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Currency is required',
      },
    });
  }
  
  if (!['EUR', 'USD'].includes(currency)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Currency must be EUR or USD',
      },
    });
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO accounts (user_id, currency, balance) 
       VALUES ($1, $2, 0) 
       RETURNING id, currency, balance`,
      [req.userId, currency]
    );
    
    const account = result.rows[0];
    
    return res.status(201).json({
      id: account.id,
      currency: account.currency,
      balance: parseFloat(account.balance).toFixed(2),
    });
  } catch (error) {
    console.error('Create account error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

// GET /accounts/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT id, currency, balance FROM accounts WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Account not found',
        },
      });
    }
    
    const account = result.rows[0];
    
    return res.status(200).json({
      id: account.id,
      currency: account.currency,
      balance: parseFloat(account.balance).toFixed(2),
    });
  } catch (error) {
    console.error('Get account error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

export default router;
