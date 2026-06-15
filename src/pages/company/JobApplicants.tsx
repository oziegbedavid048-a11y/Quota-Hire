import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, FileText, User, Briefcase, ChevronRight, X, Star } from 'lucide-react';
import { apiFetch } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { toast } from 'sonner';

export const JobApplicants = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const data = await apiFetch(`/company/jobs/${id}/applicants/`);
        setApplicants(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        toast.error('Failed to load applicants.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchApplicants();
  }, [id]);

  const handleShortlist = async (appId: number) => {
    try {
      await apiFetch(`/company/applications/${appId}/shortlist/`, { method: 'POST' });
      toast.success('Applicant successfully shortlisted!');
      setApplicants(applicants.map(app => app.id === appId ? { ...app, is_shortlisted: true } : app));
      if (selectedApplicant && selectedApplicant.id === appId) {
        setSelectedApplicant({ ...selectedApplicant, is_shortlisted: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to shortlist applicant.');
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden font-sans">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto relative z-10">
        <button onClick={() => navigate('/company/jobs')} className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-6 transition-colors font-semibold">
          <ArrowLeft size={20} /> Back to My Jobs
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-soft mb-8 p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">Job Applicants</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg">Review candidates who applied for this role.</p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-accent-500 rounded-full h-12 w-12 border-b-2 border-accent-500"></div>
          </div>
        ) : applicants.length === 0 ? (
          <div className="card-soft p-12 text-center text-neutral-500 text-lg font-medium">No applicants yet for this job.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {applicants.map(app => (
              <motion.div key={app.id} whileHover={{ y: -5 }} className="card-soft cursor-pointer hover:border-accent-500/30 transition-all p-6 group" onClick={() => setSelectedApplicant(app)}>
                <div className="flex items-center gap-4 mb-4">
                  {app.avatar_url ? (
                    <img src={app.avatar_url} alt={app.employee_name} className="w-16 h-16 rounded-full object-cover border-2 border-accent-100 dark:border-accent-900/50 shadow-inner-soft" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 text-2xl font-bold shadow-inner-soft">
                      {app.employee_name[0]}
                    </div>
                  )}
                  <div>
                    <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white group-hover:text-accent-600 transition-colors">{app.employee_name}</h3>
                    <p className="text-sm text-neutral-500 font-medium">{app.employee_profile?.title || 'Applicant'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-6 h-[60px] overflow-hidden">
                  {(app.employee_profile?.skills || []).slice(0, 3).map((skill: string, i: number) => (
                    <span key={i} className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">{skill}</span>
                  ))}
                  {(app.employee_profile?.skills?.length > 3) && <span className="text-xs text-neutral-400 font-medium self-center">+{app.employee_profile.skills.length - 3}</span>}
                </div>
                <div className="flex justify-between items-center mt-auto border-t border-neutral-100 dark:border-neutral-800 pt-4">
                  <span className="text-xs font-medium text-neutral-400">Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                  {app.is_shortlisted ? (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded"><CheckCircle size={14}/> Shortlisted</span>
                  ) : (
                    <span className="text-xs font-bold text-accent-600 flex items-center gap-1 bg-accent-50 dark:bg-accent-900/20 px-2 py-1 rounded">Review <ChevronRight size={14}/></span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedApplicant && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setSelectedApplicant(null)}>
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800" onClick={e => e.stopPropagation()}>
                <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center z-10 shrink-0">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-3">
                    <User className="text-accent-500" /> Applicant Profile
                  </h2>
                  <button onClick={() => setSelectedApplicant(null)} className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-full transition-colors"><X size={20} className="text-neutral-600 dark:text-neutral-300" /></button>
                </div>
                
                <div className="p-6 md:p-8 space-y-8 overflow-y-auto flex-1">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {selectedApplicant.avatar_url ? (
                      <img src={selectedApplicant.avatar_url} alt={selectedApplicant.employee_name} className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] object-cover shadow-soft border-4 border-white dark:border-neutral-800" />
                    ) : (
                      <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 text-4xl md:text-5xl font-extrabold shadow-soft border-4 border-white dark:border-neutral-800">
                        {selectedApplicant.employee_name[0]}
                      </div>
                    )}
                    <div className="flex-1 pt-2">
                      <h3 className="text-3xl font-display font-black text-neutral-900 dark:text-white mb-2">{selectedApplicant.employee_name}</h3>
                      <p className="text-xl font-medium text-accent-600 dark:text-accent-400 mb-4">{selectedApplicant.employee_profile?.title || 'No title specified'}</p>
                      <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-4 py-2 rounded-xl shadow-inner-soft"><Briefcase size={16} className="text-neutral-400" /> {selectedApplicant.employee_profile?.experience_years || 0} Years Exp</span>
                      </div>
                    </div>
                  </div>

                  {selectedApplicant.employee_profile?.bio && (
                    <div className="bg-neutral-50 dark:bg-neutral-800/30 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">About</h4>
                      <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">{selectedApplicant.employee_profile.bio}</p>
                    </div>
                  )}

                  {selectedApplicant.employee_profile?.skills?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-neutral-400">Skills & Expertise</h4>
                      <div className="flex flex-wrap gap-2.5">
                        {selectedApplicant.employee_profile.skills.map((s: string, i: number) => (
                          <span key={i} className="px-4 py-2 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-100 dark:border-accent-800/30 rounded-xl text-sm font-bold shadow-sm">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplicant.employee_profile?.education && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">Education</h4>
                      <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">{selectedApplicant.employee_profile.education}</p>
                    </div>
                  )}

                  {selectedApplicant.cover_letter && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">Cover Letter</h4>
                      <div className="p-6 bg-warm-50 dark:bg-warm-900/10 border border-warm-100 dark:border-warm-900/30 rounded-2xl text-neutral-700 dark:text-neutral-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-inner-soft">
                        {selectedApplicant.cover_letter}
                      </div>
                    </div>
                  )}
                  
                  {selectedApplicant.employee_profile?.resume_file && (
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-wider mb-3 text-neutral-400">Documents</h4>
                      <a href={selectedApplicant.employee_profile.resume_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-3 text-accent-600 hover:text-accent-700 font-bold bg-white dark:bg-neutral-800 border-2 border-accent-100 dark:border-accent-900/50 hover:border-accent-300 dark:hover:border-accent-700 px-6 py-3 rounded-xl transition-all shadow-sm hover:shadow-soft group">
                        <FileText size={22} className="group-hover:scale-110 transition-transform" /> View Attached Resume
                      </a>
                    </div>
                  )}

                </div>
                
                <div className="bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 p-6 flex flex-col-reverse md:flex-row justify-end gap-4 shrink-0">
                  <button onClick={() => setSelectedApplicant(null)} className="px-6 py-3 rounded-xl font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:text-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors w-full md:w-auto">Close Profile</button>
                  {selectedApplicant.is_shortlisted ? (
                    <button disabled className="px-8 py-3 rounded-xl font-bold bg-green-50 dark:bg-green-900/20 text-green-600 border border-green-200 dark:border-green-800/50 flex items-center justify-center gap-2 w-full md:w-auto">
                      <CheckCircle size={20} /> Shortlisted
                    </button>
                  ) : (
                    <button onClick={() => handleShortlist(selectedApplicant.id)} className="btn-soft bg-accent-600 text-white px-8 py-3 text-lg flex items-center justify-center gap-2 shadow-accent w-full md:w-auto">
                      <Star size={20} className="fill-current" /> Shortlist Applicant
                    </button>
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
