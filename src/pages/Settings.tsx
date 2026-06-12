import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Lock, Trash2, Save, Eye, EyeOff,
  Shield, ShieldCheck, AlertTriangle, Phone,
  Settings as SettingsIcon, CheckCircle2, Bell,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

type Tab = 'account' | 'security';

export const Settings = () => {
  const { currentUser, updateProfile, changePassword, apiFetch, logout } = useAppContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Account form
  const [accountForm, setAccountForm] = useState({
    name: currentUser?.name || '',
    phoneNumber: (currentUser as any)?.phoneNumber || '',
  });
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setIsSavingAccount(true);
    try {
      await updateProfile({ phoneNumber: accountForm.phoneNumber });
      await apiFetch('/auth/me/', {
        method: 'PUT',
        body: JSON.stringify({
          first_name: accountForm.name.split(' ')[0],
          last_name: accountForm.name.split(' ').slice(1).join(' '),
        }),
      });
      toast.success('Account details updated!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password) {
      toast.error('Please fill in all password fields.');
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordForm.new_password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setIsSavingPassword(true);
    try {
      await changePassword(passwordForm.old_password, passwordForm.new_password);
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
      toast.success('Password updated successfully!');
    } catch {
      // error handled by context
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      toast.error('Please type DELETE exactly to confirm.');
      return;
    }
    setIsDeleting(true);
    try {
      await apiFetch('/auth/delete/', { method: 'DELETE' });
      logout();
      navigate('/');
      toast.success('Your account has been deleted.');
    } catch {
      toast.error('Could not delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const pwStrength = (pw: string) => {
    if (!pw) return { bars: 0, label: '', color: '' };
    if (pw.length < 6) return { bars: 1, label: 'Weak', color: 'bg-red-400' };
    if (pw.length < 10) return { bars: 2, label: 'Fair', color: 'bg-orange-400' };
    if (pw.length < 12) return { bars: 3, label: 'Good', color: 'bg-yellow-400' };
    return { bars: 4, label: 'Strong', color: 'bg-green-400' };
  };
  const strength = pwStrength(passwordForm.new_password);

  // ─── Shared input class ───────────────────────────────────────────────────
  const inputCls = 'w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 text-sm font-medium text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:ring-2 focus:ring-accent-500 focus:border-transparent outline-none transition';
  const labelCls = 'block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2';

  const securityFeatures = [
    {
      icon: Shield,
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: 'Login Sessions',
      desc: 'You are currently active on this device.',
      badge: 'Active',
      badgeCls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    },
    {
      icon: ShieldCheck,
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      title: 'Two-Factor Authentication',
      desc: 'Add an extra layer of security to your account.',
      badge: 'Coming Soon',
      badgeCls: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
    },
    {
      icon: Bell,
      iconBg: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      title: 'Login Alerts',
      desc: 'Get notified when a new sign-in happens.',
      badge: 'Coming Soon',
      badgeCls: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500',
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-10"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-lg shadow-accent-500/25 shrink-0">
            <SettingsIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 dark:text-white leading-tight">
              Settings
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm font-medium">
              Manage your account and security
            </p>
          </div>
        </motion.div>

        {/* ── TAB SWITCHER ── */}
        <div className="flex gap-2 mb-6 sm:mb-8 p-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
          {(['account', 'security'] as Tab[]).map((tab) => {
            const isActive = activeTab === tab;
            const Icon = tab === 'account' ? User : Shield;
            const label = tab === 'account' ? 'Account' : 'Security';
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 ${
                  isActive
                    ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">

          {/* ════════════ ACCOUNT TAB ════════════ */}
          {activeTab === 'account' && (
            <motion.div
              key="account"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Personal Info Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-5 sm:mb-6">
                  <User size={18} className="text-accent-500 shrink-0" />
                  Personal Information
                </h2>

                <div className="space-y-4 sm:space-y-5">
                  {/* Full Name */}
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input
                      type="text"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      placeholder="Your full name"
                      className={inputCls}
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className={labelCls}>
                      Email Address{' '}
                      <span className="normal-case font-normal text-neutral-400 tracking-normal">(cannot be changed)</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={currentUser?.email || ''}
                      className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-900/80 px-4 py-3 text-sm font-medium text-neutral-400 cursor-not-allowed"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={accountForm.phoneNumber}
                        onChange={(e) => setAccountForm({ ...accountForm, phoneNumber: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                        className={`${inputCls} pl-10`}
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-5 sm:mt-6">
                  <button
                    onClick={handleSaveAccount}
                    disabled={isSavingAccount}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 active:scale-95 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-60 shadow-md"
                  >
                    {isSavingAccount
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Save size={15} />
                    }
                    Save Changes
                  </button>
                </div>
              </div>

              {/* ── DANGER ZONE ── */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-red-200 dark:border-red-900/40 p-5 sm:p-8 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                  <Trash2 size={18} className="shrink-0" />
                  Danger Zone
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mb-5">
                  Once deleted, your account and all associated data will be permanently erased. This cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 px-5 py-3 rounded-xl font-bold text-sm transition-all"
                  >
                    <Trash2 size={15} />
                    Delete My Account
                  </button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 bg-red-50 dark:bg-red-950/30 p-4 sm:p-5 rounded-2xl border border-red-200 dark:border-red-900/40"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={16} />
                      <p className="text-xs sm:text-sm text-red-700 dark:text-red-400 font-medium leading-relaxed">
                        This action is <strong>irreversible</strong>. All your data, applications, and profile will be permanently deleted.
                        Type <strong>DELETE</strong> below to confirm.
                      </p>
                    </div>

                    <input
                      type="text"
                      value={deleteInput}
                      onChange={(e) => setDeleteInput(e.target.value)}
                      placeholder="Type DELETE here"
                      className="w-full rounded-xl border-2 border-red-300 dark:border-red-800 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-bold text-red-700 dark:text-red-400 placeholder:text-red-300 dark:placeholder:text-red-900 focus:ring-2 focus:ring-red-400 outline-none"
                    />

                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => { setShowDeleteConfirm(false); setDeleteInput(''); }}
                        className="flex-1 py-3 rounded-xl font-bold text-sm text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 active:scale-95 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteInput !== 'DELETE'}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDeleting
                          ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          : <Trash2 size={15} />
                        }
                        Delete Permanently
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ════════════ SECURITY TAB ════════════ */}
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 sm:space-y-6"
            >
              {/* Change Password Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-5 sm:mb-6">
                  <Lock size={18} className="text-accent-500 shrink-0" />
                  Change Password
                </h2>

                <div className="space-y-4 sm:space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className={labelCls}>Current Password</label>
                    <div className="relative">
                      <input
                        type={showOld ? 'text' : 'password'}
                        value={passwordForm.old_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        placeholder="Your current password"
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      >
                        {showOld ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className={labelCls}>New Password</label>
                    <div className="relative">
                      <input
                        type={showNew ? 'text' : 'password'}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        placeholder="At least 8 characters"
                        className={`${inputCls} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew(!showNew)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      >
                        {showNew ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>

                    {/* Strength Meter */}
                    {passwordForm.new_password.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[1, 2, 3, 4].map((s) => (
                            <div
                              key={s}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                s <= strength.bars ? strength.color : 'bg-neutral-200 dark:bg-neutral-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-neutral-500 w-12 text-right shrink-0">
                          {strength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className={labelCls}>Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                        placeholder="Repeat new password"
                        className={`${inputCls} pr-12 ${
                          passwordForm.confirm_password && passwordForm.confirm_password !== passwordForm.new_password
                            ? 'border-red-400 bg-red-50 dark:bg-red-900/10 focus:ring-red-400'
                            : passwordForm.confirm_password && passwordForm.confirm_password === passwordForm.new_password
                            ? 'border-green-400 bg-green-50 dark:bg-green-900/10 focus:ring-green-400'
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                      >
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                      {passwordForm.confirm_password && passwordForm.confirm_password === passwordForm.new_password && (
                        <CheckCircle2 size={16} className="absolute right-11 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                      )}
                    </div>
                    {passwordForm.confirm_password && passwordForm.confirm_password !== passwordForm.new_password && (
                      <p className="text-xs text-red-500 font-semibold mt-1.5">Passwords do not match</p>
                    )}
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    onClick={handleChangePassword}
                    disabled={isSavingPassword}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-60 shadow-md"
                  >
                    {isSavingPassword
                      ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      : <Lock size={15} />
                    }
                    Update Password
                  </button>
                </div>
              </div>

              {/* Additional Security Card */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 p-5 sm:p-8 shadow-sm">
                <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-4 sm:mb-6">
                  <ShieldCheck size={18} className="text-accent-500 shrink-0" />
                  Additional Security
                </h2>

                <div className="space-y-3">
                  {securityFeatures.map((feat) => (
                    <div
                      key={feat.title}
                      className="flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${feat.iconBg}`}>
                          <feat.icon size={18} className={feat.iconColor} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white leading-tight">{feat.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5 hidden sm:block">{feat.desc}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${feat.badgeCls}`}>
                        {feat.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
};
