import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  User,
  BadgeCheck,
  Lock,
  Save,
  X,
  Building2,
  Globe,
  Tag
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { CompanyProfile } from '../../types';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';

export const CompanyProfilePage = () => {
  const { currentUser, updateProfileImage, updateProfile, changePassword } = useAppContext();
  const navigate = useNavigate();
  const profile = currentUser as CompanyProfile;
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CompanyProfile>>({});
  
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '' });
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName,
        industry: profile.industry || '',
        website: profile.website || '',
        description: profile.description || '',
      });
    }
  }, [profile]);

  if (!profile || profile.role !== 'company') {
    return null;
  }
  
  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      // error handled in context
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(passwordData);
      setIsEditingPassword(false);
      setPasswordData({ old_password: '', new_password: '' });
    } catch (error) {
      // error handled in context
    }
  };
  
  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      <AnimatedBackground />

      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 inline-flex items-center text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white dark:bg-neutral-900 px-5 py-2.5 rounded-full shadow-soft"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </button>

        {/* Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 card-soft relative overflow-hidden bg-gradient-to-r from-accent-50 to-warm-50 dark:from-accent-900/20 dark:to-warm-900/20 p-6 md:p-8 flex items-center justify-between"
        >
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent-200/40 dark:bg-accent-900/40 rounded-full blur-[60px]" />
          <div className="relative z-10 flex-1 pr-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full">
                <Building2 size={12} /> Company Profile
              </span>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">
                  <BadgeCheck size={12} /> Verified Company
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
              Your Company <span className="text-accent-600 dark:text-accent-400">Settings</span>
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-md">
              Keep your company details updated to attract the best talent. Verified companies receive 3x more applications.
            </p>
          </div>
          <div className="hidden md:block w-40 h-40 shrink-0">
            <img
              src="/images/company_profile.png"
              alt="Profile 3D Illustration"
              className="w-full h-full object-contain drop-shadow-xl animate-float"
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Sticky Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-soft p-6 lg:p-8 lg:sticky lg:top-24 text-center">
              <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-[32px] bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-600 dark:text-accent-400 font-extrabold text-2xl shadow-inner-soft overflow-hidden transition-all duration-300">
                  {profile.logoUrl ? (
                    <img src={profile.logoUrl} alt={profile.companyName || 'Company'} className="w-full h-full object-cover" />
                  ) : (
                    (profile.companyName || 'C').charAt(0).toUpperCase()
                  )}
                </div>
                <label className="absolute -bottom-3 -right-3 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white p-3 rounded-2xl cursor-pointer shadow-soft transition-transform hover:scale-110 duration-200">
                  <Camera size={20} />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        updateProfileImage(file);
                      }
                    }}
                  />
                </label>
              </div>

              <h1 className="text-2xl font-display font-extrabold text-neutral-900 dark:text-white flex items-center justify-center gap-2 mb-2">
                {profile.companyName}
                {profile.isVerified && <BadgeCheck className="text-blue-500 w-6 h-6 shrink-0" />}
              </h1>
              
              {profile.industry && (
                 <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-xl">
                   <Tag size={14} /> {profile.industry}
                 </span>
              )}
            </motion.div>
          </div>

          {/* Right Column - Main Content Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: User/Company Information */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="card-soft p-6 md:p-8 lg:p-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <User className="text-accent-500" /> Account Details
                </h2>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Login Email</label>
                    <input 
                      type="email" 
                      disabled 
                      className="input-soft w-full bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400 cursor-not-allowed"
                      value={profile.email}
                    />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Account Created</label>
                     <input 
                      type="text" 
                      disabled 
                      className="input-soft w-full bg-neutral-50 dark:bg-neutral-900/50 text-neutral-400 cursor-not-allowed"
                      value={new Date(profile.createdAt).toLocaleDateString()}
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Section 2: Company Profile Information */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card-soft p-6 md:p-8 lg:p-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Building2 className="text-accent-500" /> Company Profile
                </h2>
                {!isEditing ? (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-accent-600 hover:text-accent-700 dark:text-accent-400 px-3 py-1.5 bg-accent-50 dark:bg-accent-900/20 rounded-lg">
                    Edit Info
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsEditing(false)} className="p-1.5 text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                      <X size={18} />
                    </button>
                    <button onClick={handleSaveProfile} className="flex items-center gap-1.5 text-sm font-bold text-white bg-neutral-900 dark:bg-white dark:text-neutral-900 px-3 py-1.5 rounded-lg shadow-sm">
                      <Save size={14} /> Save
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Company Name</label>
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      className="input-soft w-full disabled:bg-neutral-50 disabled:dark:bg-neutral-900/50"
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Industry</label>
                    <input 
                      type="text" 
                      disabled={!isEditing}
                      className="input-soft w-full disabled:bg-neutral-50 disabled:dark:bg-neutral-900/50"
                      value={formData.industry || ''}
                      onChange={(e) => setFormData({...formData, industry: e.target.value})}
                      placeholder="e.g. SaaS, FinTech"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <input 
                      type="url" 
                      disabled={!isEditing}
                      className="input-soft w-full pl-10 disabled:bg-neutral-50 disabled:dark:bg-neutral-900/50"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({...formData, website: e.target.value})}
                      placeholder="https://"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Company Description</label>
                  <textarea 
                    disabled={!isEditing}
                    rows={6}
                    className="input-soft w-full resize-none disabled:bg-neutral-50 disabled:dark:bg-neutral-900/50"
                    value={formData.description || ''}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your company, mission, and culture..."
                  />
                </div>
              </div>

            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};