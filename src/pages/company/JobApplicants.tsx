import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, User, Star } from 'lucide-react';
import { apiFetch } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { toast } from 'sonner';

export const JobApplicants = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-soft relative overflow-hidden bg-gradient-to-r from-accent-50 to-warm-50 dark:from-accent-900/20 dark:to-warm-900/20 p-6 md:p-8 mb-8 border border-neutral-100 dark:border-neutral-800">
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent-200/40 dark:bg-accent-900/40 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left w-full order-2 md:order-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full mb-3">
                <User size={12} /> Candidate Review
              </span>
              <h1 className="text-2xl md:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
                Job <span className="text-accent-600 dark:text-accent-400">Applicants</span>
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-base max-w-lg mx-auto md:mx-0">
                Review candidates who applied for this role. Click on an applicant's card to view their full professional profile, resume, and shortlist them.
              </p>
            </div>
            <div className="w-40 h-40 md:w-48 md:h-48 shrink-0 order-1 md:order-2 flex justify-center">
              <img
                src={`${import.meta.env.BASE_URL}images/applicant_reviewer.webp`}
                alt="3D Reviewer"
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
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
              <motion.div 
                key={app.id} 
                whileHover={{ y: -5 }} 
                className="card-soft cursor-pointer hover:border-accent-500/30 transition-all p-6 group flex flex-col" 
                onClick={() => navigate(`/company/jobs/${id}/applicants/${app.id}`)}
              >
                <div className="flex items-center gap-4 mb-4">
                  {app.avatar_url ? (
                    <img src={app.avatar_url} alt={app.employee_name} loading="lazy" className="w-16 h-16 rounded-full object-cover border-2 border-accent-100 dark:border-accent-900/50 shadow-inner-soft shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 text-2xl font-bold shadow-inner-soft shrink-0">
                      {app.employee_name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-lg text-neutral-900 dark:text-white group-hover:text-accent-600 transition-colors truncate">{app.employee_name}</h3>
                    <p className="text-sm text-neutral-500 font-medium truncate">{app.employee_profile?.title || 'Applicant'}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-3 leading-relaxed">
                    {app.employee_profile?.bio || 'No bio available.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 mb-6 mt-auto">
                  {(app.employee_profile?.skills || []).slice(0, 4).map((skill: string, i: number) => (
                    <span key={i} className="text-[11px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 shadow-sm">{skill}</span>
                  ))}
                  {(app.employee_profile?.skills?.length > 4) && <span className="text-[11px] text-neutral-400 font-bold self-center">+{app.employee_profile.skills.length - 4}</span>}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-auto border-t border-neutral-100 dark:border-neutral-800 pt-5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/company/jobs/${id}/applicants/${app.id}`); }}
                    className="flex-1 py-3 text-sm font-extrabold text-neutral-600 dark:text-neutral-300 flex items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-xl transition-colors"
                  >
                    <User size={16}/> View Profile
                  </button>
                  {app.is_shortlisted ? (
                    <button disabled className="flex-[1.5] py-3 text-sm font-extrabold text-green-600 flex items-center justify-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl">
                      <CheckCircle size={16}/> Shortlisted
                    </button>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleShortlist(app.id); }}
                      className="flex-[1.5] py-3 text-sm font-extrabold text-white flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 rounded-xl transition-colors shadow-soft"
                    >
                      <Star size={16} className="fill-current" /> Shortlist
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
