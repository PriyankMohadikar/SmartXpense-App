import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/error';
import { Category } from '@prisma/client';

const router = express.Router();

// GET /api/budgets
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { month, year } = req.query as Record<string, string>;

  const now = new Date();
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1;
  const targetYear = year ? parseInt(year) : now.getFullYear();

  const budgets = await prisma.budget.findMany({
    where: { user_id: userId, month: targetMonth, year: targetYear },
  });

  // Get actual spending for each budget category this month
  const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

  const expenses = await prisma.expense.findMany({
    where: {
      user_id: userId,
      expense_date: { gte: startOfMonth, lte: endOfMonth },
      category: { in: budgets.map((b) => b.category) },
    },
    select: { category: true, amount: true },
  });

  const spentByCategory: Record<string, number> = {};
  expenses.forEach((e) => {
    spentByCategory[e.category] = (spentByCategory[e.category] || 0) + Number(e.amount);
  });

  const budgetsWithSpent = budgets.map((b) => ({
    ...b,
    spent: spentByCategory[b.category] || 0,
    limit_amount: Number(b.limit_amount),
    percentage: ((spentByCategory[b.category] || 0) / Number(b.limit_amount)) * 100,
  }));

  res.json(budgetsWithSpent);
});

// POST /api/budgets
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { category, limit_amount, month, year } = req.body;

  if (!category || !limit_amount || !month || !year) {
    throw createError('category, limit_amount, month, and year are required', 400);
  }

  const budget = await prisma.budget.upsert({
    where: { user_id_category_month_year: { user_id: userId, category: category as Category, month: parseInt(month), year: parseInt(year) } },
    create: { user_id: userId, category: category as Category, limit_amount, month: parseInt(month), year: parseInt(year) },
    update: { limit_amount },
  });

  res.status(201).json(budget);
});

// PUT /api/budgets/:id
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { limit_amount } = req.body;

  const existing = await prisma.budget.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw createError('Budget not found', 404);

  const budget = await prisma.budget.update({ where: { id }, data: { limit_amount } });
  res.json(budget);
});

// DELETE /api/budgets/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.budget.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw createError('Budget not found', 404);

  await prisma.budget.delete({ where: { id } });
  res.json({ message: 'Budget deleted successfully' });
});

export default router;
