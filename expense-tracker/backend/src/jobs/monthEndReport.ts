import cron from 'node-cron';
import * as React from 'react';
import * as ReactDOMServer from 'react-dom/server';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma';
import { MonthlyReportEmail } from '../emails/MonthlyReport';
import { stringify } from 'csv-stringify/sync';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const sendMonthlyReport = async (userId?: string) => {
  const now = new Date();
  const targetMonth = now.getMonth(); // 0-indexed = previous month when run on last day
  const targetYear = now.getFullYear();
  const monthName = MONTH_NAMES[targetMonth];

  const users = userId
    ? await prisma.user.findMany({ where: { id: userId } })
    : await prisma.user.findMany();

  for (const user of users) {
    try {
      const startOfMonth = new Date(targetYear, targetMonth, 1);
      const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

      const [expenses, budgets, savings] = await Promise.all([
        prisma.expense.findMany({ where: { user_id: user.id, expense_date: { gte: startOfMonth, lte: endOfMonth } }, orderBy: { expense_date: 'asc' } }),
        prisma.budget.findMany({ where: { user_id: user.id, month: targetMonth + 1, year: targetYear } }),
        prisma.savingsGoal.findMany({ where: { user_id: user.id } }),
      ]);

      if (expenses.length === 0) continue;

      const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // Category breakdown
      const categoryTotals: Record<string, number> = {};
      expenses.forEach((e) => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
      });
      const categoryBreakdown = Object.entries(categoryTotals)
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total);

      // Budget performance
      const budgetPerformance = budgets.map((b) => {
        const spent = categoryTotals[b.category] || 0;
        const limit = Number(b.limit_amount);
        const pct = (spent / limit) * 100;
        return {
          category: b.category,
          limit,
          spent,
          status: (pct >= 100 ? 'over' : pct >= 80 ? 'warning' : 'ok') as 'over' | 'warning' | 'ok',
        };
      });

      // Top merchants
      const merchantTotals: Record<string, number> = {};
      expenses.forEach((e) => {
        if (e.merchant) merchantTotals[e.merchant] = (merchantTotals[e.merchant] || 0) + Number(e.amount);
      });
      const topMerchants = Object.entries(merchantTotals)
        .map(([merchant, total]) => ({ merchant, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      // Savings goals
      const savingsGoals = savings.map((g) => ({
        title: g.title,
        saved: Number(g.saved_amount),
        target: Number(g.target_amount),
        percentage: (Number(g.saved_amount) / Number(g.target_amount)) * 100,
      }));

      // Insight
      const topCategory = categoryBreakdown[0];
      const insight = topCategory
        ? `Your highest spending category was ${topCategory.category} at ${user.currency || 'INR'} ${topCategory.total.toFixed(2)} (${((topCategory.total / totalSpent) * 100).toFixed(0)}% of total spend).`
        : `Great job tracking your expenses this month!`;

      // Generate HTML
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MonthlyReportEmail, {
          userName: user.name,
          month: monthName,
          year: targetYear,
          totalSpent,
          currency: user.currency,
          categoryBreakdown,
          budgetPerformance,
          topMerchants,
          savingsGoals,
          insight,
        })
      );

      // Generate CSV
      const csvData = expenses.map((e) => ({
        Date: e.expense_date.toISOString().split('T')[0],
        Amount: Number(e.amount).toFixed(2),
        Category: e.category,
        'Payment Method': e.payment_method,
        Description: e.description || '',
        Merchant: e.merchant || '',
        Recurring: e.is_recurring ? 'Yes' : 'No',
      }));
      const csv = stringify(csvData, { header: true });

      await transporter.sendMail({
        from: `"SmartXpense" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `SmartXpense: Your ${monthName} ${targetYear} Spending Report`,
        html,
        attachments: [
          {
            filename: `smartxpense-${monthName.toLowerCase()}-${targetYear}.csv`,
            content: csv,
          },
        ],
      });

      console.log(`[Cron] Sent monthly report to ${user.email}`);
    } catch (err) {
      console.error(`[Cron] Failed to send report to ${user.email}:`, err);
    }
  }
};

// Schedule: runs at 11:55 PM on the last day of every month
// node-cron doesn't support "L" (last day), so we check at runtime
export const startMonthEndCron = () => {
  cron.schedule('55 23 28-31 * *', async () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    if (tomorrow.getMonth() !== now.getMonth()) {
      // It's the last day of the month
      console.log('[Cron] Running month-end report job...');
      await sendMonthlyReport();
    }
  });
  console.log('[Cron] Month-end report job scheduled');
};
