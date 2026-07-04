import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  MapPin,
  BarChart3,
  Target,
  Zap,
  Building2,
  BadgeCheck,
  ChevronRight,
  Star,
  Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { apiFetch } from '../../context/AppContext';
import { useAppContext } from '../../context/AppContext';
import { CompanyProfile } from '../../types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];

const StatCard = ({ label, value, icon: Icon, color, sub, onClick }: any) => (
  <motion.div
    variants={itemVariants}
    onClick={onClick}
    className={`bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} />
      </div>
      {onClick && <ChevronRight size={16} className="text-neutral-300 mt-1" />}
    </div>
    <p className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">{value}</p>
    <p className="text-sm font-semibold text-neutral-500 mt-1">{label}</p>
    {sub && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
  </motion.div>
);

const SkeletonBar = () => (
  <div className="bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-lg h-6 w-full" />
);

export const CompanyDashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const company = currentUser as CompanyProfile;
  const [analytics, setAnalytics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [appsLoading, setAppsLoading] = useState(true);

  useEffect(() => {
    apiFetch('/dashboard/analytics/')
      .then(setAnalytics)
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));

    apiFetch('/company/jobs/')
      .then((d: any) => setJobs(Array.isArray(d) ? d : d?.results || []))
      .catch(() => {})
      .finally(() => setJobsLoading(false));

    apiFetch('/applications/')
      .then((d: any) => setApplications(Array.isArray(d) ? d : d?.results || []))
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }, []);

  const activeJobs = jobs.filter((j: any) => j.status === 'approved');
  const pendingJobs = jobs.filter((j: any) => j.status === 'pending');
  const totalApplicants = analytics?.totalApplicantsCount || applications.length;
  const topMatches = analytics?.topMatchesCount || 0;

  // Derived stats for pie chart
  const appStatusData = [
    { name: 'Pending', value: applications.filter(a => a.status === 'pending').length },
    { name: 'Accepted', value: applications.filter(a => a.status === 'accepted').length },
    { name: 'Rejected', value: applications.filter(a => a.status === 'rejected').length },
  ].filter(d => d.value > 0);

  const velocityData = analytics?.applicantVelocityData || [];

  const jobPerformanceData = analytics?.jobPerformanceData || [];

  const getStatusInfo = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved': return { label: 'Active', cls: 'bg-green-100 text-green-700', icon: CheckCircle2 };
      case 'pending': return { label: 'Pending', cls: 'bg-yellow-100 text-yellow-700', icon: Clock };
      case 'rejected': return { label: 'Rejected', cls: 'bg-red-100 text-red-700', icon: XCircle };
      default: return { label: 'Closed', cls: 'bg-neutral-100 text-neutral-500', icon: XCircle };
    }
  };

  const completionItems = [
    { label: 'Company Name', done: !!company?.companyName },
    { label: 'Industry', done: !!company?.industry },
    { label: 'Company Description', done: !!company?.description },
    { label: 'About Company', done: !!company?.aboutCompany },
    { label: 'Active Job Posted', done: activeJobs.length > 0 },
    { label: 'Profile Verified', done: !!company?.isVerified },
  ];
  const completionScore = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  const firstName = company?.companyName?.split(' ')[0] || company?.name?.split(' ')[0] || 'there';

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-8">

      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/10 via-white dark:via-neutral-900 to-warm-500/10 border border-neutral-100 dark:border-neutral-800 p-6 md:p-8 shadow-sm"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-warm-500/10 dark:bg-warm-500/20 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-neutral-200/50 dark:border-neutral-700/50">
                <Activity size={12} className="text-accent-500" /> Company Dashboard
              </span>
              {company?.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-neutral-200/50 dark:border-neutral-700/50">
                  <BadgeCheck size={12} className="text-blue-500" /> Verified
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2 leading-tight">
              Welcome back, <span className="text-accent-600 dark:text-accent-400">{firstName}!</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm max-w-md mb-5">
              You have <strong className="text-neutral-900 dark:text-white">{activeJobs.length} active role{activeJobs.length !== 1 ? 's' : ''}</strong> and{' '}
              <strong className="text-neutral-900 dark:text-white">{totalApplicants} applicant{totalApplicants !== 1 ? 's' : ''}</strong> in your pipeline.
              Keep building your dream team.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => navigate('/company/post-job')}
                className="inline-flex items-center gap-2 bg-accent-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:bg-accent-700 transition-all"
              >
                <Plus size={16} /> Post New Role
              </button>
              <button
                onClick={() => navigate('/company/jobs')}
                className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                Manage Roles <ArrowRight size={16} className="text-neutral-400" />
              </button>
            </div>
          </div>

          <div className="w-40 h-40 md:w-52 md:h-52 shrink-0 mb-4 md:mb-0">
            <img
              src={`${import.meta.env.BASE_URL}images/post_job_recruiter.png`}
              alt="Company 3D Illustration"
              className="w-full h-full object-contain drop-shadow-2xl animate-float"
            />
          </div>
        </div>
      </motion.div>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Roles"
          value={jobsLoading ? '—' : activeJobs.length}
          icon={Briefcase}
          color="bg-blue-50 text-blue-600"
          sub={`${pendingJobs.length} pending approval`}
          onClick={() => navigate('/company/jobs')}
        />
        <StatCard
          label="Total Applicants"
          value={analyticsLoading ? '—' : totalApplicants}
          icon={Users}
          color="bg-violet-50 text-violet-600"
          sub="Across all roles"
        />
        <StatCard
          label="Top Skill Matches"
          value={analyticsLoading ? '—' : topMatches}
          icon={Star}
          color="bg-amber-50 text-amber-600"
          sub="High-fit candidates"
        />
        <StatCard
          label="Hiring Velocity"
          value={analyticsLoading ? '—' : `${velocityData.reduce((s: number, d: any) => s + d.applicants, 0)}`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
          sub="Applications this week"
        />
      </div>

      {/* ── CHARTS ROW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Applicant Velocity – Area Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Application Flow</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Applicants per day this week</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-lg">
              <BarChart3 size={12} /> 7-Day View
            </span>
          </div>
          {analyticsLoading ? (
            <div className="space-y-3 h-52 flex flex-col justify-end">
              {[60, 40, 80, 55, 90, 70, 50].map((h, i) => (
                <div key={i} className="bg-blue-100 dark:bg-blue-900/20 animate-pulse rounded-lg" style={{ height: `${h}%` }} />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={velocityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="applicantGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 13 }}
                  cursor={{ stroke: '#3b82f6', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="applicants" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#applicantGradient)" dot={{ fill: '#3b82f6', r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: '#3b82f6' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Application Status – Pie */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Pipeline Status</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Application breakdown</p>
          </div>
          {appsLoading ? (
            <div className="flex items-center justify-center h-44">
              <div className="w-32 h-32 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={appStatusData.length ? appStatusData : [{ name: 'No data', value: 1 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {(appStatusData.length ? appStatusData : [{ name: 'No data', value: 1 }]).map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── ROLE PERFORMANCE BAR CHART ── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Role Performance</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Applicants attracted per job posting</p>
          </div>
          <button onClick={() => navigate('/company/jobs')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        {jobsLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <SkeletonBar key={i} />)}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={jobPerformanceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 13 }} cursor={{ fill: 'rgba(59,130,246,0.04)' }} />
              <Bar dataKey="applicants" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* ── BOTTOM GRID: Recent Roles + Profile Completion + Quick Tips ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Job Listings */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Your Active Roles</h2>
            <button onClick={() => navigate('/company/jobs')} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              Manage all <ArrowRight size={12} />
            </button>
          </div>

          {jobsLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />)}</div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-blue-50 rounded-2xl mb-4">
                <Briefcase size={28} className="text-blue-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 font-semibold mb-1 text-sm">No roles posted yet</p>
              <p className="text-neutral-400 text-xs mb-4">Start attracting top sales talent</p>
              <button onClick={() => navigate('/company/post-job')} className="inline-flex items-center gap-2 bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus size={14} /> Post Your First Role
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map((job: any) => {
                const status = getStatusInfo(job.status);
                const StatusIcon = status.icon;
                return (
                  <div key={job.id} className="flex items-center gap-4 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-extrabold text-sm shrink-0">
                      {job.title?.charAt(0) || 'J'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">{job.title}</p>
                      <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {job.location || 'Remote'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${status.cls}`}>
                        <StatusIcon size={11} /> {status.label}
                      </span>
                      <button
                        onClick={() => navigate('/company/jobs')}
                        className="p-1.5 text-neutral-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right Side Panel */}
        <div className="space-y-6">

          {/* Profile Completion */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-blue-500" /> Profile Score
              </h2>
              <span className="text-lg font-extrabold text-blue-600">{completionScore}%</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 mb-5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completionScore}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
              />
            </div>
            <div className="space-y-2.5">
              {completionItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className={item.done ? 'text-emerald-500' : 'text-neutral-200 dark:text-neutral-700'} />
                  <span className={`text-xs font-semibold ${item.done ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {completionScore < 100 && (
              <button
                onClick={() => navigate('/company/profile')}
                className="mt-4 w-full text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors"
              >
                Complete Profile →
              </button>
            )}
          </motion.div>


        </div>
      </div>

    </motion.div>
  );
};
