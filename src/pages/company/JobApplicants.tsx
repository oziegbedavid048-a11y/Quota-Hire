import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Eye, FileText, MapPin, Star, Users, X } from 'lucide-react';
import { apiFetch } from '../../context/AppContext';
import { SkeletonAvatar, SkeletonBox, SkeletonLine } from '../../components/ui/Skeleton';
import { Portal } from '../../components/ui/Portal';
import { CandidateProfile } from '../../components/company/applicants/CandidateProfile';
import { ResumeViewer, StatusConfirmDialog } from '../../components/company/applicants/ApplicantDialogs';
import { useApplicantActions } from '../../components/company/applicants/useApplicantActions';
import { cleanText, experienceText, isPromotedPackage, statusOf } from '../../components/company/applicants/applicantConfig';

type Filter = 'all' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';

const SkeletonApplicantCard = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 flex flex-col gap-3">
    <div className="flex items-center gap-2.5">
      <SkeletonAvatar size={42} />
      <div className="flex-1 flex flex-col gap-1.5">
        <SkeletonLine width="55%" height={15} />
        <SkeletonLine width="35%" height={12} />
      </div>
      <SkeletonBox width={70} height={22} radius={8} />
    </div>
    <div className="flex flex-col gap-1.5">
      <SkeletonLine width="100%" />
      <SkeletonLine width="75%" />
    </div>
    <div className="flex gap-1.5">
      <SkeletonBox width={60} height={20} radius={6} />
      <SkeletonBox width={70} height={20} radius={6} />
    </div>
    <div className="flex gap-2">
      <SkeletonBox width={100} height={32} radius={8} />
      <SkeletonBox width={80} height={32} radius={8} />
    </div>
  </div>
);

/**
 * Reviewing the people who applied to one role, rebuilt to match
 * mobile/src/components/company-applicants.tsx: a banner for the role, filter
 * tabs, a card per candidate, and a slide-up profile where the company
 * shortlists, opens the CV and, on promoted roles, moves the candidate through
 * the evaluation steps.
 *
 * The previous page could only shortlist, one way, and had no route at all to
 * change an applicant's status, so a company hiring from a browser could never
 * progress anybody.
 */
export const JobApplicants = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<any | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const patch = useCallback((appId: number, changes: Record<string, unknown>) => {
    setApplicants(prev => prev.map(a => (a.id === appId ? { ...a, ...changes } : a)));
  }, []);
  const actions = useApplicantActions(patch);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [jobsRes, appsRes] = await Promise.allSettled([
        apiFetch('/company/jobs/'),
        apiFetch(`/company/jobs/${id}/applicants/`),
      ]);
      if (cancelled) return;
      if (jobsRes.status === 'fulfilled') {
        const list = Array.isArray(jobsRes.value) ? jobsRes.value : jobsRes.value?.results || [];
        setJob(list.find((j: any) => String(j.id) === String(id)) || null);
      }
      if (appsRes.status === 'fulfilled') {
        setApplicants(Array.isArray(appsRes.value) ? appsRes.value : appsRes.value?.results || []);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Close the profile with Escape, and keep the page behind it from scrolling.
  useEffect(() => {
    if (selectedId === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedId(null); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [selectedId]);

  const isPromoted = isPromotedPackage(job?.package) || applicants.some(a => isPromotedPackage(a.job_package));
  const selected = applicants.find(a => a.id === selectedId) || null;

  // The list response is enough to open a profile at once; the detail call
  // then refreshes it with the full, unmasked record.
  const openCandidate = async (candidate: any) => {
    setSelectedId(candidate.id);
    try {
      const detailed = await apiFetch(`/company/applications/${candidate.id}/`);
      if (detailed?.id === candidate.id) patch(candidate.id, detailed);
    } catch { /* keep the list copy */ }
  };

  const counts = useMemo(() => ({
    all: applicants.length,
    shortlisted: applicants.filter(a => a.is_shortlisted).length,
    interview: applicants.filter(a => a.status === 'interview').length,
    accepted: applicants.filter(a => a.status === 'accepted').length,
  }), [applicants]);

  const tabs: { key: Filter; label: string }[] = isPromoted
    ? [
        { key: 'all', label: `All (${counts.all})` },
        { key: 'shortlisted', label: `Shortlisted (${counts.shortlisted})` },
        { key: 'interview', label: `Interview (${counts.interview})` },
        { key: 'accepted', label: `Hired (${counts.accepted})` },
      ]
    : [
        { key: 'all', label: `All (${counts.all})` },
        { key: 'shortlisted', label: `Shortlisted (${counts.shortlisted})` },
      ];

  const filtered = applicants.filter(a => {
    if (activeFilter === 'shortlisted') return a.is_shortlisted;
    if (activeFilter === 'interview') return a.status === 'interview';
    if (activeFilter === 'accepted') return a.status === 'accepted';
    if (activeFilter === 'rejected') return a.status === 'rejected';
    return true;
  });

  const companyName = job?.company_name || job?.custom_company_name || 'Company';
  const location = job?.is_remote ? 'Remote' : job?.location || 'Hybrid';

  return (
    <div className="min-h-full py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate('/company/jobs')}
          className="mb-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={15} /> Back to My Jobs
        </button>

        {/* ── Role banner ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 mb-2 bg-gradient-to-br from-[#FCEFCF] to-[#E1F6DD] dark:from-amber-950/30 dark:to-emerald-950/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center p-[3px] shrink-0">
              {job?.company_logo_url ? (
                <img src={job.company_logo_url} alt={companyName} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xl font-extrabold text-slate-800">{(companyName || job?.title || 'Q').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {loading && !job ? (
                <div className="flex flex-col gap-1.5">
                  <SkeletonLine width="45%" height={15} />
                  <SkeletonLine width="30%" height={11} />
                </div>
              ) : (
                <>
                  <h1 className="text-[15px] font-extrabold text-slate-900 dark:text-white truncate">{job?.title || 'Job Listing'}</h1>
                  <div className="flex items-center gap-1.5 mt-1 min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-neutral-400 truncate">{companyName}</span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <MapPin size={11} className="text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-400 truncate">{location}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Filter tabs ── */}
        <div className="flex bg-white dark:bg-neutral-900 border-b border-slate-100 dark:border-neutral-800 rounded-xl p-[3px] mt-1 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key)}
              className={`flex-1 py-2 rounded-[9px] text-[11px] font-bold transition-colors ${
                activeFilter === tab.key ? 'bg-accent-500 text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-neutral-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Candidates ── */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {[1, 2, 3].map(k => <SkeletonApplicantCard key={k} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center gap-2.5 px-8 py-12 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <span className="w-[60px] h-[60px] rounded-full bg-slate-100 dark:bg-neutral-800 flex items-center justify-center">
              <Users size={32} className="text-slate-400" />
            </span>
            <p className="text-[15px] font-extrabold text-slate-900 dark:text-white">No applicants found</p>
            <p className="text-[11px] text-slate-400 leading-[18px] max-w-xs">
              {activeFilter === 'all'
                ? `No candidates have applied to "${job?.title || 'this role'}" yet.`
                : `No candidates matching the "${activeFilter}" filter.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filtered.map((app, index) => {
              const s = statusOf(app.status);
              const bio = isPromoted ? app.employee_profile?.bio || '' : cleanText(app.employee_profile?.bio || '');
              const skills: string[] = app.employee_profile?.skills || [];
              const place = app.applicant_location || app.employee_profile?.city;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.05 }}
                  onClick={() => openCandidate(app)}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-slate-200 dark:border-neutral-800 p-4 flex flex-col gap-2.5 cursor-pointer hover:border-accent-300 dark:hover:border-accent-800 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-11 h-11 rounded-full overflow-hidden bg-accent-50 flex items-center justify-center shrink-0">
                      {app.avatar_url ? (
                        <img src={app.avatar_url} alt={app.employee_name} loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[15px] font-extrabold text-accent-700">{(app.employee_name || 'C').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p className="text-[13px] font-extrabold text-slate-900 dark:text-white truncate">{app.employee_name}</p>
                        {app.is_shortlisted && <Star size={13} className="text-amber-500 fill-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-neutral-400 truncate">
                        {app.employee_profile?.title || 'Applicant'} • {experienceText(app)}
                      </p>
                    </div>
                    {isPromoted && (
                      <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-bold ${s.pill} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    )}
                  </div>

                  {(place || (isPromoted && app.has_resume)) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {place && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-neutral-800 px-2 py-[3.5px] rounded-md max-w-full">
                          <MapPin size={10.5} className="text-slate-400 shrink-0" />
                          <span className="text-[10.5px] font-semibold text-slate-500 dark:text-neutral-400 truncate">{place}</span>
                        </span>
                      )}
                      {isPromoted && app.has_resume && (
                        <span className="inline-flex items-center gap-1 bg-accent-50 border border-accent-200 px-[7px] py-[3px] rounded-md">
                          <FileText size={10.5} className="text-accent-600" />
                          <span className="text-[10px] font-bold text-accent-700">CV on file</span>
                        </span>
                      )}
                    </div>
                  )}

                  <p className="text-[11px] leading-4 text-slate-500 dark:text-neutral-400 line-clamp-2">
                    {bio || 'No summary provided.'}
                  </p>

                  {skills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {skills.slice(0, 3).map(skill => (
                        <span key={skill} className="bg-slate-50 dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 px-2 py-[3px] rounded-md text-[9px] font-bold text-slate-600 dark:text-neutral-300">
                          {skill}
                        </span>
                      ))}
                      {skills.length > 3 && <span className="text-[10px] font-bold text-slate-400">+{skills.length - 3}</span>}
                    </div>
                  )}

                  <div className="h-px bg-slate-100 dark:bg-neutral-800 mt-auto" />

                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); openCandidate(app); }}
                    className="flex items-center justify-between bg-accent-500 hover:bg-accent-600 rounded-xl py-2.5 px-3.5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                        <Eye size={13} className="text-white" />
                      </span>
                      <span className="text-[11px] font-bold tracking-[0.15px] text-white">View Details</span>
                    </span>
                    <ChevronRight size={15} className="text-white/75" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Candidate profile sheet ── */}
      <Portal>
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50"
              onClick={() => setSelectedId(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="candidate-sheet-title"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="relative w-full sm:max-w-lg bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
                <h2 id="candidate-sheet-title" className="text-[15px] font-extrabold text-slate-900 dark:text-white">Candidate Profile</h2>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="overflow-y-auto px-5 pt-5 pb-9">
                <CandidateProfile
                  candidate={selected}
                  isPromoted={isPromoted || isPromotedPackage(selected.job_package)}
                  onToggleShortlist={() => actions.toggleShortlist(selected)}
                  onRequestStatus={status => actions.requestStatus(selected, status)}
                  updatingStatus={actions.updatingStatus}
                  onOpenResume={() => actions.openResume(selected)}
                  loadingResume={actions.loadingResume}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </Portal>

      <StatusConfirmDialog
        copy={actions.pendingCopy}
        busy={actions.updatingStatus}
        onCancel={actions.cancelStatus}
        onConfirm={actions.confirmStatus}
      />
      <ResumeViewer url={actions.resumeUrl} name={selected?.employee_name} onClose={actions.closeResume} />
    </div>
  );
};
