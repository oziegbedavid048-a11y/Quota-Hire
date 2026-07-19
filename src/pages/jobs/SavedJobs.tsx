import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, MapPin, Banknote, ArrowRight, Heart,
  Briefcase, Clock, BadgeCheck, TrendingUp, Zap, Search, X
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { worldCurrencies } from '../../utils/currencies';

const getCurrencySymbol = (code?: string) => {
  if (!code) return '$';
  const found = worldCurrencies.find(c => c.code === code);
  return found ? found.symbol : code;
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return 'Recently';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState = ({ onBrowse }: { onBrowse: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    className="flex flex-col items-center justify-center text-center py-16 px-6"
  >
    {/* Animated Icon Stack */}
    <div className="relative mb-8">
      {/* Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-accent-400/20 blur-2xl scale-150" />
      {/* Outer ring */}
      <div className="relative w-28 h-28 rounded-3xl bg-gradient-to-br from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-elevated">
        <Bookmark size={44} className="text-neutral-300 dark:text-neutral-600" strokeWidth={1.5} />
      </div>
    </div>

    <h2 className="text-2xl font-display font-extrabold text-neutral-900 dark:text-white mb-3">
      No saved jobs yet
    </h2>
    <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base leading-relaxed max-w-sm mb-8">
      When you find a role you like, click the{' '}
      <span className="inline-flex items-center gap-1 text-red-500 font-semibold">
        <Heart size={13} className="fill-red-500" /> heart icon
      </span>{' '}
      to save it here for quick access later.
    </p>

    {/* Tips row */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 w-full max-w-sm sm:max-w-md">
      {[
        { icon: Search, label: 'Find roles', desc: 'Browse open listings' },
        { icon: Heart, label: 'Save them', desc: 'Tap the heart icon' },
        { icon: Zap, label: 'Apply fast', desc: 'Come back & apply' },
      ].map(({ icon: Icon, label, desc }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700 rounded-2xl p-3"
        >
          <div className="w-8 h-8 rounded-xl bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
            <Icon size={15} className="text-accent-600 dark:text-accent-400" />
          </div>
          <span className="text-xs font-bold text-neutral-900 dark:text-white">{label}</span>
          <span className="text-xs text-neutral-400">{desc}</span>
        </div>
      ))}
    </div>

    <button
      onClick={onBrowse}
      className="group inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 active:scale-95 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
    >
      Browse Open Roles
      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
    </button>
  </motion.div>
);

// ─── Saved Job Card ───────────────────────────────────────────────────────────

const SavedJobCard = ({
  job,
  savedAt,
  onUnsave,
  onView,
  index,
}: {
  job: any;
  savedAt?: string;
  onUnsave: () => void;
  onView: () => void;
  index: number;
}) => {
  const [unsaving, setUnsaving] = useState(false);

  const handleUnsave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setUnsaving(true);
    await onUnsave();
  };

  const currencySymbol = getCurrencySymbol(job.currency);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, y: -10 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
      className="group relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-accent-300 dark:hover:border-accent-700 hover:shadow-elevated transition-all duration-300 cursor-pointer"
      onClick={onView}
    >
      {/* Accent top bar on hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent-400 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-4 sm:p-5">
        {/* Top row: logo + unsave btn */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            {/* Company Logo / Initial */}
            {job.companyLogoUrl ? (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 flex-shrink-0 bg-white">
                <img
                  src={job.companyLogoUrl}
                  alt={job.companyName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center font-bold text-lg text-neutral-900 dark:text-white flex-shrink-0 group-hover:from-accent-500 group-hover:to-accent-700 group-hover:text-white transition-all duration-300">
                {job.companyName?.charAt(0) || 'C'}
              </div>
            )}

            <div className="min-w-0">
              {/* Company name + verified */}
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 truncate">
                  {job.companyName}
                </span>
                {job.companyIsVerified && (
                  <BadgeCheck size={13} className="text-blue-500 flex-shrink-0" />
                )}
              </div>
              {/* Job Title */}
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white leading-snug group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-2">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Unsave button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleUnsave}
            disabled={unsaving}
            className="flex-shrink-0 w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center transition-colors group/btn"
            title="Remove from saved"
          >
            {unsaving ? (
              <div className="w-3.5 h-3.5 border-2 border-red-400/30 border-t-red-500 rounded-full animate-spin" />
            ) : (
              <Heart
                size={15}
                className="fill-red-500 text-red-500 group-hover/btn:scale-110 transition-transform"
              />
            )}
          </motion.button>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {/* Location */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 px-2.5 py-1 rounded-lg border border-neutral-100 dark:border-neutral-700">
            <MapPin size={11} className="text-neutral-400 flex-shrink-0" />
            {job.isRemote ? 'Remote' : job.location || 'On-site'}
          </span>

          {/* Employment type */}
          <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1 rounded-lg border border-purple-100 dark:border-purple-900/30">
            <Briefcase size={11} className="flex-shrink-0" />
            {job.isRemote ? 'Remote' : (job.employment_type || 'Full-time')}
          </span>

          {/* Salary / Commission */}
          {job.salaryRange && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1 rounded-lg border border-green-100 dark:border-green-900/30">
              <Banknote size={11} className="flex-shrink-0" />
              {getCurrencySymbol(job.currency)}{job.salaryRange}
            </span>
          )}
          {job.commissionRange && (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-lg border border-amber-100 dark:border-amber-900/30">
              <TrendingUp size={11} className="flex-shrink-0" />
              OTE {getCurrencySymbol(job.currency)}{job.commissionRange}
            </span>
          )}
        </div>

        {/* Requirements preview */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.requirements.slice(0, 3).map((req: string, i: number) => (
              <span
                key={i}
                className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 px-2 py-0.5 rounded-md border border-neutral-100 dark:border-neutral-700 truncate max-w-[110px]"
              >
                {req}
              </span>
            ))}
            {job.requirements.length > 3 && (
              <span className="text-xs text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 px-2 py-0.5 rounded-md border border-neutral-100 dark:border-neutral-700">
                +{job.requirements.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Bottom row: date + CTA */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1 text-xs text-neutral-400">
            <Clock size={11} />
            <span>Saved · {formatDate(savedAt)}</span>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onView(); }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-700 dark:text-accent-400 hover:text-accent-800 dark:hover:text-accent-300 transition-colors group/btn2"
          >
            View Role
            <ArrowRight size={12} className="group-hover/btn2:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const SavedJobs = () => {
  const { savedJobs, savedJobDates, jobs, toggleSavedJob } = useAppContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const savedJobsList = jobs.filter(job => savedJobs.includes(job.id));

  const filteredList = savedJobsList.filter(job => {
    const q = search.toLowerCase();
    return (
      !q ||
      job.title.toLowerCase().includes(q) ||
      job.companyName?.toLowerCase().includes(q) ||
      job.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen pb-20 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-white dark:via-neutral-900 to-accent-500/10 border border-neutral-100 dark:border-neutral-800 p-6 md:p-8 shadow-sm mb-6 sm:mb-8"
        >
          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-neutral-200/50 dark:border-neutral-700/50">
                  <Bookmark size={12} className="text-red-500" /> Bookmarked Roles
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2 leading-tight">
                Saved Opportunities
              </h1>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm max-w-md mx-auto md:mx-0 mb-5">
                Keep track of roles you're interested in applying for later. Don't wait too long, great opportunities get filled fast!
              </p>
              
              {/* Count badge */}
              {savedJobsList.length > 0 && (
                <div className="inline-flex items-center gap-2 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-800 text-accent-700 dark:text-accent-400 px-4 py-2.5 rounded-xl shadow-sm">
                  <TrendingUp size={16} />
                  <span className="text-sm font-bold">{savedJobsList.length} saved {savedJobsList.length === 1 ? 'role' : 'roles'} in pipeline</span>
                </div>
              )}
            </div>

            <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 mb-4 md:mb-0">
              <img
                src={`${import.meta.env.BASE_URL}images/saved_jobs_illustration.webp`}
                alt="Saved Jobs 3D Illustration"
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </motion.div>

          {/* Search bar — only show when there are saved jobs */}
          {savedJobsList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative mb-6 sm:mb-8"
            >
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by role, company or location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </motion.div>
          )}

        {/* ── Content ── */}
        {savedJobsList.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl sm:rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <EmptyState onBrowse={() => navigate('/jobs')} />
          </div>
        ) : (
          <>
            {/* No search results */}
            <AnimatePresence>
              {filteredList.length === 0 && search && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800"
                >
                  <Search size={36} className="mx-auto text-neutral-300 dark:text-neutral-700 mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium text-sm">No saved jobs match "<span className="font-bold text-neutral-700 dark:text-neutral-300">{search}</span>"</p>
                  <button onClick={() => setSearch('')} className="mt-3 text-xs text-accent-600 dark:text-accent-400 font-bold hover:underline">
                    Clear search
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Cards Grid */}
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            >
              <AnimatePresence>
                {filteredList.map((job, index) => (
                  <SavedJobCard
                    key={job.id}
                    job={job}
                    savedAt={savedJobDates[Number(job.id)]}
                    index={index}
                    onUnsave={() => toggleSavedJob(job.id)}
                    onView={() => navigate(`/jobs/${job.id}`)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* Bottom CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-center"
            >
              <button
                onClick={() => navigate('/jobs')}
                className="group inline-flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              >
                <Search size={15} />
                Discover more roles
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </button>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};
