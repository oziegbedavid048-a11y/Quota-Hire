import { useEffect, useState } from 'react';
import { Briefcase, MapPin, Users, Loader2, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../context/AppContext';

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
    <div className="min-h-screen py-10 px-4 md:px-8 bg-neutral-50/50 dark:bg-neutral-900/20 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="space-y-8">
          
          {/* Simple Professional Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                <Briefcase className="text-neutral-500 w-8 h-8" />
                <span>Job Postings</span>
                {jobs.length > 0 && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded-full border border-neutral-200 dark:border-neutral-700">
                    {jobs.length} {jobs.length === 1 ? 'Role' : 'Roles'}
                  </span>
                )}
              </h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5">
                Track role approval, manage applicants, and review active postings.
              </p>
            </div>
            <button
              onClick={() => navigate('/company/post-job')}
              className="inline-flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors duration-200"
            >
              Post New Job
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-neutral-400">
              <Loader2 size={32} className="animate-spin text-neutral-500 mb-4" />
              <p className="font-semibold text-neutral-500">Loading your jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 px-6 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/30">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase size={28} className="text-neutral-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">No Jobs Posted Yet</h3>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mb-6 text-sm">
                Get started by creating your first job post. Once approved, candidates will be able to apply.
              </p>
              <button 
                onClick={() => navigate('/company/post-job')}
                className="inline-flex items-center justify-center bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200"
              >
                Create Job Post
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
                {jobs.map((job) => (
                  <div key={job.id} className="p-5 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-bold text-neutral-900 dark:text-white text-base leading-snug">{job.title}</h3>
                        <p className="text-xs text-neutral-400 mt-0.5">{job.is_remote ? 'Remote' : (job.employment_type || 'Full-time')}</p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(job.status)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <MapPin size={14} className="shrink-0" />
                        <span className="truncate">{job.is_remote ? 'Remote' : job.location || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                        <Users size={14} className="text-neutral-400 shrink-0" />
                        <span><strong className="font-semibold">{job.applicants_count || 0}</strong> {job.applicants_count === 1 ? 'Applicant' : 'Applicants'}</span>
                      </div>
                    </div>
                    
                    <Link 
                      to={`/company/jobs/${job.id}/applicants`}
                      className="w-full flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 py-2.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-850 transition-colors"
                    >
                      View Applicants <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                      <th className="py-3.5 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Role Title</th>
                      <th className="py-3.5 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Location</th>
                      <th className="py-3.5 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Salary</th>
                      <th className="py-3.5 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="py-3.5 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap">Applicants</th>
                      <th className="py-3.5 px-6 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-850">
                    {jobs.map((job) => (
                      <tr key={job.id} className="hover:bg-neutral-50/30 dark:hover:bg-neutral-900/20 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-neutral-900 dark:text-white">{job.title}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">{job.is_remote ? 'Remote' : (job.employment_type || 'Full-time')}</p>
                        </td>
                        <td className="py-4 px-6 text-sm text-neutral-600 dark:text-neutral-350">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-neutral-400" />
                            {job.is_remote ? 'Remote' : job.location || 'Not specified'}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs font-semibold text-neutral-600 dark:text-neutral-350">
                          {job.salary_range ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-md border border-green-100 dark:border-green-900/20">
                              <span className="font-bold text-[10px] bg-green-100 dark:bg-green-900/30 px-1 rounded">{job.currency || 'USD'}</span>
                              {job.salary_range}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-medium">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {getStatusBadge(job.status)}
                        </td>
                        <td className="py-4 px-6 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-2">
                            <Users size={15} className="text-neutral-400" />
                            <span>{job.applicants_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <Link 
                            to={`/company/jobs/${job.id}/applicants`}
                            className="inline-flex items-center gap-1 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-900 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 dark:border-neutral-700 transition-colors"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
