import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, FileText, Briefcase, X, Star, ArrowLeft } from 'lucide-react';
import { apiFetch } from '../../context/AppContext';
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
      if (blob.size === 0) throw new Error('Empty file returned');
      
      const localUrl = URL.createObjectURL(blob);
      setResumeBlobUrl(localUrl);
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
    <div className="min-h-screen py-8 px-4 bg-neutral-50 dark:bg-neutral-950 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header Bar */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 md:p-6 mb-6 shadow-sm border border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/company/jobs/${jobId}/applicants`)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
              <ArrowLeft size={20} className="text-neutral-500" />
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              Applicant Profile
            </h2>
          </div>
          <div className="flex gap-3">
            {applicant.is_shortlisted ? (
              <span className="px-6 py-2.5 rounded-lg font-semibold bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 flex items-center gap-2">
                <CheckCircle size={18} /> Shortlisted
              </span>
            ) : (
              <button onClick={handleShortlist} className="px-6 py-2.5 rounded-lg font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 text-white transition-colors flex items-center gap-2 shadow-sm">
                <Star size={18} /> Shortlist
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Core Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800 text-center">
              {applicant.avatar_url ? (
                <img src={applicant.avatar_url} alt={applicant.employee_name} className="w-32 h-32 mx-auto rounded-full object-cover shadow-sm border-4 border-neutral-50 dark:border-neutral-800 mb-4" />
              ) : (
                <div className="w-32 h-32 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 text-4xl font-bold shadow-sm mb-4">
                  {applicant.employee_name[0]}
                </div>
              )}
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">{applicant.employee_name}</h3>
              <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-4">{applicant.employee_profile?.title || 'No title specified'}</p>
              
              <div className="flex justify-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700">
                  <Briefcase size={14} className="text-neutral-400" /> {applicant.employee_profile?.experience_years || 0} Years Exp
                </span>
              </div>
            </div>

            {applicant.employee_profile?.resume_file && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-sm border border-neutral-200 dark:border-neutral-800">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-neutral-500">Documents</h4>
                <button onClick={openResumeModal} className="w-full inline-flex items-center justify-center gap-2 text-neutral-700 dark:text-neutral-200 font-semibold bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 px-4 py-3 rounded-xl transition-colors">
                  <FileText size={18} /> View Attached Resume
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {applicant.employee_profile?.bio && cleanText(applicant.employee_profile.bio).length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Professional Summary</h4>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{cleanText(applicant.employee_profile.bio)}</p>
              </div>
            )}

            {applicant.employee_profile?.skills?.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Skills & Expertise</h4>
                <div className="flex flex-wrap gap-2">
                  {applicant.employee_profile.skills.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium">{s}</span>
                  ))}
                </div>
              </div>
            )}

            {applicant.employee_profile?.education && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Education</h4>
                <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{applicant.employee_profile.education}</p>
              </div>
            )}

            {applicant.cover_letter && cleanText(applicant.cover_letter).length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 md:p-8 shadow-sm border border-neutral-200 dark:border-neutral-800">
                <h4 className="text-sm font-bold uppercase tracking-widest mb-4 text-neutral-900 dark:text-white border-b border-neutral-100 dark:border-neutral-800 pb-2">Cover Letter</h4>
                <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {cleanText(applicant.cover_letter)}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Resume Modal */}
        <AnimatePresence>
          {isResumeModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-neutral-900/80 backdrop-blur-sm" onClick={() => setIsResumeModalOpen(false)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-[24px] w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
                <div className="bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 p-4 flex justify-between items-center z-10 shrink-0">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <FileText size={20} className="text-neutral-400" /> Resume Document
                  </h2>
                  <div className="flex items-center gap-2">
                    {resumeBlobUrl && <a href={resumeBlobUrl} target="_blank" rel="noreferrer" download="resume.pdf" className="px-4 py-2 text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-lg transition-colors">Open in New Tab</a>}
                    <button onClick={() => setIsResumeModalOpen(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"><X size={20} className="text-neutral-500" /></button>
                  </div>
                </div>
                <div className="flex-1 w-full bg-neutral-100 dark:bg-neutral-950 overflow-hidden relative">
                  {resumeLoading && (
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neutral-900 dark:border-white" />
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
