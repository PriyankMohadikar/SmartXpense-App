'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, Lock, Target, PiggyBank, Zap, Globe, ArrowRight, Wallet, TrendingUp, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const features = [
  { icon: BarChart3, title: 'Smart Analytics', description: 'Visualize spending patterns with 6 chart types — line, bar, donut, heatmap, and more.', color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { icon: Target, title: 'Budget Tracking', description: 'Set monthly budgets per category. Get real-time progress with amber/red alerts.', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { icon: PiggyBank, title: 'Savings Goals', description: 'Define savings targets with deadlines. Track progress and celebrate milestones.', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { icon: Zap, title: 'Smart Insights', description: 'AI-powered insights like "You spent 40% more on Food vs last month."', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { icon: Globe, title: 'Multi-Currency', description: 'Supports INR, USD, EUR, GBP and more. Perfect for global users.', color: 'text-teal-500', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { icon: Shield, title: 'Secure & Private', description: 'JWT auth with Redis sessions. Your data stays safe and private.', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
];

const stats = [
  { value: '6+', label: 'Chart Types' },
  { value: '7', label: 'Categories' },
  { value: '60s', label: 'Cache TTL' },
  { value: '100%', label: 'Open Source' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.push('/dashboard');
  }, [user, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white text-lg">SmartXpense</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-sm font-medium px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-800 mb-6">
            <Zap size={14} />Track. Analyze. Save.
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight mb-6">
            Your money,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
              smarter.
            </span>
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            SmartXpense helps you track every rupee, set budgets, analyze spending patterns, and reach your savings goals — all in one elegant dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors">
              Start for Free <ArrowRight size={20} />
            </Link>
            <Link href="/login" className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-8 py-4 rounded-xl text-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-20 max-w-2xl mx-auto"
        >
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-indigo-500">{value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Everything you need to master your finances
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
            A complete toolkit built for people who want clarity and control over their money.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i + 0.4 }}
              className="card p-6 hover:-translate-y-1 transition-transform duration-200 cursor-default"
            >
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={color} size={22} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-500 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
          className="max-w-3xl mx-auto px-4 text-center"
        >
          <TrendingUp className="w-12 h-12 text-white/80 mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to take control?</h2>
          <p className="text-indigo-100 text-lg mb-8">Join thousands tracking smarter. It's completely free.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-indigo-50 transition-colors">
            Create Free Account <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            © 2025 SmartXpense. Built with Next.js, Express, and PostgreSQL.
          </p>
        </div>
      </footer>
    </div>
  );
}
