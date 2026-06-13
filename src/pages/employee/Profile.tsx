import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Eye,
  FileText,
  Briefcase,
  GraduationCap,
  Star,
  Lock,
  Camera,
  BadgeCheck,
  Award,
  X,
  Save,
  AlertCircle,
  User,
  Linkedin,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { EmployeeProfile } from '../../types';
import { calculateProfileStrength } from '../../utils/profile';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { toast } from 'sonner';

/* ─── Section edit modal ──────────────────────────────────────────────── */
type SectionKey =
  | 'contact'
  | 'resume'
  | 'qualifications'
  | 'experience'
  | 'education'
  | 'password';

const SECTION_LABELS: Record<SectionKey, string> = {
  contact: 'Contact & Location',
  resume: 'Resume / CV',
  qualifications: 'Qualifications & Skills',
  experience: 'Work Experience',
  education: 'Education',
  password: 'Change Password',
};

export const EmployeeProfilePage = () => {
  const { currentUser, updateProfileImage, updateProfile, changePassword } = useAppContext();
  const navigate = useNavigate();
  const profile = currentUser as EmployeeProfile;
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeProfile>>({});
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        title: profile.title,
        bio: profile.bio,
        linkedinUrl: profile.linkedinUrl,
        resumeUrl: profile.resumeUrl,
        education: profile.education || '',
        experienceYears: profile.experienceYears,
        skills: profile.skills || [],
        phoneNumber: profile.phoneNumber || '',
        location: (profile as any).location || '',
      });
    }
  }, [profile]);

  if (!profile || profile.role !== 'employee') return null;

  const completionScore = calculateProfileStrength(profile);

  const openSection = (key: SectionKey) => setActiveSection(key);
  const closeSection = () => setActiveSection(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData };
      if (Array.isArray(payload.skills)) {
        payload.skills = payload.skills.filter(s => s.trim() !== '');
      } else if (typeof payload.skills === 'string') {
        payload.skills = (payload.skills as string).split(',').map(s => s.trim()).filter(Boolean);
      }
      await updateProfile(payload);
      closeSection();
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await changePassword({ old_password: passwordData.old_password, new_password: passwordData.new_password });
      closeSection();
      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Nav rows ── */
  const profileSections = [
    {
      group: 'Account Info',
      items: [
        {
          key: 'contact' as SectionKey,
          icon: User,
          label: 'Personal Details',
          subtitle: (profile as any).location || 'Name, phone, and location.',
          filled: !!((profile as any).location || (profile as any).phone),
        },
      ],
    },
    {
      group: 'Resume',
      items: [
        {
          key: 'resume' as SectionKey,
          icon: FileText,
          label: 'Smart Resume Upload',
          subtitle: (profile.resumeUrl || profile.resumeFile) ? 'Resume uploaded' : 'Upload CV to automatically fill your profile.',
          filled: !!(profile.resumeUrl || profile.resumeFile),
          isLink: true,
          path: '/employee/resume',
          actionText: (profile.resumeUrl || profile.resumeFile) ? 'Update' : 'Add',
          actionColor: (profile.resumeUrl || profile.resumeFile) ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400'
        },
      ],
    },
    {
      group: 'Improve your job matches',
      items: [
        {
          key: 'qualifications' as SectionKey,
          icon: Star,
          label: 'Qualifications & Skills',
          subtitle: profile.skills?.length ? `${profile.skills.length} skill${profile.skills.length > 1 ? 's' : ''} added` : 'Highlight your skills and expertise.',
          filled: !!(profile.skills && profile.skills.length > 0),
        },
        {
          key: 'experience' as SectionKey,
          icon: Briefcase,
          label: 'Work Experience',
          subtitle: profile.title ? profile.title : 'Add your work experience and title.',
          filled: !!profile.title,
        },
        {
          key: 'education' as SectionKey,
          icon: GraduationCap,
          label: 'Education',
          subtitle: profile.education ? profile.education.substring(0, 60) + (profile.education.length > 60 ? '…' : '') : 'Add your education background.',
          filled: !!profile.education,
        },
      ],
    },
  ];

  /* ── Section modal content ── */
  const renderSectionContent = () => {
    const inputClass = 'input-soft w-full text-sm';
    const labelClass = 'block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5';

    switch (activeSection) {
      case 'contact':
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Full Name</label>
              <input type="text" className={inputClass} placeholder="Your Full Name"
                value={(formData as any).name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value } as any)} />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input type="tel" className={inputClass} placeholder="+234 000 000 0000"
                value={formData.phoneNumber || ''}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Location (City, Country)</label>
              <input type="text" className={inputClass} placeholder="Lagos, Nigeria"
                value={(formData as any).location || ''}
                onChange={e => setFormData({ ...formData, location: e.target.value } as any)} />
            </div>
            <div>
              <label className={labelClass}>LinkedIn URL</label>
              <input type="url" className={inputClass} placeholder="https://linkedin.com/in/yourname"
                value={formData.linkedinUrl || ''}
                onChange={e => setFormData({ ...formData, linkedinUrl: e.target.value })} />
            </div>
          </div>
        );

      case 'resume':
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Resume / Portfolio URL</label>
              <input type="url" className={inputClass} placeholder="https://link-to-your-resume.com"
                value={formData.resumeUrl || ''}
                onChange={e => setFormData({ ...formData, resumeUrl: e.target.value })} />
              {(profile.resumeFile || profile.resumeUrl) && (
                <a href={profile.resumeFile || profile.resumeUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs font-bold text-accent-600 hover:underline">
                  View current resume →
                </a>
              )}
            </div>
          </div>
        );

      case 'qualifications':
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Core Skills (comma-separated)</label>
              <input type="text" className={inputClass} placeholder="Sales, CRM, B2B, Negotiation"
                value={Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || '')}
                onChange={e => setFormData({ ...formData, skills: e.target.value.split(',').map(s => s.trim()) })} />
            </div>
            <div>
              <label className={labelClass}>Professional Summary</label>
              <textarea rows={5} className={`${inputClass} resize-none`} placeholder="Tell employers about your key achievements and expertise…"
                value={formData.bio || ''}
                onChange={e => setFormData({ ...formData, bio: e.target.value })} />
            </div>
          </div>
        );

      case 'experience':
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Current Job Title</label>
              <input type="text" className={inputClass} placeholder="e.g. Senior Sales Executive"
                value={formData.title || ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Years of Experience</label>
              <input type="number" min={0} max={50} className={inputClass}
                value={formData.experienceYears || 0}
                onChange={e => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        );

      case 'education':
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Education Background</label>
              <textarea rows={5} className={`${inputClass} resize-none`}
                placeholder="e.g. B.Sc. Business Administration – University of Lagos (2018–2022)"
                value={formData.education || ''}
                onChange={e => setFormData({ ...formData, education: e.target.value })} />
            </div>
          </div>
        );

      case 'password':
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input type="password" className={inputClass}
                value={passwordData.old_password}
                onChange={e => setPasswordData({ ...passwordData, old_password: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input type="password" className={inputClass}
                value={passwordData.new_password}
                onChange={e => setPasswordData({ ...passwordData, new_password: e.target.value })} />
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input type="password" className={inputClass}
                value={passwordData.confirm_password}
                onChange={e => setPasswordData({ ...passwordData, confirm_password: e.target.value })} />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isPasswordSection = activeSection === 'password';
  const initials = (profile.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen py-4 sm:py-8 md:py-10 relative overflow-hidden">
      <AnimatedBackground />

      <div className="w-full mx-auto px-3 sm:px-4 max-w-4xl relative z-10">

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 sm:mb-6 inline-flex items-center text-xs sm:text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white dark:bg-neutral-900 px-3 sm:px-4 py-2 rounded-full shadow-soft"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Dashboard
        </button>

        {/* ── Hero Banner with Profile Info ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 sm:mb-5 card-soft relative overflow-hidden bg-gradient-to-br from-accent-500/10 via-white dark:via-neutral-900 to-warm-500/10 border border-neutral-100 dark:border-neutral-800"
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-warm-500/10 dark:bg-warm-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-center justify-between gap-6 p-5 sm:p-6 md:p-8">
            
            {/* Left: Avatar & Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 w-full md:w-auto flex-1 min-w-0">
              
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-neutral-800 dark:bg-neutral-700 flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl overflow-hidden cursor-pointer ring-4 ring-white dark:ring-neutral-900 shadow-lg hover:ring-accent-400 transition-all"
                  onClick={() => fileRef.current?.click()}
                >
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.name || 'User'} className="w-full h-full object-cover" />
                    : initials
                  }
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-full flex items-center justify-center shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Camera size={14} className="text-neutral-500" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) updateProfileImage(f); }} />
              </div>

              {/* Info */}
              <div className="flex flex-col justify-center text-center sm:text-left min-w-0">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-2 flex-wrap leading-tight mb-1.5">
                  <span className="truncate">{profile.name || 'Your Name'}</span>
                  {profile.isVerified && <BadgeCheck className="text-blue-500 shrink-0" size={24} />}
                </h1>
                {profile.title && (
                  <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-300 font-bold mb-3 truncate">{profile.title}</p>
                )}

                <div className="flex flex-col sm:flex-row sm:flex-wrap items-center sm:items-start gap-2 sm:gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{profile.email}</span>
                  </div>
                  {(profile as any).phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={14} className="shrink-0" />
                      <span>{(profile as any).phone}</span>
                    </div>
                  )}
                  {(profile as any).location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{(profile as any).location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Profile Strength */}
            <div className="w-full md:w-64 shrink-0 flex flex-col justify-center mt-2 md:mt-0 pt-5 md:pt-0 border-t md:border-t-0 md:border-l border-neutral-200 dark:border-neutral-800/50 md:pl-6">
              <div className="flex justify-between items-center gap-2 mb-2.5">
                <span className="text-xs font-bold text-neutral-500 flex items-center gap-1.5">
                  <Award size={14} className="text-accent-500" /> Profile Strength
                </span>
                <span className="text-sm font-black text-neutral-900 dark:text-white">{completionScore}%</span>
              </div>
              <div className="w-full bg-neutral-200/60 dark:bg-neutral-800/60 rounded-full h-2.5 mb-2 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-500 to-warm-500 transition-all duration-700 relative"
                  style={{ width: `${completionScore}%` }}
                />
              </div>
              {completionScore < 100 ? (
                <p className="text-[11px] text-neutral-400 leading-tight">
                  Complete your profile to increase visibility to employers.
                </p>
              ) : (
                <p className="text-[11px] text-emerald-500 font-bold leading-tight flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ready for employers
                </p>
              )}
            </div>

          </div>
        </motion.div>



        {/* ── Section Groups ── */}
        {profileSections.map((group, gi) => (
          <motion.div
            key={group.group}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * (gi + 1) }}
            className="mb-4"
          >
            {/* Group header */}
            <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 dark:text-white px-1 mb-2">
              {group.group}
            </h2>

            {/* Items */}
            <div className="card-soft overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {group.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => item.isLink ? navigate(item.path as string) : openSection(item.key)}
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 transition-colors text-left group active:scale-[0.99]"
                >
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${item.filled ? 'bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400'}`}>
                    <item.icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">{item.label}</div>
                    <div className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">{item.subtitle}</div>
                  </div>
                  {(item as any).actionText ? (
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 ${(item as any).actionColor}`}>
                      {(item as any).actionText}
                    </span>
                  ) : !item.filled ? (
                    <span className="text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                      Add
                    </span>
                  ) : null}
                  <ChevronRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        ))}


      </div>

      {/* ── Edit Section Slide-up Modal ── */}
      <AnimatePresence>
        {activeSection && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={closeSection}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 md:left-[260px] md:max-w-2xl md:mx-auto z-50 bg-white dark:bg-neutral-950 rounded-t-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
              </div>

              <div className="px-4 sm:px-6 pb-10 pt-2">
                {/* Modal header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white">
                    {SECTION_LABELS[activeSection]}
                  </h3>
                  <button onClick={closeSection} className="p-1.5 sm:p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                    <X size={16} />
                  </button>
                </div>

                {/* Section fields */}
                {renderSectionContent()}

                {/* Save button */}
                <button
                  onClick={isPasswordSection ? handleChangePassword : handleSave}
                  disabled={saving}
                  className="mt-5 w-full flex items-center justify-center gap-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-extrabold py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving
                    ? <span className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Save size={15} />
                  }
                  {saving ? 'Saving…' : isPasswordSection ? 'Update Password' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};