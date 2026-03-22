import express from 'express';
import { prisma } from '../lib/prisma';
import { redis, CACHE_TTL, getDashboardCacheKey, getAnalyticsCacheKey } from '../lib/redis';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const cacheKey = getDashboardCacheKey(userId);

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(cached);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [thisMonthExpenses, lastMonthExpenses, allExpenses, user, savings] = await Promise.all([
    prisma.expense.findMany({
      where: { user_id: userId, expense_date: { gte: startOfMonth, lte: endOfMonth } },
    }),
    prisma.expense.findMany({
      where: { user_id: userId, expense_date: { gte: lastMonthStart, lte: lastMonthEnd } },
    }),
    prisma.expense.aggregate({ where: { user_id: userId }, _sum: { amount: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { monthly_income: true, currency: true } }),
    prisma.savingsGoal.findMany({ where: { user_id: userId } }),
  ]);

  const thisMonthTotal = thisMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const lastMonthTotal = lastMonthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Category breakdown this month
  const categoryTotals: Record<string, number> = {};
  thisMonthExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });
  const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  const monthlyIncome = Number(user?.monthly_income || 0);
  const savingsRate = monthlyIncome > 0
    ? Math.max(0, ((monthlyIncome - thisMonthTotal) / monthlyIncome) * 100)
    : 0;

  // Smart insights
  const insights: string[] = [];
  if (lastMonthTotal > 0 && thisMonthTotal > lastMonthTotal) {
    const pct = (((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100).toFixed(1);
    insights.push(`You've spent ${pct}% more this month compared to last month.`);
  }

  // Category-level insight
  const lastMonthCategoryTotals: Record<string, number> = {};
  lastMonthExpenses.forEach((e) => {
    lastMonthCategoryTotals[e.category] = (lastMonthCategoryTotals[e.category] || 0) + Number(e.amount);
  });

  let maxIncreaseCat = '';
  let maxIncreasePct = 0;
  for (const [cat, thisAmt] of Object.entries(categoryTotals)) {
    const lastAmt = lastMonthCategoryTotals[cat] || 0;
    if (lastAmt > 0) {
      const pct = ((thisAmt - lastAmt) / lastAmt) * 100;
      if (pct > maxIncreasePct) { maxIncreasePct = pct; maxIncreaseCat = cat; }
    }
  }
  if (maxIncreaseCat) {
    insights.push(`You spent ${maxIncreasePct.toFixed(0)}% more on ${maxIncreaseCat} vs last month.`);
  }

  const totalSavingsTarget = savings.reduce((sum, g) => sum + Number(g.target_amount), 0);
  const totalSaved = savings.reduce((sum, g) => sum + Number(g.saved_amount), 0);

  const summary = {
    totalSpent: Number(allExpenses._sum.amount || 0),
    thisMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    topCategory,
    savingsRate: parseFloat(savingsRate.toFixed(1)),
    categoryBreakdown: categoryTotals,
    insights,
    savingsGoalsSummary: { totalTarget: totalSavingsTarget, totalSaved },
    currency: user?.currency || 'INR',
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(summary));
  res.json(summary);
});

// GET /api/analytics/monthly - Last 12 months
router.get('/monthly', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const cacheKey = getAnalyticsCacheKey(userId, 'monthly');

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(cached);

  const now = new Date();
  const results = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const agg = await prisma.expense.aggregate({
      where: { user_id: userId, expense_date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: true,
    });

    results.push({
      month: start.toLocaleString('default', { month: 'short' }),
      year: start.getFullYear(),
      total: Number(agg._sum.amount || 0),
      count: agg._count,
    });
  }

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
  res.json(results);
});

// GET /api/analytics/categories
router.get('/categories', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { month, year } = req.query as Record<string, string>;
  const cacheKey = getAnalyticsCacheKey(userId, `categories-${month}-${year}`);

  const cached = await redis.get(cacheKey);
  if (cached) return res.json(cached);

  const where: any = { user_id: userId };
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    where.expense_date = { gte: start, lte: end };
  }

  const expenses = await prisma.expense.findMany({ where });
  const categoryTotals: Record<string, number> = {};
  expenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
  });

  const data = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data));
  res.json(data);
});

// GET /api/analytics/merchants
router.get('/merchants', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { limit = '10', month, year } = req.query as Record<string, string>;

  const where: any = { user_id: userId, merchant: { not: null } };
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    where.expense_date = { gte: start, lte: end };
  }

  const expenses = await prisma.expense.findMany({ where, select: { merchant: true, amount: true } });
  const merchantTotals: Record<string, { total: number; count: number }> = {};

  expenses.forEach((e) => {
    if (e.merchant) {
      if (!merchantTotals[e.merchant]) merchantTotals[e.merchant] = { total: 0, count: 0 };
      merchantTotals[e.merchant].total += Number(e.amount);
      merchantTotals[e.merchant].count += 1;
    }
  });

  const data = Object.entries(merchantTotals)
    .map(([merchant, stats]) => ({ merchant, ...stats }))
    .sort((a, b) => b.total - a.total)
    .slice(0, parseInt(limit));

  res.json(data);
});

// GET /api/analytics/dayofweek
router.get('/dayofweek', authenticate, async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const { month, year } = req.query as Record<string, string>;

  const where: any = { user_id: userId };
  if (month && year) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
    where.expense_date = { gte: start, lte: end };
  }

  const expenses = await prisma.expense.findMany({ where, select: { expense_date: true, amount: true } });
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayTotals = days.map((day) => ({ day, total: 0, count: 0 }));

  expenses.forEach((e) => {
    const dayIndex = new Date(e.expense_date).getDay();
    dayTotals[dayIndex].total += Number(e.amount);
    dayTotals[dayIndex].count += 1;
  });

  res.json(dayTotals);
});

export default router;
