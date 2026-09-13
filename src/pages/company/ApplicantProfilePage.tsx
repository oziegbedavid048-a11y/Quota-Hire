import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '../../context/AppContext';
import { SkeletonAvatar, SkeletonBox, SkeletonLine } from '../../components/ui/Skeleton';
import { CandidateProfile } from '../../components/company/applicants/CandidateProfile';
import { ResumeViewer, StatusConfirmDialog } from '../../components/company/applicants/ApplicantDialogs';
import { useApplicantActions } from '../../components/company/applicants/useApplicantActions';
import { isPromotedPackage } from '../../components/company/applicants/applicantConfig';

/**
 * A single candidate at their own address, for anyone who reaches one
 * directly. It shows exactly the profile the applicants page opens in its
 * sheet, with the same shortlist, CV and status actions, so the two can never
 * disagree about what a company is allowed to do.
 */
export const ApplicantProfilePage = () => {
  const { jobId, appId } = useParams<{ jobId: string; appId: string }>();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const patch = useCallback((id: number, changes: Record<string, unknown>) => {
    setApplicant((prev: any) => (prev && prev.id === id ? { ...prev, ...changes } : prev));
  }, []);
  const actions = useApplicantActions(patch);

  useEffect(() => {
    if (!appId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiFetch(`/company/applications/${appId}/`);
        if (!cancelled) setApplicant(data);
      } catch {
        if (!cancelled) {
          toast.error('Failed to load applicant details.');
          navigate(`/company/jobs/${jobId}/applicants`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [appId, jobId, navigate]);

  return (
    <div className="min-h-full py-4 sm:py-6 px-3 sm:px-4">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate(`/company/jobs/${jobId}/applicants`)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={15} /> Back to Applicants
        </button>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-slate-200 dark:border-neutral-800 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-neutral-800">
            <h1 className="text-[15px] font-extrabold text-slate-900 dark:text-white">Candidate Profile</h1>
          </div>
          <div className="px-5 pt-5 pb-8">
            {loading || !applicant ? (
              <div className="flex flex-col items-center gap-2 pb-5">
                <SkeletonAvatar size={80} />
                <SkeletonLine width={160} height={16} />
                <SkeletonLine width={110} height={12} />
                <div className="w-full mt-4 flex flex-col gap-3">
                  <SkeletonBox height={120} radius={16} />
                  <SkeletonBox height={64} radius={16} />
                  <SkeletonBox height={90} radius={16} />
                </div>
              </div>
            ) : (
              <CandidateProfile
                candidate={applicant}
                isPromoted={isPromotedPackage(applicant.job_package)}
                onToggleShortlist={() => actions.toggleShortlist(applicant)}
                onRequestStatus={status => actions.requestStatus(applicant, status)}
                updatingStatus={actions.updatingStatus}
                onOpenResume={() => actions.openResume(applicant)}
                loadingResume={actions.loadingResume}
              />
            )}
          </div>
        </div>
      </div>

      <StatusConfirmDialog
        copy={actions.pendingCopy}
        busy={actions.updatingStatus}
        onCancel={actions.cancelStatus}
        onConfirm={actions.confirmStatus}
      />
      <ResumeViewer url={actions.resumeUrl} name={applicant?.employee_name} onClose={actions.closeResume} />
    </div>
  );
};
