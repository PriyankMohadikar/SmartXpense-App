'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motion as m } from 'framer-motion';
import { Plus, Trash2, Edit2, Target, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Other'];
const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };
const CATEGORY_COLORS: Record<string, string> = {
  Food: '#6366f1', Transport: '#10b981', Shopping: '#f59e0b',
  Bills: '#ef4444', Health: '#14b8a6', Entertainment: '#a855f7', Other: '#64748b',
};
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => ({ label: m, value: i + 1 }));

interface Budget { id: string; category: string; limit_amount: number; month: number; year: number; spent: number; percentage: number; }
interface BudgetForm { category: string; limit_amount: string; month: string; year: string; }

export default function BudgetsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BudgetForm>();

  useEffect(() => { if (!isLoading && !user) router.push('/login'); }, [isLoading, user, router]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/api/budgets?month=${selectedMonth}&year=${selectedYear}`);
      setBudgets(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchBudgets(); }, [user, selectedMonth, selectedYear]);

  const openModal = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget);
      setValue('category', budget.category);
      setValue('limit_amount', String(budget.limit_amount));
      setValue('month', String(budget.month));
      setValue('year', String(budget.year));
    } else {
      setEditingBudget(null);
      reset({ category: 'Food', limit_amount: '', month: String(selectedMonth), year: String(selectedYear) });
    }
    setModalOpen(true);
  };

  const onSubmit = async (data: BudgetForm) => {
    try {
      if (editingBudget) {
        await api.put(`/api/budgets/${editingBudget.id}`, { limit_amount: data.limit_amount });
        toast.success('Budget updated');
      } else {
        await api.post('/api/budgets', data);
        toast.success('Budget created');
      }
      setModalOpen(false);
      fetchBudgets();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to save budget');
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await api.delete(`/api/budgets/${id}`);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch { toast.error('Failed to delete'); }
  };

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Budgets</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage your monthly spending limits</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 text-sm" id="add-budget-btn">
          <Plus size={16} />Add Budget
        </button>
      </div>

      {/* Month/Year selector */}
      <div className="flex gap-3 mb-5">
        <select className="input text-sm w-40" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
          {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select className="input text-sm w-28" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
          {[now.getFullYear(), now.getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16 card">
          <Target className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No budgets for this period</p>
          <button onClick={() => openModal()} className="btn-primary mt-4 text-sm">Create Budget</button>
        </div>
      ) : (
        <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {budgets.map((budget) => {
            const pct = Math.min(budget.percentage, 100);
            const status = budget.percentage >= 100 ? 'over' : budget.percentage >= 80 ? 'warning' : 'ok';
            const barColor = status === 'over' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
            return (
              <motion.div key={budget.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${CATEGORY_COLORS[budget.category]}20` }}>
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[budget.category] }} />
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">{budget.category}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openModal(budget)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => deleteBudget(budget.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {status === 'over' && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-1.5 mb-3">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">⚠️ Over budget by {currencySymbol}{(budget.spent - budget.limit_amount).toFixed(0)}</p>
                  </div>
                )}
                {status === 'warning' && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg px-3 py-1.5 mb-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">⚡ Nearing budget limit ({budget.percentage.toFixed(0)}% used)</p>
                  </div>
                )}

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 dark:text-slate-400">Spent</span>
                  <span className={`font-semibold ${status === 'over' ? 'text-red-500' : status === 'warning' ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                    {currencySymbol}{budget.spent.toFixed(0)} / {currencySymbol}{budget.limit_amount.toFixed(0)}
                  </span>
                </div>

                <div className="progress-bar h-2.5">
                  <div className={`progress-fill ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs text-slate-400 mt-1.5">{budget.percentage.toFixed(1)}% used · {currencySymbol}{Math.max(0, budget.limit_amount - budget.spent).toFixed(0)} remaining</p>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="card p-6 w-full max-w-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="section-title text-base">{editingBudget ? 'Edit Budget' : 'Add Budget'}</h2>
                  <button onClick={() => setModalOpen(false)} className="text-slate-400"><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  {!editingBudget && (
                    <>
                      <div>
                        <label className="label">Category</label>
                        <select {...register('category', { required: true })} className="input text-sm" id="budget-category">
                          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Month</label>
                          <select {...register('month', { required: true })} className="input text-sm" id="budget-month">
                            {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="label">Year</label>
                          <select {...register('year', { required: true })} className="input text-sm" id="budget-year">
                            {[now.getFullYear(), now.getFullYear() + 1].map((y) => <option key={y} value={y}>{y}</option>)}
                          </select>
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="label">Limit Amount ({currencySymbol})</label>
                    <input {...register('limit_amount', { required: 'Amount required', min: { value: 1, message: 'Must be > 0' } })} type="number" step="0.01" className={`input text-sm ${errors.limit_amount ? 'border-red-500' : ''}`} placeholder="5000" id="budget-amount" />
                    {errors.limit_amount && <p className="text-red-500 text-xs mt-1">{errors.limit_amount.message}</p>}
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button type="submit" className="btn-primary flex-1 text-sm">{editingBudget ? 'Update' : 'Create'}</button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
