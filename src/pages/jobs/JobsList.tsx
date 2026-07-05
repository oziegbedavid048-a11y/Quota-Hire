import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Banknote, Briefcase, Filter, BadgeCheck, TrendingUp } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { getCurrencySymbol } from '../../utils/currencies';
export const JobsList = () => {
  const { jobs, currentUser, loading } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [visibleCount, setVisibleCount] = useState(5);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');
    if (code) {
      if (!loading && !currentUser) {
        sessionStorage.setItem('redirect_job_code', code);
        navigate('/signup?role=employee');
      } else {
        setSearchTerm(code);
      }
    }
  }, [location.search, currentUser, loading, navigate]);
  const formatRelativeTime = (dateString?: string) => {
    if (!dateString) return 'Recent';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'Recent';
    if (diffDays <= 30) return `Past ${diffDays} days`;
    const diffMonths = Math.ceil(diffDays / 30);
    return `Past ${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  };

  // Only show approved jobs
  const approvedJobs = jobs.filter((j) => j.status === 'approved');
  const filteredJobs = approvedJobs.filter((job) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      job.title.toLowerCase().includes(term) ||
      (job.companyName && job.companyName.toLowerCase().includes(term)) ||
      (job.location && job.location.toLowerCase().includes(term)) ||
      (job.job_code && job.job_code.toLowerCase().includes(term));
      
    const matchesType = filterType === 'All' ? true : 
      (job.employment_type === filterType || (filterType === 'Remote' && job.isRemote));

    return matchesSearch && matchesType;
  });

  const displayedJobs = filteredJobs.slice(0, visibleCount);
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Hero Banner with 3D Illustration */}
        <div className="mb-10 relative overflow-hidden rounded-[28px] bg-gradient-to-r from-warm-50 to-accent-50 dark:from-warm-900/20 dark:to-accent-900/20 border border-neutral-100 dark:border-neutral-800 p-6 md:p-8">
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-warm-200/40 dark:bg-warm-900/40 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full mb-3">
                <Search size={12} /> Browse Roles
              </span>
              <h1 className="text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                Find your next <span className="text-accent-600 dark:text-accent-400">quota-crushing</span> role
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-5">
                Browse exclusive sales opportunities at top-tier companies.
              </p>
              {/* Search bar moved into banner */}
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-1.5 rounded-xl shadow-subtle border border-neutral-200 dark:border-neutral-800 w-full max-w-2xl mx-auto md:mx-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search by job title, company, or location..."
                    className="w-full h-10 pl-9 pr-3 rounded-lg focus:outline-none bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 text-sm truncate"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button className="h-10 px-4 sm:px-6 bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm rounded-lg transition-colors shrink-0">
                  Search
                </button>
              </div>
            </div>
            <div className="w-48 h-48 md:w-56 md:h-56 shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}images/browse_jobs_seeker.png`}
                alt="Job Seeker 3D Character"
                className="w-full h-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
          {/* Filter row */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 mt-6 justify-center md:justify-start">
            <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 px-3 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-800 w-full sm:w-auto">
              <Filter size={16} className="text-neutral-400 shrink-0" />
              <select 
                className="bg-transparent text-sm text-neutral-900 dark:text-neutral-100 outline-none cursor-pointer border-none p-0 w-full sm:w-auto"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="All">All Job Types</option>
                <option value="Freelance">Freelance</option>
                <option value="Contract">Contract</option>
                <option value="Remote">Remote</option>
                <option value="Full-time">Full-time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {filteredJobs.length === 0 ?
          <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <Briefcase className="mx-auto h-12 w-12 text-neutral-300 dark:text-neutral-700 mb-4" />
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                No jobs found
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400">
                Try adjusting your search terms or filters.
              </p>
              <Button
              variant="outline"
              className="mt-6"
              onClick={() => {
                setSearchTerm('');
                setFilterType('All');
              }}>
              
                Clear Filters
              </Button>
            </div> :

          displayedJobs.map((job, index) =>
          <motion.div
            key={job.id}
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: index * 0.05
            }}>
            
                <Link to={`/jobs/${job.id}`} className="block group">
                  <div className="bg-white dark:bg-neutral-900 p-5 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-accent-300 dark:hover:border-accent-700 transition-all duration-200">
                    
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 md:gap-4 w-full md:w-auto overflow-hidden">
                        {job.companyLogoUrl ? (
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                            <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white font-bold text-xl flex-shrink-0 group-hover:bg-accent-600 group-hover:text-white transition-colors">
                            {job.companyName?.charAt(0) || 'C'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors leading-tight mb-1 truncate">
                            {job.title}
                          </h3>
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                            <Link 
                              to={`/company/${job.companyId}`}
                              className="hover:text-accent-600 transition-colors flex items-center gap-1 truncate max-w-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="truncate">{job.companyName}</span>
                              {job.companyIsVerified && <BadgeCheck size={14} className="text-blue-500 shrink-0" />}
                            </Link>
                            <span className="hidden md:inline text-neutral-300 dark:text-neutral-600 shrink-0">•</span>
                            <span className="text-neutral-500 text-xs md:text-sm flex items-center gap-1 shrink-0">
                              <MapPin size={14} /> {job.location || 'Flexible'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="hidden md:flex flex-col items-end shrink-0">
                        <span className="text-xs font-medium text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 px-2.5 py-1 rounded-md">
                          {formatRelativeTime(job.createdAt || (job as any).created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4 mt-2">
                      {job.salaryRange && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-lg">
                          <Banknote size={14} /> {getCurrencySymbol(job.currency)}{job.salaryRange}
                        </span>
                      )}
                      {job.commissionRange && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg">
                          <TrendingUp size={14} /> OTE {getCurrencySymbol(job.currency)}{job.commissionRange}
                        </span>
                      )}
                      {!job.salaryRange && !job.commissionRange && (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-lg">
                          <Banknote size={14} /> Competitive
                        </span>
                      )}
                      {job.isRemote ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20">
                          Remote
                        </span>
                      ) : job.employment_type ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-lg text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20">
                          <Briefcase size={14} /> {job.employment_type}
                        </span>
                      ) : null}
                    </div>

                    <div className="mb-5 space-y-2">
                      {job.description && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">Role: </strong>
                          {job.description.replace(/<[^>]+>/g, '')}
                        </p>
                      )}
                      {job.requirements && job.requirements.length > 0 && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          <strong className="text-neutral-900 dark:text-neutral-200 font-semibold">Requirements: </strong>
                          {job.requirements.join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-4 border-t border-neutral-100 dark:border-neutral-800/50">
                      <span className="md:hidden text-xs font-medium text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 px-2.5 py-1 rounded-md">
                        {formatRelativeTime(job.createdAt || (job as any).created_at)}
                      </span>
                      <div className="hidden md:block flex-1"></div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto w-auto group-hover:bg-accent-600 group-hover:text-white group-hover:border-accent-600 transition-colors shadow-sm">
                        View Details
                      </Button>
                    </div>
                    
                  </div>
                </Link>
              </motion.div>
          )
          }
          
          {filteredJobs.length > visibleCount && (
            <div className="flex justify-center mt-10">
              <Button
                variant="outline"
                className="px-8 py-2.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-700 shadow-sm transition-all"
                onClick={() => setVisibleCount(v => v + 5)}
              >
                See More Jobs
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>);

};