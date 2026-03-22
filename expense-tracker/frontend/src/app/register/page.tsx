'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Wallet, User, Mail, Lock, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import Image from 'next/image';

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  currency: string;
}

const currencies = [
  { code: 'INR', label: '₹ INR – Indian Rupee' },
  { code: 'USD', label: '$ USD – US Dollar' },
  { code: 'EUR', label: '€ EUR – Euro' },
  { code: 'GBP', label: '£ GBP – British Pound' },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    defaultValues: { currency: 'INR' },
  });
  const password = watch('password');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('currency', data.currency);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data: res } = await api.post('/api/auth/register', formData);

      localStorage.setItem('smartxpense_token', res.token);
      localStorage.setItem('smartxpense_user', JSON.stringify(res.user));
      toast.success('Account created! Welcome to SmartXpense 🎉');
      router.push('/dashboard');
    } catch (err) {
      const msg = (err as AxiosError<{ message: string }>)?.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start tracking smarter with SmartXpense</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Avatar Upload */}
            <div className="flex justify-center mb-2">
              <div className="relative">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border-2 border-dashed border-indigo-300 dark:border-indigo-700 flex items-center justify-center cursor-pointer overflow-hidden hover:border-indigo-500 transition-colors"
                >
                  {avatarPreview ? (
                    <Image src={avatarPreview} alt="Preview" width={80} height={80} className="object-cover w-full h-full" />
                  ) : (
                    <div className="text-center">
                      <Camera className="w-6 h-6 text-indigo-400 mx-auto" />
                      <span className="text-xs text-indigo-400 mt-1 block">Photo</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('name', { required: 'Name is required' })} placeholder="John Doe" className={`input pl-9 ${errors.name ? 'border-red-500' : ''}`} id="name" />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} type="email" placeholder="you@example.com" className={`input pl-9 ${errors.email ? 'border-red-500' : ''}`} id="email" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Currency */}
            <div>
              <label className="label">Currency</label>
              <select {...register('currency')} className="input" id="currency">
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min 8 characters' } })} type={showPw ? 'text' : 'password'} placeholder="At least 8 characters" className={`input pl-9 pr-10 ${errors.password ? 'border-red-500' : ''}`} id="password" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="label">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input {...register('confirmPassword', { required: 'Please confirm password', validate: (v) => v === password || 'Passwords do not match' })} type={showPw ? 'text' : 'password'} placeholder="Repeat password" className={`input pl-9 ${errors.confirmPassword ? 'border-red-500' : ''}`} id="confirmPassword" />
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-500 hover:text-indigo-600 font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
