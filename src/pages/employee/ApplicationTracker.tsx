import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import { Building2, Calendar, MapPin, ChevronDown, Search, Filter, Inbox, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ApplicationStatus } from '../../types';
import { Link } from 'react-router-dom';

const statusConfig: Record<ApplicationStatus, { label: string; dotColor: string; chipClass: string }> = {
  pending:      { label: 'Applied',          dotColor: 'bg-neutral-400',   chipClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' },
  under_review: { label: 'Under Review',     dotColor: 'bg-amber-500',     chipClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
  interview:    { label: 'Interview',        dotColor: 'bg-purple-500',    chipClass: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' },
  decision:     { label: 'Decision Pending', dotColor: 'bg-blue-500',      chipClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
  accepted:     { label: 'Offer Received',   dotColor: 'bg-emerald-500',   chipClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
  rejected:     { label: 'Not Selected',     dotColor: 'bg-red-400',       chipClass: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
};

const ALL_STATUSES: ApplicationStatus[] = ['pending', 'under_review', 'interview', 'decision', 'accepted', 'rejected'];

export const ApplicationTracker = () => {
  const { applications, jobs } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ApplicationStatus | 'all'>('all');

  const filtered = applications.filter(app => {
    const matchesSearch =
      app.job_title.toLowerCase().includes(search.toLowerCase()) ||
      app.company_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalByStatus = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = applications.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<ApplicationStatus, number>);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/10 via-white dark:via-neutral-900 to-warm-500/10 border border-neutral-100 dark:border-neutral-800 p-5 sm:p-6 md:p-8 shadow-sm mb-6 sm:mb-8 md:mb-10 flex flex-col-reverse sm:flex-row items-center gap-4 sm:gap-6"
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-warm-500/10 dark:bg-warm-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex-1 relative z-10 text-center sm:text-left w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-2 leading-tight">
            Application <span className="text-accent-600 dark:text-accent-400">Tracker</span>
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm max-w-sm mx-auto sm:mx-0">
            Track every step of your job search — from applied to offer.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-3 mt-4 sm:mt-5">
            {[
              { label: 'Total',        count: applications.length,         bg: 'bg-white/60 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700' },
              { label: 'Reviewing',    count: totalByStatus.under_review,  bg: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30' },
              { label: 'Interviews',   count: totalByStatus.interview,     bg: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30' },
              { label: 'Offers',       count: totalByStatus.accepted,      bg: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl px-2 py-2 sm:px-4 sm:py-2.5 text-center sm:min-w-[80px]`}>
                <div className="text-lg sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-none">{stat.count}</div>
                <div className="text-[9px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 font-semibold mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration — smaller on mobile */}
        <div className="w-28 h-28 sm:w-40 sm:h-40 md:w-52 md:h-52 shrink-0 relative z-10">
          <img
            src="/images/tracker_illustration.png"
            alt="Application Tracker Illustration"
            className="w-full h-full object-contain drop-shadow-xl"
          />
        </div>
      </motion.div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6"
      >
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search job or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full input-soft pl-9 text-sm h-11"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ApplicationStatus | 'all')}
            className="w-full sm:w-auto input-soft pl-9 pr-8 text-sm appearance-none cursor-pointer h-11"
          >
            <option value="all">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{statusConfig[s].label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        </div>
      </motion.div>

      {/* ── Content ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card-soft overflow-hidden"
      >
        {filtered.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center px-6">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
              <Inbox size={24} className="text-neutral-400" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-1">No Applications Found</h3>
            <p className="text-neutral-500 text-sm max-w-xs mb-5">
              {applications.length === 0
                ? "You haven't applied to any jobs yet."
                : "No applications match your current filter."}
            </p>
            {applications.length === 0 && (
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-600 text-white font-bold text-sm hover:bg-accent-700 transition-colors"
              >
                <Briefcase size={16} /> Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ─ Desktop / Tablet Table (sm+) ─ */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <th className="text-left px-5 py-3.5 font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[11px] tracking-wider">Position</th>
                    <th className="text-left px-5 py-3.5 font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[11px] tracking-wider hidden md:table-cell">Company</th>
                    <th className="text-left px-5 py-3.5 font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[11px] tracking-wider hidden lg:table-cell">Location</th>
                    <th className="text-left px-5 py-3.5 font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[11px] tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 font-bold text-neutral-500 dark:text-neutral-400 uppercase text-[11px] tracking-wider hidden lg:table-cell">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filtered.map((app, i) => {
                    const job = jobs.find(j => j.id === app.job);
                    const cfg = statusConfig[app.status as ApplicationStatus] || statusConfig.pending;
                    return (
                      <motion.tr
                        key={app.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-neutral-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors line-clamp-1 text-sm">
                            {app.job_title}
                          </div>
                          <div className="flex items-center gap-1 text-neutral-500 text-xs mt-0.5 md:hidden">
                            <Building2 size={10} />{app.company_name}
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 text-sm">
                            <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                              <Building2 size={13} className="text-neutral-400" />
                            </div>
                            <span className="line-clamp-1">{app.company_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-sm">
                            <MapPin size={12} className="shrink-0" />
                            <span className="line-clamp-1">
                              {job ? (job.isRemote ? 'Remote' : (job.location || '—')) : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${cfg.chipClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} shrink-0`} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-xs">
                            <Calendar size={11} />
                            {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ─ Mobile Card List (xs only) ─ */}
            <div className="sm:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
              {filtered.map((app, i) => {
                const job = jobs.find(j => j.id === app.job);
                const cfg = statusConfig[app.status as ApplicationStatus] || statusConfig.pending;
                return (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors"
                  >
                    {/* Top row: title + status */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-bold text-neutral-900 dark:text-white text-sm leading-snug flex-1 line-clamp-2">
                        {app.job_title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shrink-0 ${cfg.chipClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <Building2 size={11} />
                        {app.company_name}
                      </span>
                      {job && (
                        <span className="flex items-center gap-1">
                          <MapPin size={11} />
                          {job.isRemote ? 'Remote' : (job.location || '—')}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDistanceToNow(new Date(app.applied_at), { addSuffix: true })}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-neutral-400 text-center mt-4">
          Showing {filtered.length} of {applications.length} application{applications.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};
