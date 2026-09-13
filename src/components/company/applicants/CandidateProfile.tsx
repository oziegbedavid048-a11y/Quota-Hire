import {
  Briefcase, ChevronRight, ExternalLink, Eye, FileText, Layers, Loader2, Mail,
  MapPin, MessageCircle, Phone, PhoneCall, Shield, Star, UserCheck,
} from 'lucide-react';
import { EVALUATION_ACTIONS, cleanText, experienceText, statusOf } from './applicantConfig';

/** lucide-react 1.x dropped brand icons, so the LinkedIn mark is drawn here. */
const LinkedinMark = ({ size = 14, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 0 0-1.62 1.62 1.62 1.62 0 0 0 1.62 1.62 1.62 1.62 0 0 0 1.62-1.62c0-.9-.73-1.62-1.62-1.62Z" />
  </svg>
);

const contactBtn =
  'shrink-0 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800 text-[11px] font-bold text-accent-700 dark:text-accent-400 hover:bg-slate-100 dark:hover:bg-neutral-700 transition-colors';

interface Props {
  candidate: any;
  isPromoted: boolean;
  onToggleShortlist: () => void;
  onRequestStatus: (status: string) => void;
  updatingStatus: boolean;
  onOpenResume: () => void;
  loadingResume: boolean;
}

/**
 * Everything the app's "Candidate Profile" sheet shows, in the same order:
 * overview, contact card or agency notice, CV, skills, education, cover
 * letter, shortlist, and on promoted roles the evaluation pipeline.
 */
export const CandidateProfile = ({
  candidate: c,
  isPromoted,
  onToggleShortlist,
  onRequestStatus,
  updatingStatus,
  onOpenResume,
  loadingResume,
}: Props) => {
  const status = statusOf(c.status);
  const profile = c.employee_profile || {};
  const skills: string[] = profile.skills || [];
  const phone: string | undefined = c.applicant_phone;

  return (
    <div className="flex flex-col">
      {/* ── Overview ── */}
      <div className="flex flex-col items-center text-center gap-1 pb-5">
        <div className="w-20 h-20 rounded-full overflow-hidden mb-2 bg-accent-50 flex items-center justify-center ring-4 ring-white dark:ring-neutral-900 shadow-sm">
          {c.avatar_url ? (
            <img src={c.avatar_url} alt={c.employee_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-extrabold text-accent-700">{(c.employee_name || 'C').charAt(0).toUpperCase()}</span>
          )}
        </div>
        <h3 className="text-[17px] font-extrabold text-slate-900 dark:text-white">{c.employee_name}</h3>
        <p className="text-[13px] font-medium text-slate-500 dark:text-neutral-400">{profile.title || 'Applicant'}</p>
        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
          {isPromoted && c.status && c.status !== 'pending' && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-bold ${status.pill} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-accent-50 text-accent-700 text-[10px] font-extrabold">
            <Briefcase size={11} className="text-accent-600" />
            {experienceText(c)}
          </span>
        </div>
      </div>

      {/* ── Contact card (promoted) or agency notice ── */}
      {isPromoted ? (
        <div className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-2xl p-4 mb-3.5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UserCheck size={14} className="text-emerald-700" />
            <span className="text-[11px] font-extrabold tracking-wide text-slate-900 dark:text-white">Applicant Contact Information</span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center shrink-0"><Mail size={14} className="text-accent-600" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase text-slate-400">Email Address</p>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 mt-px break-all">
                {c.applicant_email || profile.contact_email || 'Not provided'}
              </p>
            </div>
            {c.applicant_email && (
              <a href={`mailto:${c.applicant_email}`} className={contactBtn}>Send Email</a>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center shrink-0"><Phone size={14} className="text-accent-600" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase text-slate-400">Phone Number</p>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 mt-px">
                {phone || profile.phone_number || 'Not provided'}
              </p>
            </div>
            {phone && (
              <div className="flex gap-1.5">
                <a href={`tel:${phone}`} className={contactBtn} aria-label="Call applicant"><PhoneCall size={12} /></a>
                <a
                  href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                  aria-label="Message applicant on WhatsApp"
                >
                  <MessageCircle size={12} />
                </a>
              </div>
            )}
          </div>

          {(c.applicant_location || c.applicant_address) && (
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center shrink-0"><MapPin size={14} className="text-accent-600" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-slate-400">Location & Address</p>
                <p className="text-[11px] font-semibold text-slate-800 dark:text-neutral-200 mt-px">
                  {[c.applicant_address, c.applicant_location].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
          )}

          {c.applicant_linkedin && (
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center shrink-0"><LinkedinMark size={14} className="text-blue-600" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase text-slate-400">LinkedIn Profile</p>
                <p className="text-[11px] font-semibold text-blue-600 mt-px truncate">{c.applicant_linkedin}</p>
              </div>
              <a href={c.applicant_linkedin} target="_blank" rel="noopener noreferrer" className={contactBtn} aria-label="Open LinkedIn profile">
                <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 rounded-[14px] p-3.5 mb-3.5">
          <Shield size={16} className="text-blue-600 shrink-0" />
          <div className="flex-1">
            <p className="text-[11px] font-bold text-blue-700">Agency Recruitment Package</p>
            <p className="text-[11px] text-blue-600 leading-[15px] mt-0.5">
              Direct contact information and resumes are managed by Quotahire. Shortlist candidates to notify your account manager.
            </p>
          </div>
        </div>
      )}

      {/* ── CV (promoted) ── */}
      {isPromoted && (
        <div className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0"><FileText size={20} className="text-emerald-700" /></span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-emerald-800">Candidate Resume / CV</p>
              <p className="text-[10px] text-emerald-600 mt-px">Original application document</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenResume}
            disabled={loadingResume}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors disabled:opacity-80"
          >
            {loadingResume ? <Loader2 size={14} className="animate-spin" /> : <><Eye size={14} /> View CV</>}
          </button>
        </div>
      )}

      {/* ── Skills ── */}
      {skills.length > 0 && (
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-300 dark:border-neutral-700 rounded-2xl p-4 mb-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Skills & Expertise</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {skills.map(skill => (
              <span key={skill} className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 px-3 py-1.5 rounded-[10px] text-[11px] font-semibold text-slate-700 dark:text-neutral-300">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ── */}
      {profile.education && (
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-300 dark:border-neutral-700 rounded-2xl p-4 mb-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Education</p>
          <p className="text-[11px] text-slate-700 dark:text-neutral-300 leading-[18px] whitespace-pre-wrap">{profile.education}</p>
        </div>
      )}

      {/* ── Cover letter ── */}
      {c.cover_letter && (
        <div className="bg-slate-50 dark:bg-neutral-800/60 border border-slate-300 dark:border-neutral-700 rounded-2xl p-4 mb-3 flex flex-col gap-1.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Cover Letter</p>
          <p className="text-[11px] text-slate-700 dark:text-neutral-300 leading-[18px] whitespace-pre-wrap">
            {isPromoted ? c.cover_letter : cleanText(c.cover_letter)}
          </p>
        </div>
      )}

      {/* ── Shortlist ── */}
      <div className={`flex items-center justify-between gap-3 rounded-[14px] p-3.5 mb-3.5 border ${
        c.is_shortlisted ? 'bg-amber-50 border-amber-200' : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-neutral-700'
      }`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Star size={15} className={c.is_shortlisted ? 'text-amber-500 fill-amber-500' : 'text-slate-600'} />
            <p className={`text-[11px] font-bold ${c.is_shortlisted ? 'text-amber-700' : 'text-slate-800 dark:text-neutral-200'}`}>
              {c.is_shortlisted ? 'Candidate Shortlisted' : 'Shortlist Candidate'}
            </p>
          </div>
          <p className={`text-[10.5px] mt-px ${c.is_shortlisted ? 'text-amber-700' : 'text-slate-500'}`}>
            {c.is_shortlisted ? 'Bookmarked in your Shortlisted filter tab' : 'Bookmark to quickly access in the Shortlisted tab'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleShortlist}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-[7px] rounded-lg text-[11px] font-bold transition-colors ${
            c.is_shortlisted
              ? 'bg-amber-100 border border-amber-500 text-amber-700 hover:bg-amber-200'
              : 'bg-accent-500 hover:bg-accent-600 text-white'
          }`}
        >
          <Star size={13} className={c.is_shortlisted ? 'text-amber-700' : 'text-white'} />
          {c.is_shortlisted ? 'Remove' : 'Shortlist'}
        </button>
      </div>

      {/* ── Evaluation & status (promoted) ── */}
      {isPromoted && (
        <div className="bg-white dark:bg-neutral-900 border border-slate-300 dark:border-neutral-700 rounded-2xl p-4 mb-2 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Layers size={15} className="text-accent-600" />
              <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Candidate Evaluation & Status</p>
            </div>
            <span className="bg-slate-100 dark:bg-neutral-800 px-2 py-[3px] rounded-md text-[9.5px] font-bold text-slate-600 dark:text-neutral-300">
              Current: {status.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-4">
            Updating candidate status automatically sends an email notification directly to the applicant.
          </p>
          <div className="flex flex-col gap-2 mt-1">
            {EVALUATION_ACTIONS.map(action => {
              const active = c.status === action.status;
              return (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => onRequestStatus(action.status)}
                  disabled={updatingStatus}
                  className="flex items-center justify-between gap-2 rounded-xl py-2.5 px-3 text-left transition-opacity disabled:opacity-75 hover:opacity-90"
                  style={
                    active
                      ? { backgroundColor: action.activeBg, border: `1.5px solid ${action.activeBorder}` }
                      : { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }
                  }
                >
                  <span className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: active ? '#ffffff' : '#f1f5f9', border: active ? `1px solid ${action.activeBorder}` : undefined }}
                    >
                      <action.Icon size={15} style={{ color: action.color }} />
                    </span>
                    <span
                      className="text-[11px] truncate"
                      style={{ color: active ? action.color : '#1e293b', fontWeight: active ? 800 : 700 }}
                    >
                      {action.label}
                    </span>
                  </span>
                  {active ? (
                    <span className="px-2 py-[3px] rounded-full text-[9.5px] font-extrabold uppercase tracking-wide text-white" style={{ backgroundColor: action.color }}>
                      Active
                    </span>
                  ) : (
                    <ChevronRight size={16} className="text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
