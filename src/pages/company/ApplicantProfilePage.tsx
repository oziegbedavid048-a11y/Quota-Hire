import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, FileText, User, Briefcase, X, Star } from 'lucide-react';
import { apiFetch } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { toast } from 'sonner';

export const ApplicantProfilePage = () => {
  const { jobId, appId } = useParams<{ jobId: string, appId: string }>();
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

  useEffect(() => {
    const fetchApplicant = async () => {
      try {
        const data = await apiFetch(`/company/applications/${appId}/`);
        setApplicant(data);
      } catch (error) {
        toast.error('Failed to load applicant details.');
        navigate(`/company/jobs/${jobId}/applicants`);
      } finally {
        setLoading(false);
      }
    };
    if (appId) fetchApplicant();
  }, [appId, jobId, navigate]);

  const handleShortlist = async () => {
    try {
      await apiFetch(`/company/applications/${appId}/shortlist/`, { method: 'POST' });
      toast.success('Applicant successfully shortlisted!');
      setApplicant({ ...applicant, is_shortlisted: true });
    } catch (error: any) {
      toast.error(error.message || 'Failed to shortlist applicant.');
    }
  };

  const getResumeEmbedUrl = (url: string) => {
    if (!url) return '';
    // Return the URL directly to let the browser natively render the PDF.
    // This avoids Google Docs Viewer failing with "No preview available" for raw Cloudinary PDFs.
    return url;
  };

  const cleanText = (text: string) => {
    if (!text) return text;
    // Strip out common contact info lines (Email, Address, LinkedIn, Phone, Contact, Website)
    let cleaned = text.replace(/^(Email|Address|LinkedIn|Phone|Contact|Mobile|Website|Portfolio).*$/gmi, '');
    // Regex for basic email addresses
    cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[Hidden]');
    // Regex for URLs that might be LinkedIn/Portfolios
    cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi, '[Hidden]');
    return cleaned.trim();
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 px-4 flex justify-center items-center">
        <div className="animate-spin text-accent-500 rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  if (!applicant) return null;

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden font-sans">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
          <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center z-10 shrink-0">
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              <User className="text-accent-500" /> Applicant Profile
            </h2>
            <button onClick={() => navigate(`/company/jobs/${jobId}/applicants`)} className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors"><X size={20} className="text-neutral-600 dark:text-neutral-300" /></button>
          </div>
          
          <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {applicant.avatar_url ? (
                <img src={applicant.avatar_url} alt={applicant.employee_name} className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] object-cover shadow-soft border-4 border-white dark:border-neutral-800" />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 text-4xl md:text-5xl font-extrabold shadow-soft border-4 border-white dark:border-neutral-800">
                  {applicant.employee_name[0]}
                </div>
              )}
              <div className="flex-1 pt-2">
                <h3 className="text-3xl font-display font-black text-neutral-900 dark:text-white mb-2">{applicant.employee_name}</h3>
                <p className="text-xl font-medium text-accent-600 dark:text-accent-400 mb-4">{applicant.employee_profile?.title || 'No title specified'}</p>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-xl shadow-inner-soft"><Briefcase size={16} className="text-neutral-400" /> {applicant.employee_profile?.experience_years || 0} Years Exp</span>
                </div>
              </div>
            </div>

            {applicant.employee_profile?.bio && cleanText(applicant.employee_profile.bio).length > 0 && (
              <div className="bg-neutral-50 dark:bg-neutral-800/30 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">About</h4>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{cleanText(applicant.employee_profile.bio)}</p>
              </div>
            )}

            {applicant.employee_profile?.skills?.length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-400">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2.5">
                  {applicant.employee_profile.skills.map((s: string, i: number) => (
                    <span key={i} className="px-4 py-2 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-100 dark:border-accent-800/30 rounded-xl text-sm font-bold shadow-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {applicant.employee_profile?.education && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">Education</h4>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{applicant.employee_profile.education}</p>
              </div>
            )}

            {applicant.cover_letter && cleanText(applicant.cover_letter).length > 0 && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">Cover Letter</h4>
                <div className="p-6 bg-warm-50 dark:bg-warm-900/10 border border-warm-100 dark:border-warm-900/30 rounded-2xl text-neutral-700 dark:text-neutral-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-inner-soft">
                  {cleanText(applicant.cover_letter)}
                </div>
              </div>
            )}
            
            {applicant.employee_profile?.resume_file && (
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">Documents</h4>
                <button onClick={() => setIsResumeModalOpen(true)} className="inline-flex items-center gap-3 text-accent-600 hover:text-accent-700 font-bold bg-white dark:bg-neutral-800 border-2 border-accent-100 dark:border-accent-900/50 hover:border-accent-300 dark:hover:border-accent-700 px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-soft group">
                  <FileText size={22} className="group-hover:scale-110 transition-transform" /> View Attached Resume
                </button>
              </div>
            )}

          </div>
          
          <div className="bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 p-6 flex flex-col-reverse md:flex-row justify-end gap-4 shrink-0">
            <button onClick={() => navigate(`/company/jobs/${jobId}/applicants`)} className="px-6 py-3 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors w-full md:w-auto">Close Profile</button>
            {applicant.is_shortlisted ? (
              <button disabled className="px-8 py-3 rounded-xl font-bold bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-800/50 flex items-center justify-center gap-2 w-full md:w-auto">
                <CheckCircle size={20} /> Shortlisted
              </button>
            ) : (
              <button onClick={handleShortlist} className="btn-soft bg-accent-600 text-white px-8 py-3 text-lg flex items-center justify-center gap-2 shadow-accent w-full md:w-auto">
                <Star size={20} className="fill-current" /> Shortlist Applicant
              </button>
            )}
          </div>
        </div>

        {/* Resume Modal */}
        <AnimatePresence>
          {isResumeModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-neutral-900/80 backdrop-blur-sm" onClick={() => setIsResumeModalOpen(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center z-10 shrink-0">
                  <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
                    <FileText className="text-accent-500" /> Resume Document
                  </h2>
                  <div className="flex items-center gap-2">
                    <a href={applicant.employee_profile.resume_file} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm font-bold text-accent-600 bg-accent-50 hover:bg-accent-100 dark:bg-accent-900/20 dark:hover:bg-accent-900/40 rounded-xl transition-colors">Open in New Tab</a>
                    <button onClick={() => setIsResumeModalOpen(false)} className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors"><X size={20} className="text-neutral-600 dark:text-neutral-300" /></button>
                  </div>
                </div>
                <div className="flex-1 w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden relative">
                  <iframe 
                    src={getResumeEmbedUrl(applicant.employee_profile.resume_file)} 
                    className="w-full h-full absolute inset-0 border-none"
                    title="Resume Document Viewer"
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
