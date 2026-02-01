import express, { Request, Response, NextFunction } from 'express';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import accountsRouter from './routes/accounts';
import depositsRouter from './routes/deposits';
import transactionsRouter from './routes/transactions';
import { authMiddleware, AuthRequest } from './middleware/auth';
import { pool } from './db/pool';

const app = express();

// Middleware
app.use(express.json());

// Request logging (dev)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/accounts', accountsRouter);
app.use('/deposits', depositsRouter);
app.use('/transactions', transactionsRouter);

// /me endpoint (protected, at root level per PRD)
app.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, email FROM users WHERE id = $1',
      [req.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
      });
    }
    
    const user = result.rows[0];
    return res.status(200).json({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
});

export default app;
