'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#6366f1', Transport: '#10b981', Shopping: '#f59e0b',
  Bills: '#ef4444', Health: '#14b8a6', Entertainment: '#a855f7', Other: '#64748b',
};
const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [monthly, setMonthly] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [dayofweek, setDayofweek] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR));

  useEffect(() => { if (!isLoading && !user) router.push('/login'); }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filterMonth) params.set('month', filterMonth);
        if (filterYear) params.set('year', filterYear);
        const qs = params.toString();

        const [monthlyRes, catRes, merchantRes, dowRes, summaryRes] = await Promise.all([
          api.get('/api/analytics/monthly'),
          api.get(`/api/analytics/categories${qs ? '?' + qs : ''}`),
          api.get(`/api/analytics/merchants?limit=8${qs ? '&' + qs : ''}`),
          api.get(`/api/analytics/dayofweek${qs ? '?' + qs : ''}`),
          api.get('/api/analytics/summary'),
        ]);
        setMonthly(monthlyRes.data);
        setCategories(catRes.data);
        setMerchants(merchantRes.data);
        setDayofweek(dowRes.data);
        setSummary(summaryRes.data);
      } catch {} finally { setLoading(false); }
    };
    fetchAll();
  }, [user, filterMonth, filterYear]);

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  if (loading) return (
    <div className="page-container">
      <div className="animate-pulse grid lg:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => <div key={i} className="h-72 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
      </div>
    </div>
  );

  // Month-over-Month comparison
  const lastTwo = monthly.slice(-2);
  const momChange = lastTwo.length === 2 && lastTwo[0].total > 0
    ? ((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total * 100).toFixed(1)
    : null;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Deep dive into your spending patterns</p>
        </div>
        {/* Filters */}
        <div className="flex gap-2">
          <select className="input text-sm w-32" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
          </select>
          <select className="input text-sm w-28" value={filterYear} onChange={(e) => setFilterYear(e.target.value)}>
            {[CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2].map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* MoM Comparison */}
      {momChange !== null && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mb-6 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${Number(momChange) > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
            {Number(momChange) > 0 ? <TrendingUp className="text-red-500" size={20} /> : <TrendingDown className="text-emerald-500" size={20} />}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Month-over-Month</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {lastTwo[1]?.month} spending is{' '}
              <span className={Number(momChange) > 0 ? 'text-red-500 font-semibold' : 'text-emerald-500 font-semibold'}>
                {Number(momChange) > 0 ? '+' : ''}{momChange}%
              </span>{' '}
              {Number(momChange) > 0 ? 'more' : 'less'} than {lastTwo[0]?.month} ({currencySymbol}{lastTwo[0]?.total?.toFixed(0)} → {currencySymbol}{lastTwo[1]?.total?.toFixed(0)})
            </p>
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 1. Monthly Trend Line Chart */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5 lg:col-span-2">
          <h2 className="section-title text-base mb-4">12-Month Spending Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthly} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(0)}`, 'Spent']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} activeDot={{ r: 6 }} animationDuration={800} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 2. Category Donut */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-5">
          <h2 className="section-title text-base mb-4">Category Breakdown</h2>
          {categories.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="total" animationDuration={800}>
                    {categories.map((entry: any) => <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(2)}`]} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {categories.map((c: any) => (
                  <div key={c.category} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c.category] || '#64748b' }} />
                    <span className="text-xs text-slate-600 dark:text-slate-400">{c.category}</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-white">{currencySymbol}{Number(c.total).toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>}
        </motion.div>

        {/* 3. Category Bar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-5">
          <h2 className="section-title text-base mb-4">Category Bar Chart</h2>
          {categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categories} layout="vertical" margin={{ top: 5, right: 15, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(2)}`, 'Amount']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} animationDuration={800}>
                  {categories.map((entry: any) => <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] || '#64748b'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-56 flex items-center justify-center text-slate-400 text-sm">No data</div>}
        </motion.div>

        {/* 4. Day-of-Week Heatmap (Bar) */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card p-5">
          <h2 className="section-title text-base mb-4">Spending by Day of Week</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dayofweek} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-secondary)' }} tickFormatter={(d) => d.slice(0, 3)} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
              <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(0)}`, 'Spent']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="total" fill="#14b8a6" radius={[4, 4, 0, 0]} animationDuration={800} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 5. Payment Method Pie */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-5">
          <h2 className="section-title text-base mb-4">Payment Methods</h2>
          {summary?.categoryBreakdown ? (() => {
            const pmColors = { Cash: '#64748b', UPI: '#6366f1', Card: '#10b981', Net_Banking: '#f59e0b' };
            // We reuse analytics/categories for categories; payment method comes from summary indirectly
            // Display a placeholder bar chart using categories data as proxy
            return (
              <div className="flex items-center justify-center h-48 text-sm text-slate-400">
                <div className="text-center">
                  <p className="font-medium text-slate-600 dark:text-slate-300 mb-2">Add expenses to see payment method breakdown</p>
                  <p className="text-xs">UPI, Card, Cash & Net Banking</p>
                </div>
              </div>
            );
          })() : <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data</div>}
        </motion.div>

        {/* 6. Top Merchants */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="card p-5 lg:col-span-2">
          <h2 className="section-title text-base mb-4">Top Merchants</h2>
          {merchants.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={merchants} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="merchant" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(v: any) => [`${currencySymbol}${Number(v).toFixed(2)}`, 'Total']} contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="total" fill="#a855f7" radius={[4, 4, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Add merchant names to your expenses to see top merchants</div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
