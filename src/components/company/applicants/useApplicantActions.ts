import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { apiFetch } from '../../../context/AppContext';
import { EVALUATION_ACTIONS, statusOf } from './applicantConfig';

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

/**
 * The three things a company does to a candidate, with the same behaviour as
 * the app: shortlist or un-shortlist, move them through the evaluation steps
 * behind a confirmation, and open their CV.
 *
 * `patch` is how the caller keeps its own copy of the candidate in step, so a
 * change made in the profile shows on the list card behind it immediately.
 */
export const useApplicantActions = (patch: (appId: number, changes: Record<string, unknown>) => void) => {
  const [pendingStatus, setPendingStatus] = useState<{ candidate: any; status: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);

  const toggleShortlist = useCallback(async (candidate: any) => {
    const appId = candidate.id;
    const on = !candidate.is_shortlisted;
    try {
      await apiFetch(`/company/applications/${appId}/shortlist/`, { method: on ? 'POST' : 'DELETE' });
      patch(appId, { is_shortlisted: on });
      toast.success(on ? 'Applicant added to shortlist.' : 'Applicant removed from shortlist.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update shortlist state.');
    }
  }, [patch]);

  /** Opens the confirmation. Nothing is sent until it is confirmed. */
  const requestStatus = useCallback((candidate: any, status: string) => {
    const action = EVALUATION_ACTIONS.find(a => a.status === status);
    const name = candidate?.employee_name || 'This applicant';
    if ((candidate?.status || 'pending') === status) {
      toast.info(`${name} is already marked as "${action?.shortLabel || status}".`);
      return;
    }
    setPendingStatus({ candidate, status });
  }, []);

  const confirmStatus = useCallback(async () => {
    if (!pendingStatus) return;
    const { candidate, status } = pendingStatus;
    const action = EVALUATION_ACTIONS.find(a => a.status === status);
    const name = candidate?.employee_name || 'The applicant';
    setUpdatingStatus(true);
    try {
      await apiFetch(`/company/applications/${candidate.id}/status/`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      patch(candidate.id, { status });
      toast.success(`${name}'s application has been updated to "${action?.shortLabel || status}". The candidate has been notified by email.`);
      setPendingStatus(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update candidate status.');
    } finally {
      setUpdatingStatus(false);
    }
  }, [pendingStatus, patch]);

  /**
   * The server issues a ticket that unlocks exactly this one CV for five
   * minutes (QH-50), so the signed-in token never goes into a URL.
   *
   * The PDF is fetched and shown from a blob rather than framed from the
   * backend directly. The backend answers with X-Frame-Options: DENY, which
   * would refuse to render inside a frame; a blob belongs to this page, so the
   * header does not apply and the CV can be shown in place, as the app does.
   */
  const openResume = useCallback(async (candidate: any) => {
    setLoadingResume(true);
    try {
      const { url } = await apiFetch(`/company/applications/${candidate.id}/resume/ticket/`, { method: 'POST' });
      if (!url) throw new Error('The server did not return a resume link.');
      const res = await fetch(`${API_ORIGIN}${url}`);
      if (!res.ok) throw new Error('Unable to open resume document at this time.');
      const blob = await res.blob();
      setResumeUrl(URL.createObjectURL(blob));
    } catch (err: any) {
      toast.error(err?.message || 'Unable to open resume document at this time.');
    } finally {
      setLoadingResume(false);
    }
  }, []);

  const closeResume = useCallback(() => {
    setResumeUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const pendingCopy = pendingStatus
    ? {
        name: pendingStatus.candidate?.employee_name || 'this applicant',
        from: statusOf(pendingStatus.candidate?.status).label,
        to: EVALUATION_ACTIONS.find(a => a.status === pendingStatus.status)?.shortLabel || pendingStatus.status,
        destructive: pendingStatus.status === 'rejected',
      }
    : null;

  return {
    toggleShortlist,
    requestStatus,
    confirmStatus,
    cancelStatus: () => setPendingStatus(null),
    pendingCopy,
    updatingStatus,
    openResume,
    closeResume,
    resumeUrl,
    loadingResume,
  };
};
