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
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);

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

  const openResumeModal = async () => {
    setIsResumeModalOpen(true);
    if (resumeBlobUrl) return; // already loaded
    setResumeLoading(true);
    setResumeError(null);
    try {
      const token = localStorage.getItem('access_token');
      const apiBase = import.meta.env.VITE_API_URL || 'https://quotahire-backend.onrender.com/api';
      const response = await fetch(`${apiBase}/company/applications/${appId}/resume/`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setResumeBlobUrl(url);
    } catch (err: any) {
      setResumeError('Could not load resume. The file may be unavailable.');
    } finally {
      setResumeLoading(false);
    }
  };

  const cleanText = (text: string) => {
    if (!text) return text;
    let cleaned = text;
    
    // 1. Strip out lines explicitly labeled as contact info
    cleaned = cleaned.replace(/^(Email|Address|Location|LinkedIn|Phone|Contact|Mobile|Website|Portfolio)[\s:]*.*$/gmi, '');
    
    // 2. Hide basic email addresses
    cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
    
    // 3. Hide LinkedIn/Portfolio URLs
    cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi, '');
    
    // 4. Hide phone numbers (basic international/national formats)
    cleaned = cleaned.replace(/(?:(?:\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?)|(?:\(\d{2,4}\)))[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '');
    
    // 5. Hide typical Street Addresses and PO Boxes
    cleaned = cleaned.replace(/\b\d{1,5}\s+[a-zA-Z0-9\s.,-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Plaza|Plz|Square|Sq|Close|Crescent|Estate)\b/gi, '');
    cleaned = cleaned.replace(/\b(?:P\.?O\.?\s*Box|Post\s*Office\s*Box)\s*\d+\b/gi, '');

    // 6. Handle cover letter header blocks
    const lines = cleaned.split('\n');
    let contentStarted = false;
    
    const processedLines = lines.map((line, index) => {
      if (contentStarted) return line;
      
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('dear') || trimmed.toLowerCase().startsWith('to whom') || trimmed.split(' ').length > 15) {
        contentStarted = true;
        return line;
      }
      
      if (index < 10 && trimmed.length > 0 && trimmed.length < 50) {
        if (/^[A-Z][a-zA-Z\s.-]+,\s*[A-Z][a-zA-Z\s.-]+(?:\s*\d{4,6})?$/.test(trimmed)) {
          return '';
        }
        if (/^\d{1,5}\s+[A-Z]/.test(trimmed)) {
          return '';
        }
      }
      return line;
    });
    
    return processedLines.join('\n').trim();
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
        <div className="bg-white/40 dark:bg-neutral-900/40 backdrop-blur-2xl rounded-[2rem] w-full flex flex-col overflow-hidden shadow-2xl border border-white/50 dark:border-white/10 ring-1 ring-white/50 dark:ring-white/5">
          <div className="bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl p-6 border-b border-white/20 dark:border-white/5 flex justify-between items-center z-10 shrink-0">
            <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-accent-500/10 rounded-xl"><User className="text-accent-500" /></div>
              Applicant Profile
            </h2>
            <button onClick={() => navigate(`/company/jobs/${jobId}/applicants`)} className="p-2 bg-white/50 hover:bg-white/80 dark:bg-neutral-800/50 dark:hover:bg-neutral-800/80 rounded-full transition-all backdrop-blur-sm"><X size={20} className="text-neutral-600 dark:text-neutral-300" /></button>
          </div>
          
          <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {applicant.avatar_url ? (
                <img src={applicant.avatar_url} alt={applicant.employee_name} className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] object-cover shadow-xl border-4 border-white/60 dark:border-neutral-800/60" />
              ) : (
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-[1.5rem] bg-gradient-to-br from-accent-500/20 to-accent-600/10 backdrop-blur-md flex items-center justify-center text-accent-600 text-4xl md:text-5xl font-extrabold shadow-xl border-4 border-white/60 dark:border-neutral-800/60">
                  {applicant.employee_name[0]}
                </div>
              )}
              <div className="flex-1 pt-2">
                <h3 className="text-3xl font-display font-black text-neutral-900 dark:text-white mb-2">{applicant.employee_name}</h3>
                <p className="text-xl font-medium text-accent-600 dark:text-accent-400 mb-4">{applicant.employee_profile?.title || 'No title specified'}</p>
                <div className="flex flex-wrap gap-4">
                  <span className="flex items-center gap-2 text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-white/40 dark:border-neutral-700/50 px-4 py-2 rounded-xl shadow-sm"><Briefcase size={16} className="text-neutral-400" /> {applicant.employee_profile?.experience_years || 0} Years Exp</span>
                </div>
              </div>
            </div>

            {applicant.employee_profile?.bio && cleanText(applicant.employee_profile.bio).length > 0 && (
              <div className="bg-white/40 dark:bg-neutral-800/40 backdrop-blur-xl p-8 rounded-[1.5rem] border border-white/50 dark:border-white/5 shadow-xl">
                <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-accent-500">About</h4>
                <p className="text-neutral-700 dark:text-neutral-300 text-lg leading-relaxed whitespace-pre-wrap">{cleanText(applicant.employee_profile.bio)}</p>
              </div>
            )}

            {applicant.employee_profile?.skills?.length > 0 && (
              <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-md p-8 rounded-[1.5rem] border border-white/30 dark:border-white/5 shadow-lg">
                <h4 className="text-sm font-black uppercase tracking-widest mb-5 text-accent-500">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-3">
                  {applicant.employee_profile.skills.map((s: string, i: number) => (
                    <span key={i} className="px-5 py-2.5 bg-white/60 dark:bg-neutral-900/60 backdrop-blur-sm text-neutral-800 dark:text-neutral-200 border border-white/50 dark:border-neutral-700/50 rounded-xl text-sm font-bold shadow-sm">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {applicant.employee_profile?.education && (
              <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-md p-8 rounded-[1.5rem] border border-white/30 dark:border-white/5 shadow-lg">
                <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-accent-500">Education</h4>
                <p className="text-neutral-700 dark:text-neutral-300 text-lg whitespace-pre-wrap leading-relaxed">{applicant.employee_profile.education}</p>
              </div>
            )}

            {applicant.cover_letter && cleanText(applicant.cover_letter).length > 0 && (
              <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-md p-8 rounded-[1.5rem] border border-white/30 dark:border-white/5 shadow-lg">
                <h4 className="text-sm font-black uppercase tracking-widest mb-4 text-accent-500">Cover Letter</h4>
                <div className="p-6 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-md border border-white/40 dark:border-white/5 rounded-2xl text-neutral-700 dark:text-neutral-300 text-base leading-relaxed whitespace-pre-wrap shadow-inner">
                  {cleanText(applicant.cover_letter)}
                </div>
              </div>
            )}
            
            {applicant.employee_profile?.resume_file && (
              <div className="bg-white/30 dark:bg-neutral-800/30 backdrop-blur-md p-8 rounded-[1.5rem] border border-white/30 dark:border-white/5 shadow-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-widest mb-2 text-accent-500">Documents</h4>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm">Applicant's uploaded resume</p>
                </div>
                <button onClick={openResumeModal} className="inline-flex items-center gap-3 text-accent-700 dark:text-accent-300 font-black bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md border border-white/50 dark:border-neutral-700/50 hover:bg-white/80 dark:hover:bg-neutral-800/80 px-6 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 group">
                  <FileText size={22} className="group-hover:scale-110 transition-transform text-accent-500" /> View Attached Resume
                </button>
              </div>
            )}

          </div>
          
          <div className="bg-white/30 dark:bg-neutral-900/30 backdrop-blur-xl border-t border-white/20 dark:border-white/5 p-6 flex flex-col-reverse md:flex-row justify-end gap-4 shrink-0">
            <button onClick={() => navigate(`/company/jobs/${jobId}/applicants`)} className="px-6 py-3 rounded-xl font-bold text-neutral-700 bg-white/50 hover:bg-white/80 dark:text-neutral-300 dark:bg-neutral-800/50 dark:hover:bg-neutral-800/80 backdrop-blur-sm transition-all border border-white/40 dark:border-neutral-700/50 shadow-sm w-full md:w-auto">Close Profile</button>
            {applicant.is_shortlisted ? (
              <button disabled className="px-8 py-3 rounded-xl font-bold bg-green-500/20 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30 backdrop-blur-sm flex items-center justify-center gap-2 w-full md:w-auto shadow-sm">
                <CheckCircle size={20} /> Shortlisted
              </button>
            ) : (
              <button onClick={handleShortlist} className="bg-accent-600 hover:bg-accent-500 text-white px-8 py-3 rounded-xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-accent-500/30 hover:shadow-accent-500/50 transition-all hover:-translate-y-0.5 w-full md:w-auto border border-accent-400/50">
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
                    {resumeBlobUrl && <a href={resumeBlobUrl} target="_blank" rel="noreferrer" download="resume.pdf" className="px-4 py-2 text-sm font-bold text-accent-600 bg-accent-50 hover:bg-accent-100 dark:bg-accent-900/20 dark:hover:bg-accent-900/40 rounded-xl transition-colors">Open in New Tab</a>}
                    <button onClick={() => setIsResumeModalOpen(false)} className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl transition-colors"><X size={20} className="text-neutral-600 dark:text-neutral-300" /></button>
                  </div>
                </div>
                <div className="flex-1 w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden relative">
                  {resumeLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-500" />
                      <p className="text-neutral-500 font-medium">Loading resume...</p>
                    </div>
                  )}
                  {resumeError && !resumeLoading && (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <FileText size={32} className="text-red-500" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Resume Unavailable</h3>
                      <p className="text-neutral-500 dark:text-neutral-400 max-w-md">{resumeError}</p>
                    </div>
                  )}
                  {resumeBlobUrl && !resumeLoading && (
                    <iframe
                      src={resumeBlobUrl}
                      className="w-full h-full absolute inset-0 border-none"
                      title="Resume Document Viewer"
                    />
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};
