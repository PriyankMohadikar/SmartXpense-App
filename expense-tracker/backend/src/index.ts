import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth';
import expenseRoutes from './routes/expenses';
import analyticsRoutes from './routes/analytics';
import budgetRoutes from './routes/budgets';
import savingsRoutes from './routes/savings';
import userRoutes from './routes/user';
import emailRoutes from './routes/email';
import { errorHandler } from './middleware/error';
import { startMonthEndCron } from './jobs/monthEndReport';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/user', userRoutes);
app.use('/api/email', emailRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 SmartXpense API running on http://localhost:${PORT}`);
  startMonthEndCron();
});

export default app;
