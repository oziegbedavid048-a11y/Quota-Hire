import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Users, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
          Pending Review
        </span>
      );
    case 'approved':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30">
          Active
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800/30">
          Rejected
        </span>
      );
    case 'closed':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
          Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
          {status}
        </span>
      );
  }
};

export const MyJobs = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanyJobs = async () => {
      try {
        const data = await apiFetch('/company/jobs/');
        setJobs(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error('Failed to fetch company jobs', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanyJobs();
  }, []);

  return (
    <div className="min-h-screen py-12 px-4 relative overflow-hidden font-sans">
      <AnimatedBackground />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
          
          {/* Hero Banner with 3D Illustration */}
          <motion.div variants={itemVariants} className="card-soft relative overflow-hidden bg-gradient-to-r from-accent-50 to-warm-50 dark:from-accent-900/20 dark:to-warm-900/20 p-6 md:p-8 mb-2">
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent-200/40 dark:bg-accent-900/40 rounded-full blur-[60px]" />
            <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full mb-3">
                  <Briefcase size={12} /> My Job Postings
                </span>
                <h1 className="text-xl md:text-2xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
                  Manage Your <span className="text-accent-600 dark:text-accent-400">Open Roles</span>
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-5">
                  Track approval status and manage your company's active job postings.
                </p>
                <button
                  onClick={() => navigate('/company/post-job')}
                  className="btn-soft bg-accent-600 text-white py-2.5 px-6 text-sm flex items-center gap-2 w-fit mx-auto md:mx-0"
                >
                  Post New Job <ArrowRight size={16} />
                </button>
              </div>
              <div className="w-32 h-32 md:w-44 md:h-44 shrink-0">
                <img
                  src={`${import.meta.env.BASE_URL}images/my_jobs_manager.png`}
                  alt="Job Manager 3D Character"
                  className="w-full h-full object-contain drop-shadow-xl animate-float"
                />
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
              <div className="w-20 h-20 bg-white dark:bg-neutral-900 rounded-[24px] shadow-soft flex items-center justify-center mb-6">
                <Loader2 size={32} className="animate-spin text-accent-500" />
              </div>
              <p className="font-bold text-lg text-neutral-500">Loading your jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <motion.div variants={itemVariants} className="card-soft p-16 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 shadow-none">
              <div className="w-24 h-24 bg-accent-50 dark:bg-accent-900/20 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner-soft">
                <Briefcase size={40} className="text-accent-500" />
              </div>
              <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-3">No Jobs Posted Yet</h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto mb-8 text-lg leading-relaxed">
                Get started by posting your first role. It will be reviewed by our team and listed shortly.
              </p>
              <button 
                onClick={() => navigate('/company/post-job')}
                className="btn-soft bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-3 px-8 text-lg"
              >
                Create Job Post
              </button>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              <div className="w-full overflow-x-auto scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                      <th className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Role Title</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Location</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Salary</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Applicants</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-850">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-neutral-50/30 dark:hover:bg-neutral-900/20 transition-colors">
                        <td className="py-4 px-6 min-w-[200px]">
                          <p className="font-semibold text-neutral-900 dark:text-white">{job.title}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{job.is_remote ? 'Remote' : (job.employment_type || 'Full-time')}</p>
                        </td>
                        <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-350 min-w-[150px]">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-neutral-400 shrink-0" />
                            <span>{job.is_remote ? 'Remote' : job.location || 'Not specified'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-neutral-600 dark:text-neutral-350 min-w-[140px]">
                          {job.salary_range ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-md border border-green-100 dark:border-green-900/20">
                              <span className="font-bold text-[10px] bg-green-100 dark:bg-green-900/30 px-1 rounded">{job.currency || 'USD'}</span>
                              {job.salary_range}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 min-w-[130px]">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-neutral-700 dark:text-neutral-300 min-w-[110px]">
                          <div className="flex items-center gap-2">
                            <Users size={15} className="text-neutral-400 shrink-0" />
                            <span>{job.applicants_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right min-w-[120px]">
                          <Link 
                            to={`/company/jobs/${job.id}/applicants`}
                            className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200"
                          >
                            <span>Manage</span>
                            <ArrowRight size={13} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
