'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, Lightbulb, Receipt, BarChart3, PiggyBank, ArrowRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#6366f1', Transport: '#10b981', Shopping: '#f59e0b',
  Bills: '#ef4444', Health: '#14b8a6', Entertainment: '#a855f7', Other: '#64748b',
};

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

// Animated number counter
function AnimatedNumber({ value, prefix = '' }: { value: number; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setDisplayValue(value); clearInterval(timer); }
      else setDisplayValue(Math.round(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{prefix}{displayValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>;
}

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardVariants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [summaryRes, monthlyRes, budgetsRes, expensesRes] = await Promise.all([
          api.get('/api/analytics/summary'),
          api.get('/api/analytics/monthly'),
          api.get('/api/budgets'),
          api.get('/api/expenses?page=1&limit=5&sort_by=expense_date&sort_order=desc'),
        ]);
        setSummary(summaryRes.data);
        setMonthly(monthlyRes.data.slice(-6));
        setBudgets(budgetsRes.data);
        setRecentExpenses(expensesRes.data.expenses);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (isLoading || loading) {
    return (
      <div className="page-container">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
          </div>
          <div className="grid lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';
  const categoryData = summary?.categoryBreakdown
    ? Object.entries(summary.categoryBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stat Cards */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Spent', value: summary?.totalSpent || 0, icon: DollarSign, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'This Month', value: summary?.thisMonth || 0, icon: summary?.thisMonth > summary?.lastMonth ? TrendingUp : TrendingDown, color: summary?.thisMonth > summary?.lastMonth ? 'text-red-500' : 'text-emerald-500', bg: summary?.thisMonth > summary?.lastMonth ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20' },
          { label: 'Top Category', value: null, icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', text: summary?.topCategory || 'N/A' },
          { label: 'Savings Rate', value: null, icon: PiggyBank, color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20', text: `${summary?.savingsRate || 0}%` },
        ].map(({ label, value, icon: Icon, color, bg, text }) => (
          <motion.div key={label} variants={cardVariants} className="stat-card hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
              <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={color} size={16} />
              </div>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">
              {value !== null ? <AnimatedNumber value={value} prefix={currencySymbol} /> : text}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Donut Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-base">Spending by Category</h2>
            <Link href="/analytics" className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
                  animationBegin={0} animationDuration={800}>
                  {categoryData.map((entry: any) => (
                    <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(2)}`, '']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No expenses this month</div>
          )}
          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryData.map((entry: any) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name] || '#64748b' }} />
                <span className="text-xs text-slate-600 dark:text-slate-400">{entry.name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Monthly Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-base">Monthly Trend</h2>
            <span className="text-xs text-slate-400">Last 6 months</span>
          </div>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthly} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(0)}`, 'Spent']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No data available</div>
          )}
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Expenses */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card p-5 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-base">Recent Expenses</h2>
            <Link href="/expenses" className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">All <ArrowRight size={12} /></Link>
          </div>
          {recentExpenses.length > 0 ? (
            <div className="space-y-3">
              {recentExpenses.map((e: any) => (
                <div key={e.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${CATEGORY_COLORS[e.category]}20` }}>
                    <Receipt size={14} style={{ color: CATEGORY_COLORS[e.category] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{e.description || e.category}</p>
                    <p className="text-xs text-slate-400">{format(new Date(e.expense_date), 'MMM d')} · {e.category}</p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white shrink-0">{currencySymbol}{Number(e.amount).toFixed(0)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 text-sm">No expenses yet</div>
          )}
        </motion.div>

        {/* Budget Progress */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title text-base">Budget Progress</h2>
            <Link href="/budgets" className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">Edit <ArrowRight size={12} /></Link>
          </div>
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.slice(0, 5).map((b: any) => {
                const pct = Math.min(b.percentage, 100);
                const color = b.percentage >= 100 ? 'bg-red-500' : b.percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
                return (
                  <div key={b.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{b.category}</span>
                      <span className={`font-semibold ${b.percentage >= 100 ? 'text-red-500' : b.percentage >= 80 ? 'text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                        {currencySymbol}{b.spent.toFixed(0)} / {currencySymbol}{Number(b.limit_amount).toFixed(0)}
                      </span>
                    </div>
                    <div className="progress-bar h-2">
                      <div className={`progress-fill ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No budgets set</p>
              <Link href="/budgets" className="text-xs text-indigo-500 hover:text-indigo-600 mt-1 inline-block">Set a budget →</Link>
            </div>
          )}
        </motion.div>

        {/* Smart Insights */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h2 className="section-title text-base">Smart Insights</h2>
          </div>
          {summary?.insights?.length > 0 ? (
            <div className="space-y-3">
              {summary.insights.map((insight: string, i: number) => (
                <div key={i} className="flex gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800/30">
                  <span className="text-amber-500 shrink-0">💡</span>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800/30">
              <span className="shrink-0">✨</span>
              <p className="text-sm text-indigo-700 dark:text-indigo-300">Add more expenses to unlock personalized insights!</p>
            </div>
          )}

          {/* Savings Summary */}
          {summary?.savingsGoalsSummary && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Savings Goals</span>
                <Link href="/savings" className="text-xs text-indigo-500 hover:text-indigo-600">View →</Link>
              </div>
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {currencySymbol}{summary.savingsGoalsSummary.totalSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })} saved of {currencySymbol}{summary.savingsGoalsSummary.totalTarget.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="progress-bar h-2 mt-2">
                <div
                  className="progress-fill bg-emerald-500"
                  style={{ width: `${summary.savingsGoalsSummary.totalTarget > 0 ? Math.min((summary.savingsGoalsSummary.totalSaved / summary.savingsGoalsSummary.totalTarget) * 100, 100) : 0}%` }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
