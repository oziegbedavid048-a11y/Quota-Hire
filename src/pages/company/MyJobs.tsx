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
      return <span className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow-inner-soft border border-yellow-200 dark:border-yellow-800/50 whitespace-nowrap">Pending <span className="hidden md:inline">Approval</span></span>;
    case 'approved':
      return <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow-inner-soft border border-green-200 dark:border-green-800/50">Active</span>;
    case 'rejected':
      return <span className="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow-inner-soft border border-red-200 dark:border-red-800/50">Rejected</span>;
    case 'closed':
      return <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow-inner-soft border border-neutral-200 dark:border-neutral-700">Closed</span>;
    default:
      return <span className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-xl text-xs font-bold uppercase tracking-wider shadow-inner-soft border border-neutral-200 dark:border-neutral-700">{status}</span>;
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
    <div className="min-h-screen  py-12 px-4 relative overflow-hidden font-sans">
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
            <motion.div variants={itemVariants} className="card-soft overflow-hidden p-0 border border-neutral-100 dark:border-neutral-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/50">
                      <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Role Title</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Location</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Salary</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider whitespace-nowrap">Applicants</th>
                      <th className="py-4 px-6 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                        <td className="py-4 px-6">
                          <p className="font-extrabold text-neutral-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">{job.title}</p>
                          <p className="text-xs text-neutral-400 mt-1 font-semibold">{job.employment_type || 'Full-time'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm font-bold text-neutral-600 dark:text-neutral-300">
                            <MapPin size={14} className="text-neutral-400" />
                            {job.is_remote ? 'Remote' : job.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {job.salary_range ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-100 dark:border-green-800/30">
                              <span className="font-black bg-green-200/50 dark:bg-green-800/50 px-1.5 rounded">{job.currency || 'USD'}</span>
                              {job.salary_range}
                            </span>
                          ) : (
                            <span className="text-sm text-neutral-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Users size={16} className="text-neutral-400" />
                            <span className="font-extrabold text-neutral-900 dark:text-white">{job.applicants_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link 
                            to={`/company/jobs/${job.id}/applicants`}
                            className="inline-flex items-center justify-center w-8 h-8 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-accent-500 hover:text-accent-600 text-neutral-400 rounded-lg transition-all shadow-sm hover:shadow-soft"
                            title="View Applicants"
                          >
                            <ArrowRight size={16} />
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
