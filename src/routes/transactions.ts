import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { pool } from '../db/pool';

const router = Router();

router.use(authMiddleware);

// GET /transactions?accountId=&page=&limit=
router.get('/', async (req: AuthRequest, res: Response) => {
  const { accountId, page = '1', limit = '20' } = req.query;
  
  // Validate accountId is required
  if (!accountId || typeof accountId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'accountId is required',
      },
    });
  }
  
  // Parse and validate page
  const pageNum = parseInt(page as string, 10);
  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'page must be a positive integer',
      },
    });
  }
  
  // Parse and validate limit
  const limitNum = parseInt(limit as string, 10);
  if (isNaN(limitNum) || limitNum < 1) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'limit must be a positive integer',
      },
    });
  }
  
  if (limitNum > 100) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'limit cannot exceed 100',
      },
    });
  }
  
  try {
    // Check if account exists and belongs to user
    const accountResult = await pool.query(
      'SELECT id, user_id FROM accounts WHERE id = $1',
      [accountId]
    );
    
    if (accountResult.rows.length === 0) {
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
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have access to this account',
        },
      });
    }
    
    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM transactions WHERE account_id = $1',
      [accountId]
    );
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Calculate offset
    const offset = (pageNum - 1) * limitNum;
    
    // Get transactions with pagination
    const transactionsResult = await pool.query(
      `SELECT id, account_id, type, amount, reference, created_at
       FROM transactions
       WHERE account_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [accountId, limitNum, offset]
    );
    
    return res.status(200).json({
      items: transactionsResult.rows,
      page: pageNum,
      limit: limitNum,
      total,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve transactions',
      },
    });
  }
});

export default router;
