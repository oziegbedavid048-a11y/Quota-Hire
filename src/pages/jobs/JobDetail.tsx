import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Banknote, Briefcase, CheckCircle2,
  BadgeCheck, Globe, TrendingUp,
  Bookmark, BookmarkCheck, Flag, Send,
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';
import { calculateProfileStrength } from '../../utils/profile';
import { EmployeeProfile } from '../../types';

export const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { jobs, currentUser, applications, toggleSavedJob } = useAppContext();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAppliedLocal, setHasAppliedLocal] = useState(false);

  const job = jobs.find((j) => String(j.id) === String(id));

  // Sync saved state from current user's saved jobs
  useEffect(() => {
    if (currentUser && id) {
      setIsSaved(currentUser.savedJobs?.map(String).includes(String(id)) ?? false);
    }
  }, [currentUser, id]);

  // Sync applied state
  useEffect(() => {
    if (job && currentUser) {
      const applied = applications.some(
        (a) => String(a.job) === String(job.id) && String(a.employee) === String(currentUser.id)
      );
      setHasAppliedLocal(applied);
    }
  }, [applications, job, currentUser]);

  if (!job) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-[24px] flex items-center justify-center mx-auto mb-6">
            <Briefcase size={32} className="text-neutral-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">Job not found</h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-sm mx-auto text-sm">
            This position may have been closed or removed.
          </p>
          <button
            onClick={() => navigate('/jobs')}
            className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-6 py-3 rounded-xl font-bold text-sm hover:-translate-y-0.5 transition-all shadow-md"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const isEmployee = currentUser?.role === 'employee';

  const handleSaveJob = async () => {
    if (!currentUser) {
      toast('Please sign in to save jobs', { icon: '🔒' });
      navigate('/login');
      return;
    }
    setIsSaving(true);
    try {
      await toggleSavedJob(job.id);
      // isSaved is naturally synced via the useEffect observing currentUser.savedJobs
    } catch {
      // error toast handled in toggleSavedJob
    } finally {
      setIsSaving(false);
    }
  };

  const handleReportJob = () => {
    toast.success('Job reported. Our team will review it shortly. Thank you!');
  };



  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] pb-56 sm:pb-28">

      {/* ── TOP NAV ── */}
      <div className="bg-white/90 dark:bg-[#0a0a0a]/90 border-b border-neutral-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back to Roles</span>
          </button>
        </div>
      </div>

      {/* ── HERO HEADER ── */}
      <div className="relative overflow-hidden bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 via-transparent to-warm-500/5 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-400/8 dark:bg-accent-400/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Company row */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
              {job.companyLogoUrl ? (
                <img src={job.companyLogoUrl} alt={job.companyName || 'Company'} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-neutral-400 dark:text-neutral-500">
                  {job.companyName?.charAt(0) || 'C'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-extrabold text-neutral-900 dark:text-white text-sm sm:text-base">
                  {job.companyName || 'Company'}
                </p>
                {job.companyIsVerified && <BadgeCheck size={16} className="text-blue-500 shrink-0" />}
              </div>
              <p className="text-xs text-neutral-500 font-semibold mt-0.5">Hiring Company</p>
            </div>
          </div>

          {/* Job Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-extrabold text-neutral-900 dark:text-white leading-tight mb-5">
            {job.title}
          </h1>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {job.location && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm font-bold rounded-xl">
                <MapPin size={13} className="text-neutral-400 shrink-0" /> {job.location}
              </span>
            )}
            {job.isRemote ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400">
                <Globe size={13} className="shrink-0" /> Remote
              </span>
            ) : job.employment_type ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                <Briefcase size={13} className="shrink-0" /> {job.employment_type}
              </span>
            ) : null}
            {job.salaryRange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs sm:text-sm font-bold rounded-xl">
                <Banknote size={13} className="shrink-0" /> {job.currency || 'USD'} {job.salaryRange}
              </span>
            )}
            {job.commissionRange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-bold rounded-xl">
                <TrendingUp size={13} className="shrink-0" /> OTE {job.currency || 'USD'} {job.commissionRange}
              </span>
            )}
            {!job.salaryRange && !job.commissionRange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs sm:text-sm font-bold rounded-xl">
                <Banknote size={13} className="shrink-0" /> Competitive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* ── LEFT COLUMN ── */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white mb-5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                About the Role
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line text-sm sm:text-[15px]">
                {job.description}
              </p>
            </section>

            {job.requirements && job.requirements.length > 0 && (
              <section>
                <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white mb-5 pb-3 border-b border-neutral-100 dark:border-neutral-800">
                  Key Requirements
                </h2>
                <div className="space-y-3">
                  {job.requirements.map((req: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                      <div className="bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 p-1 rounded-full shrink-0 mt-0.5">
                        <CheckCircle2 size={14} />
                      </div>
                      <p className="text-neutral-700 dark:text-neutral-300 text-sm sm:text-[15px] font-medium leading-relaxed">{req}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5 lg:space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-sm">
              <h3 className="font-extrabold text-neutral-900 dark:text-white mb-5 flex items-center gap-2 text-sm sm:text-base">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Banknote size={16} className="text-green-600 dark:text-green-400" />
                </div>
                Compensation
              </h3>
              <div className="space-y-4">
                {job.salaryRange ? (
                  <div>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Base Salary</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-black text-neutral-400">{job.currency || 'USD'}</span>
                      <p className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">{job.salaryRange}</p>
                    </div>
                  </div>
                ) : null}
                {job.commissionRange ? (
                  <div className={job.salaryRange ? 'pt-4 border-t border-neutral-100 dark:border-neutral-800' : ''}>
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1.5">OTE / Commission</p>
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-amber-500" />
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-black text-neutral-400">{job.currency || 'USD'}</span>
                        <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{job.commissionRange}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {!job.salaryRange && !job.commissionRange && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Competitive salary — details discussed during interview.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── BOTTOM ACTION BAR ── */}
      <div className="fixed bottom-0 left-0 md:left-[260px] right-0 z-40 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center">

          {/* Apply Button Area - Top on mobile, Right on desktop */}
          <div className="order-1 sm:order-4 sm:ml-auto w-full sm:w-auto flex flex-col">
            {!currentUser ? (
              <button
                onClick={() => navigate('/signup?role=employee')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 active:scale-95 text-white px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-accent-500/25 transition-all duration-200"
              >
                <Send size={17} />
                Sign up to Apply
              </button>
            ) : isEmployee ? (
              hasAppliedLocal ? (
                <div className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm border-2 border-emerald-200 dark:border-emerald-800 cursor-default">
                  <CheckCircle2 size={17} />
                  <span>Already Applied</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    const score = calculateProfileStrength(currentUser as EmployeeProfile);
                    if (score < 100) {
                      toast.custom((t) => (
                        <div className="bg-white dark:bg-neutral-900 border border-amber-200 dark:border-amber-800 rounded-xl p-4 shadow-xl flex items-start gap-3 w-[320px]">
                           <div className="text-amber-500 mt-0.5 text-xl">⚠️</div>
                           <div className="flex-1">
                             <p className="font-bold text-sm text-neutral-900 dark:text-white mb-1">Incomplete Profile</p>
                             <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3 leading-relaxed">Your profile is missing details. Please complete your profile and resume details before applying to jobs to ensure accurate employer matching.</p>
                             <div className="flex gap-2">
                               <button 
                                 onClick={() => { toast.dismiss(t); navigate('/employee/profile'); }} 
                                 className="w-full text-xs font-bold text-accent-600 hover:text-accent-700 bg-accent-50 dark:bg-accent-900/30 px-3 py-2 rounded-lg transition-colors text-center"
                               >
                                 Complete Profile Now
                               </button>
                             </div>
                           </div>
                        </div>
                      ), { duration: 8000 });
                    } else {
                      navigate(`/jobs/${job.id}/apply`);
                    }
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 active:scale-95 text-white px-6 sm:px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-accent-500/25 transition-all duration-200"
                >
                  <Send size={17} />
                  Apply for this Role
                </button>
              )
            ) : (
              <div className="w-full sm:w-auto flex items-center justify-center px-4 py-3 text-sm text-neutral-400 font-medium">
                Login as an employee to apply
              </div>
            )}
          </div>

          <div className="hidden sm:block flex-1 order-3" />

          {/* Save Job Button */}
          <button
            onClick={handleSaveJob}
            disabled={isSaving}
            className={`order-2 sm:order-1 w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm border-2 transition-all duration-200 disabled:opacity-60 ${
              isSaved
                ? 'bg-accent-50 dark:bg-accent-900/30 border-accent-400 dark:border-accent-600 text-accent-700 dark:text-accent-400'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-accent-400 hover:text-accent-600'
            }`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck size={18} />
            ) : (
              <Bookmark size={18} />
            )}
            <span>{isSaved ? 'Saved' : 'Save Job'}</span>
          </button>

          {/* Report Button */}
          <button
            onClick={handleReportJob}
            className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-bold text-sm border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition-all duration-200"
          >
            <Flag size={18} />
            <span>Report</span>
          </button>

        </div>
      </div>


    </div>
  );
};