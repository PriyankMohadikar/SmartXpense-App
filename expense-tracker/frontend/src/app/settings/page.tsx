'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Camera, Save, User, Mail, Lock, DollarSign } from 'lucide-react';
import Image from 'next/image';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

interface ProfileForm { name: string; email: string; currency: string; monthly_income: string; }
interface PasswordForm { current_password: string; new_password: string; confirm_password: string; }

const CURRENCIES = [
  { code: 'INR', label: '₹ INR – Indian Rupee' },
  { code: 'USD', label: '$ USD – US Dollar' },
  { code: 'EUR', label: '€ EUR – Euro' },
  { code: 'GBP', label: '£ GBP – British Pound' },
];

export default function SettingsPage() {
  const { user, isLoading, updateUser } = useAuth();
  const router = useRouter();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register: regProfile, handleSubmit: hsProfile, reset: resetProfile } = useForm<ProfileForm>();
  const { register: regPw, handleSubmit: hsPw, watch, reset: resetPw, formState: { errors: errPw } } = useForm<PasswordForm>();
  const newPassword = watch('new_password');

  useEffect(() => { if (!isLoading && !user) router.push('/login'); }, [isLoading, user, router]);
  useEffect(() => {
    if (user) resetProfile({ name: user.name, email: user.email, currency: user.currency, monthly_income: user.monthly_income ? String(user.monthly_income) : '' });
  }, [user, resetProfile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setAvatarFile(file); setAvatarPreview(URL.createObjectURL(file)); }
  };

  const onSaveProfile = async (data: ProfileForm) => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('currency', data.currency);
      if (data.monthly_income) formData.append('monthly_income', data.monthly_income);
      if (avatarFile) formData.append('avatar', avatarFile);

      const { data: updatedUser } = await api.put('/api/user/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(updatedUser);
      toast.success('Profile updated!');
      setAvatarFile(null);
    } catch (err) {
      toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const onChangePassword = async (data: PasswordForm) => {
    setSavingPassword(true);
    try {
      await api.put('/api/user/profile', { password: data.new_password });
      toast.success('Password changed successfully');
      resetPw();
    } catch (err) {
      toast.error((err as AxiosError<{ message: string }>)?.response?.data?.message || 'Failed to change password');
    } finally { setSavingPassword(false); }
  };

  if (isLoading || !user) return null;

  return (
    <div className="page-container max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Settings</h1>

      {/* Profile Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-6">
        <h2 className="section-title text-base mb-5 flex items-center gap-2"><User size={18} /> Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div
            onClick={() => fileRef.current?.click()}
            className="relative w-16 h-16 rounded-full overflow-hidden cursor-pointer group"
          >
            {(avatarPreview || user.avatar_url) ? (
              <Image src={avatarPreview || user.avatar_url!} alt="Avatar" width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
              <Camera className="text-white" size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-indigo-500 hover:text-indigo-600 mt-0.5">Change photo</button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
        </div>

        <form onSubmit={hsProfile(onSaveProfile)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name</label>
              <input {...regProfile('name', { required: true })} className="input text-sm" id="settings-name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input {...regProfile('email', { required: true })} type="email" className="input text-sm" id="settings-email" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Currency</label>
              <select {...regProfile('currency')} className="input text-sm" id="settings-currency">
                {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Monthly Income (optional)</label>
              <input {...regProfile('monthly_income')} type="number" step="0.01" className="input text-sm" placeholder="e.g. 50000" id="settings-income" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2 text-sm">
              <Save size={15} />{savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Change Password */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <h2 className="section-title text-base mb-5 flex items-center gap-2"><Lock size={18} /> Change Password</h2>
        <form onSubmit={hsPw(onChangePassword)} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input {...regPw('new_password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} type="password" className={`input text-sm ${errPw.new_password ? 'border-red-500' : ''}`} placeholder="At least 8 characters" id="settings-newpw" />
            {errPw.new_password && <p className="text-red-500 text-xs mt-1">{errPw.new_password.message}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...regPw('confirm_password', { required: 'Required', validate: (v) => v === newPassword || 'Passwords do not match' })} type="password" className={`input text-sm ${errPw.confirm_password ? 'border-red-500' : ''}`} placeholder="Repeat password" id="settings-confirmpw" />
            {errPw.confirm_password && <p className="text-red-500 text-xs mt-1">{errPw.confirm_password.message}</p>}
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={savingPassword} className="btn-primary text-sm">
              {savingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-4 mt-4">
        <p className="text-xs text-slate-400">
          Account ID: <code className="font-mono">{user.id}</code> ·
          Member since: {new Date(user.created_at).toLocaleDateString()}
        </p>
      </motion.div>
    </div>
  );
}
