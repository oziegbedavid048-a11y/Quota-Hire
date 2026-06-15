import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, FileText, User, Briefcase, X, Star } from 'lucide-react';
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
    // If it's a PDF, we can usually just embed it directly
    if (url.toLowerCase().endsWith('.pdf') || url.includes('f_pdf')) {
      return url;
    }
    // If it's a Word doc or other, try Google Docs viewer
    return `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`;
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
        <button onClick={() => navigate(`/company/jobs/${jobId}/applicants`)} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors font-semibold">
          <ArrowLeft size={20} /> Back to Applicants List
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-neutral-900 rounded-[32px] overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800">
          
          {/* Header Section */}
          <div className="relative bg-gradient-to-r from-accent-600 to-warm-600 p-8 md:p-12 pb-24 text-white">
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-black mb-2">{applicant.employee_name}</h1>
                <p className="text-accent-100 text-lg md:text-xl font-medium">{applicant.employee_profile?.title || 'Applicant'}</p>
              </div>
              {applicant.is_shortlisted ? (
                <div className="px-5 py-2.5 bg-green-500/20 text-green-100 border border-green-500/30 rounded-full flex items-center gap-2 font-bold backdrop-blur-md">
                  <CheckCircle size={20} /> Shortlisted
                </div>
              ) : (
                <button onClick={handleShortlist} className="px-6 py-3 bg-white text-accent-600 hover:bg-neutral-50 rounded-full flex items-center gap-2 font-extrabold shadow-lg transition-transform hover:scale-105 active:scale-95">
                  <Star size={20} className="fill-current" /> Shortlist Applicant
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-8 md:px-12 pb-12 -mt-16 relative z-20">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              
              {/* Avatar */}
              {applicant.avatar_url ? (
                <img src={applicant.avatar_url} alt={applicant.employee_name} className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] object-cover shadow-xl border-4 border-white dark:border-neutral-900 bg-white" />
              ) : (
                <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-accent-100 dark:bg-accent-900 text-accent-600 text-5xl font-extrabold flex items-center justify-center shadow-xl border-4 border-white dark:border-neutral-900">
                  {applicant.employee_name[0]}
                </div>
              )}

              <div className="flex-1 mt-16 md:mt-16 space-y-4 w-full">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-xl w-fit font-semibold">
                  <Briefcase size={18} /> {applicant.employee_profile?.experience_years || 0} Years Experience
                </div>
                
                {applicant.employee_profile?.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {applicant.employee_profile.skills.map((s: string, i: number) => (
                      <span key={i} className="px-4 py-1.5 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-100 dark:border-accent-800/30 rounded-xl text-sm font-bold">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 space-y-10">
              {/* Bio */}
              {applicant.employee_profile?.bio && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2"><User size={16} /> Professional Summary</h3>
                  <div className="p-6 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {applicant.employee_profile.bio}
                  </div>
                </section>
              )}

              {/* Education */}
              {applicant.employee_profile?.education && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">Education Background</h3>
                  <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                    {applicant.employee_profile.education}
                  </div>
                </section>
              )}

              {/* Cover Letter */}
              {applicant.cover_letter && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">Cover Letter</h3>
                  <div className="p-6 bg-warm-50 dark:bg-warm-900/20 border border-warm-100 dark:border-warm-900/30 rounded-2xl text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap shadow-inner-soft">
                    {applicant.cover_letter}
                  </div>
                </section>
              )}

              {/* Resume */}
              {applicant.employee_profile?.resume_file && (
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-4">Attachments</h3>
                  <button onClick={() => setIsResumeModalOpen(true)} className="inline-flex items-center gap-3 text-accent-700 dark:text-accent-300 font-bold bg-white dark:bg-neutral-800 border-2 border-accent-100 dark:border-accent-900/50 hover:border-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/40 px-6 py-4 rounded-2xl transition-all shadow-sm hover:shadow-md group w-full sm:w-auto">
                    <div className="p-2 bg-accent-100 dark:bg-accent-900/50 rounded-xl group-hover:scale-110 transition-transform">
                      <FileText size={24} className="text-accent-600 dark:text-accent-400" />
                    </div>
                    View Attached Resume
                  </button>
                </section>
              )}
            </div>
          </div>
        </motion.div>

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
