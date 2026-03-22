import express from 'express';
import { prisma } from '../lib/prisma';
import { redis, CACHE_TTL, getDashboardCacheKey } from '../lib/redis';
import { authenticate, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadToCloudinary } from '../lib/cloudinary';
import { createError } from '../middleware/error';
import { stringify } from 'csv-stringify/sync';
import { Category, PaymentMethod } from '@prisma/client';

const router = express.Router();

// Invalidate dashboard cache helper
const invalidateCache = async (userId: string) => {
  const keys = await redis.keys(`*${userId}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// GET /api/expenses
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const {
    page = '1',
    limit = '10',
    month,
    year,
    category,
    payment_method,
    start_date,
    end_date,
    search,
    sort_by = 'expense_date',
    sort_order = 'desc',
  } = req.query as Record<string, string>;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { user_id: userId };

  if (month && year) {
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    where.expense_date = { gte: startOfMonth, lte: endOfMonth };
  } else if (start_date && end_date) {
    where.expense_date = { gte: new Date(start_date), lte: new Date(end_date) };
  }

  if (category) where.category = category as Category;
  if (payment_method) where.payment_method = payment_method as PaymentMethod;

  if (search) {
    where.OR = [
      { description: { contains: search, mode: 'insensitive' } },
      { merchant: { contains: search, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['expense_date', 'amount', 'created_at'];
  const sortField = validSortFields.includes(sort_by) ? sort_by : 'expense_date';
  const sortDir = sort_order === 'asc' ? 'asc' : 'desc';

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { [sortField]: sortDir },
      skip,
      take: limitNum,
    }),
    prisma.expense.count({ where }),
  ]);

  res.json({
    expenses,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
  });
});

// POST /api/expenses
router.post('/', authenticate, upload.single('receipt'), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { amount, category, payment_method, description, merchant, is_recurring, expense_date } = req.body;

  if (!amount || !category || !payment_method || !expense_date) {
    throw createError('Amount, category, payment_method, and expense_date are required', 400);
  }

  let receipt_url: string | undefined;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'smartxpense/receipts');
    receipt_url = result.url;
  }

  const expense = await prisma.expense.create({
    data: {
      user_id: userId,
      amount,
      category: category as Category,
      payment_method: payment_method as PaymentMethod,
      description,
      merchant,
      receipt_url,
      is_recurring: is_recurring === 'true' || is_recurring === true,
      expense_date: new Date(expense_date),
    },
  });

  await invalidateCache(userId);
  res.status(201).json(expense);
});

// PUT /api/expenses/:id
router.put('/:id', authenticate, upload.single('receipt'), async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.expense.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw createError('Expense not found', 404);

  const { amount, category, payment_method, description, merchant, is_recurring, expense_date } = req.body;

  let receipt_url = existing.receipt_url ?? undefined;
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, 'smartxpense/receipts');
    receipt_url = result.url;
  }

  const updated = await prisma.expense.update({
    where: { id },
    data: {
      ...(amount && { amount }),
      ...(category && { category: category as Category }),
      ...(payment_method && { payment_method: payment_method as PaymentMethod }),
      description,
      merchant,
      receipt_url,
      ...(is_recurring !== undefined && { is_recurring: is_recurring === 'true' || is_recurring === true }),
      ...(expense_date && { expense_date: new Date(expense_date) }),
    },
  });

  await invalidateCache(userId);
  res.json(updated);
});

// DELETE /api/expenses/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { id } = req.params;

  const existing = await prisma.expense.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw createError('Expense not found', 404);

  await prisma.expense.delete({ where: { id } });
  await invalidateCache(userId);
  res.json({ message: 'Expense deleted successfully' });
});

// GET /api/expenses/export/csv
router.get('/export/csv', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { month, year, category, payment_method, start_date, end_date } = req.query as Record<string, string>;

  const where: any = { user_id: userId };

  if (month && year) {
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    where.expense_date = { gte: startOfMonth, lte: endOfMonth };
  } else if (start_date && end_date) {
    where.expense_date = { gte: new Date(start_date), lte: new Date(end_date) };
  }

  if (category) where.category = category as Category;
  if (payment_method) where.payment_method = payment_method as PaymentMethod;

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: { expense_date: 'desc' },
  });

  const csvData = expenses.map((e) => ({
    Date: e.expense_date.toISOString().split('T')[0],
    Amount: e.amount.toString(),
    Category: e.category,
    'Payment Method': e.payment_method,
    Description: e.description || '',
    Merchant: e.merchant || '',
    Recurring: e.is_recurring ? 'Yes' : 'No',
  }));

  const csv = stringify(csvData, { header: true });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="smartxpense-expenses-${Date.now()}.csv"`);
  res.send(csv);
});

export default router;
