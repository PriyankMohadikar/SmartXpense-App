import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/error';

const router = express.Router();

// GET /api/savings
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const goals = await prisma.savingsGoal.findMany({
    where: { user_id: userId },
    orderBy: { target_date: 'asc' },
  });

  const goalsWithProgress = goals.map((g) => ({
    ...g,
    target_amount: Number(g.target_amount),
    saved_amount: Number(g.saved_amount),
    percentage: (Number(g.saved_amount) / Number(g.target_amount)) * 100,
    remaining: Number(g.target_amount) - Number(g.saved_amount),
  }));

  res.json(goalsWithProgress);
});

// POST /api/savings
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { title, target_amount, target_date, saved_amount } = req.body;

  if (!title || !target_amount || !target_date) {
    throw createError('title, target_amount, and target_date are required', 400);
  }

  const goal = await prisma.savingsGoal.create({
    data: {
      user_id: userId,
      title,
      target_amount,
      saved_amount: saved_amount || 0,
      target_date: new Date(target_date),
    },
  });

  res.status(201).json(goal);
});

// PUT /api/savings/:id
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.savingsGoal.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw createError('Savings goal not found', 404);

  const { title, target_amount, target_date, saved_amount } = req.body;

  const goal = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(target_amount !== undefined && { target_amount }),
      ...(target_date && { target_date: new Date(target_date) }),
      ...(saved_amount !== undefined && { saved_amount }),
    },
  });

  res.json(goal);
});

// DELETE /api/savings/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.savingsGoal.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw createError('Savings goal not found', 404);

  await prisma.savingsGoal.delete({ where: { id } });
  res.json({ message: 'Savings goal deleted successfully' });
});

export default router;
