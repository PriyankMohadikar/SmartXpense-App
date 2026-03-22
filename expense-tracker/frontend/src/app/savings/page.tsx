'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, PiggyBank, Edit2, Trash2, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { format, isPast } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const CURRENCY_SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£' };

interface SavingsGoal {
  id: string; title: string; target_amount: number; saved_amount: number;
  target_date: string; percentage: number; remaining: number;
}
interface GoalForm { title: string; target_amount: string; saved_amount: string; target_date: string; }
interface UpdateForm { saved_amount: string; }

export default function SavingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [updateGoalId, setUpdateGoalId] = useState<string | null>(null);

  const { register: regGoal, handleSubmit: hsGoal, reset: resetGoal, formState: { errors: errGoal } } = useForm<GoalForm>();
  const { register: regUpdate, handleSubmit: hsUpdate, setValue: setValueU } = useForm<UpdateForm>();

  useEffect(() => { if (!isLoading && !user) router.push('/login'); }, [isLoading, user, router]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/savings');
      setGoals(data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (user) fetchGoals(); }, [user]);

  const onAddGoal = async (data: GoalForm) => {
    try {
      await api.post('/api/savings', data);
      toast.success('Goal created!');
      setAddModalOpen(false);
      resetGoal();
      fetchGoals();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create goal');
    }
  };

  const onUpdateSaved = async (data: UpdateForm) => {
    if (!updateGoalId) return;
    try {
      await api.put(`/api/savings/${updateGoalId}`, { saved_amount: data.saved_amount });
      toast.success('Progress updated!');
      setUpdateGoalId(null);
      fetchGoals();
    } catch { toast.error('Failed to update'); }
  };

  const deleteGoal = async (id: string) => {
    try {
      await api.delete(`/api/savings/${id}`);
      toast.success('Goal deleted');
      fetchGoals();
    } catch { toast.error('Failed to delete'); }
  };

  const openUpdate = (goal: SavingsGoal) => {
    setUpdateGoalId(goal.id);
    setValueU('saved_amount', String(goal.saved_amount));
  };

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'INR'] || '₹';

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Savings Goals</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your progress toward financial goals</p>
        </div>
        <button onClick={() => { setAddModalOpen(true); resetGoal(); }} className="btn-primary flex items-center gap-2 text-sm" id="add-goal-btn">
          <Plus size={16} />Add Goal
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl" />)}
        </div>
      ) : goals.length === 0 ? (
        <div className="text-center py-16 card">
          <PiggyBank className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No savings goals yet</p>
          <button onClick={() => setAddModalOpen(true)} className="btn-primary mt-4 text-sm">Create Your First Goal</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(goal.percentage, 100);
            const isCompleted = goal.percentage >= 100;
            const isOverdue = isPast(new Date(goal.target_date)) && !isCompleted;
            return (
              <motion.div key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card p-5 hover:-translate-y-0.5 transition-transform">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                      <PiggyBank className={isCompleted ? 'text-emerald-500' : 'text-indigo-500'} size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{goal.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar size={11} className="text-slate-400" />
                        <span className={`text-xs ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                          {isOverdue ? 'Overdue · ' : ''}{format(new Date(goal.target_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openUpdate(goal)} className="p-1.5 text-slate-400 hover:text-indigo-500 rounded transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => deleteGoal(goal.id)} className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {isCompleted && (
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg px-3 py-1.5 mb-3">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">🎉 Goal achieved!</p>
                  </div>
                )}

                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500 dark:text-slate-400">Saved</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currencySymbol}{goal.saved_amount.toLocaleString('en-IN')} / {currencySymbol}{goal.target_amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="progress-bar h-3">
                  <div className={`progress-fill ${isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-xs text-slate-400">{goal.percentage.toFixed(1)}% complete</span>
                  <span className="text-xs text-slate-400">{currencySymbol}{goal.remaining.toLocaleString('en-IN')} to go</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="card p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-base">New Savings Goal</h2>
                <button onClick={() => setAddModalOpen(false)} className="text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={hsGoal(onAddGoal)} className="space-y-3">
                <div>
                  <label className="label">Goal Title</label>
                  <input {...regGoal('title', { required: 'Title required' })} className={`input text-sm ${errGoal.title ? 'border-red-500' : ''}`} placeholder="e.g. Emergency Fund" id="goal-title" />
                  {errGoal.title && <p className="text-red-500 text-xs mt-1">{errGoal.title.message}</p>}
                </div>
                <div>
                  <label className="label">Target Amount ({currencySymbol})</label>
                  <input {...regGoal('target_amount', { required: 'Required', min: 1 })} type="number" step="0.01" className={`input text-sm ${errGoal.target_amount ? 'border-red-500' : ''}`} placeholder="50000" id="goal-target" />
                </div>
                <div>
                  <label className="label">Already Saved ({currencySymbol}, optional)</label>
                  <input {...regGoal('saved_amount')} type="number" step="0.01" className="input text-sm" placeholder="0" id="goal-saved" />
                </div>
                <div>
                  <label className="label">Target Date</label>
                  <input {...regGoal('target_date', { required: 'Date required' })} type="date" className={`input text-sm ${errGoal.target_date ? 'border-red-500' : ''}`} id="goal-date" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setAddModalOpen(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 text-sm">Create Goal</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Saved Amount Modal */}
      <AnimatePresence>
        {updateGoalId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="card p-6 w-full max-w-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title text-base">Update Progress</h2>
                <button onClick={() => setUpdateGoalId(null)} className="text-slate-400"><X size={18} /></button>
              </div>
              <form onSubmit={hsUpdate(onUpdateSaved)} className="space-y-3">
                <div>
                  <label className="label">Saved Amount ({currencySymbol})</label>
                  <input {...regUpdate('saved_amount', { required: 'Required' })} type="number" step="0.01" className="input text-sm" id="update-saved" />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setUpdateGoalId(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" className="btn-primary flex-1 text-sm">Update</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
