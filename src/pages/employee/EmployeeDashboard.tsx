import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Heart,
  ArrowRight,
  Search,
  BadgeCheck,
  ChevronRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Target,
  Zap,
  Activity,
  FileText
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';
import { useAppContext } from '../../context/AppContext';
import { EmployeeProfile } from '../../types';
import { calculateProfileStrength } from '../../utils/profile';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

// Removed PIE_COLORS constant

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

interface Props {
  user: EmployeeProfile;
  analytics: any;
  analyticsLoading: boolean;
}

export const EmployeeDashboardPage = ({ user, analytics, analyticsLoading }: Props) => {
  const navigate = useNavigate();
  const { jobs, applications, applyForJob, toggleSavedJob, savedJobs } = useAppContext();

  const approvedJobs = jobs.filter((j: any) => j.status === 'approved');
  const profileScore = calculateProfileStrength(user);

  // Real backend data — no fallbacks with mock numbers
  const skillMatchData: any[] = analytics?.skillMatchData || [];
  const applicationActivityData: any[] = analytics?.applicationActivityData || [];
  const marketInsightsData: any[] = analytics?.marketInsightsData || [];
  const activeApps: number = analytics?.activeApps ?? applications.length;

  const pendingApps = applications.filter(a => a.status === 'pending').length;
  const underReviewApps = applications.filter(a => a.status === 'under_review').length;
  const interviewApps = applications.filter(a => a.status === 'interview').length;
  const decisionApps = applications.filter(a => a.status === 'decision').length;
  const acceptedApps = applications.filter(a => a.status === 'accepted').length;
  const rejectedApps = applications.filter(a => a.status === 'rejected').length;

  const appStatusPie = [
    { name: 'Applied', value: pendingApps, color: '#9ca3af' },
    { name: 'Under Review', value: underReviewApps, color: '#f59e0b' },
    { name: 'Interview', value: interviewApps, color: '#a855f7' },
    { name: 'Decision', value: decisionApps, color: '#3b82f6' },
    { name: 'Offer', value: acceptedApps, color: '#10b981' },
    { name: 'Rejected', value: rejectedApps, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const profileItems = [
    { label: 'Full Name', done: !!user?.name },
    { label: 'Current Title', done: !!user?.title },
    { label: 'Professional Summary', done: !!user?.bio },
    { label: 'Core Skills', done: !!(user?.skills && user.skills.length > 0) },
    { label: 'Education Background', done: !!user?.education },
    { label: 'Resume / Portfolio', done: !!user?.resumeUrl },
  ];

  const firstName = user?.name?.split(' ')[0] || 'there';

  const handleQuickApply = (e: React.MouseEvent, jobId: string, jobTitle: string) => {
    e.stopPropagation();
    applyForJob(jobId, `Applying for ${jobTitle}`);
  };

  const handleSaveJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    toggleSavedJob(jobId);
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6 pb-8">

      {/* ── HERO BANNER ── */}


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
                <Activity size={12} className="text-accent-500" /> My Dashboard
              </span>
              {user?.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-neutral-200/50 dark:border-neutral-700/50">
                  <BadgeCheck size={12} className="text-blue-500" /> Verified
                </span>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-2 leading-tight">
              Ready to crush it, <span className="text-accent-600 dark:text-accent-400">{firstName}!</span>
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm max-w-md mb-5">
              You have <strong className="text-neutral-900 dark:text-white">{activeApps} active application{activeApps !== 1 ? 's' : ''}</strong> and{' '}
              <strong className="text-neutral-900 dark:text-white">{savedJobs?.length || 0} saved role{(savedJobs?.length || 0) !== 1 ? 's' : ''}</strong>.
              Keep pushing — your next role is waiting.
            </p>
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              <button
                onClick={() => navigate('/jobs')}
                className="inline-flex items-center gap-2 bg-accent-600 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:bg-accent-700 transition-all"
              >
                <Search size={16} /> Browse Jobs
              </button>
              <button
                onClick={() => navigate('/employee/cv-generator')}
                className="inline-flex items-center gap-2 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all"
              >
                <Sparkles size={16} className="text-warm-500" /> CV Generator
              </button>
            </div>
          </div>

          <div className="w-40 h-40 md:w-52 md:h-52 shrink-0 mb-4 md:mb-0">
            <img
              src={`${import.meta.env.BASE_URL}images/employee_welcome.png`}
              alt="Welcome 3D Character"
              className="w-full h-full object-contain drop-shadow-2xl animate-float"
            />
          </div>
        </div>
      </motion.div>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Applications"
          value={analyticsLoading ? '—' : activeApps}
          icon={Briefcase}
          color="bg-accent-50 text-accent-600"
          sub={`${pendingApps} pending review`}
          onClick={() => navigate('/employee/tracker')}
        />
        <StatCard
          label="Saved Roles"
          value={savedJobs?.length || 0}
          icon={Heart}
          color="bg-warm-50 text-warm-500"
          sub="Jobs bookmarked"
          onClick={() => navigate('/saved-jobs')}
        />
        <StatCard
          label="Profile Score"
          value={`${profileScore}%`}
          icon={Target}
          color="bg-emerald-50 text-emerald-600"
          sub={profileScore === 100 ? 'Fully complete!' : 'Complete your profile'}
          onClick={() => navigate('/employee/profile')}
        />
        <StatCard
          label="Interviews Won"
          value={analyticsLoading ? '—' : acceptedApps}
          icon={CheckCircle2}
          color="bg-violet-50 text-violet-600"
          sub="Applications accepted"
        />
      </div>

      {/* ── CHARTS ROW: Application Activity + App Status Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Application Activity — Bar Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Application Activity</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Applications & interview invites per week</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 bg-accent-50 dark:bg-accent-900/20 px-3 py-1 rounded-lg">
              <Activity size={12} /> 4-Week View
            </span>
          </div>
          {analyticsLoading ? (
            <div className="h-52 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
          ) : applicationActivityData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-center">
              <FileText size={32} className="text-neutral-200 dark:text-neutral-700 mb-2" />
              <p className="text-sm text-neutral-400 font-medium">No application activity yet</p>
              <p className="text-xs text-neutral-300 mt-1">Start applying to see your activity here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={applicationActivityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 13 }} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Bar dataKey="apps" name="Applications" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="interviews" name="Interviews" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Application Status Pie */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Pipeline Breakdown</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Status of your applications</p>
          </div>
          {analyticsLoading ? (
            <div className="flex items-center justify-center h-44">
              <div className="w-32 h-32 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
            </div>
          ) : appStatusPie.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center">
              <p className="text-sm text-neutral-400 font-medium">No applications yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={appStatusPie} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                  {appStatusPie.map((entry: any, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── CHARTS ROW 2: Skill Match Radar + Market Insights Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Skill Match Radar */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Skill Match Analysis</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Your skills vs. market demand</p>
            </div>
          </div>
          {analyticsLoading ? (
            <div className="h-56 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
          ) : skillMatchData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center">
              <Target size={32} className="text-neutral-200 dark:text-neutral-700 mb-2" />
              <p className="text-sm text-neutral-400 font-medium">No skill data available</p>
              <p className="text-xs text-neutral-300 mt-1">Add skills to your profile to see your match</p>
              <button onClick={() => navigate('/employee/profile')} className="mt-3 text-xs font-bold text-accent-600 bg-accent-50 px-3 py-1.5 rounded-lg">Add Skills →</button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={skillMatchData}>
                <PolarGrid stroke="#e5e7eb" strokeWidth={1.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Your Skills" dataKey="A" stroke="#f59e0b" strokeWidth={2.5} fill="#f59e0b" fillOpacity={0.4} />
                <Radar name="Market Demand" dataKey="B" stroke="#6366f1" strokeWidth={2.5} fill="#6366f1" fillOpacity={0.15} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Market Insights — OTE vs Base Area Chart */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Market Salary Trends</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Average Base vs. OTE over 6 months</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
              <TrendingUp size={12} /> Live
            </span>
          </div>
          {analyticsLoading ? (
            <div className="h-56 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-xl" />
          ) : marketInsightsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-center">
              <TrendingUp size={32} className="text-neutral-200 dark:text-neutral-700 mb-2" />
              <p className="text-sm text-neutral-400 font-medium">Not enough market data yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={marketInsightsData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="oteGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="baseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', fontSize: 12 }}
                  formatter={(value: any) => [`$${Number(value).toLocaleString()}`, undefined]}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Area type="monotone" dataKey="ote" name="OTE" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#oteGradient)" dot={{ fill: '#6366f1', r: 3, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="base" name="Base" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#baseGradient)" dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* ── BOTTOM GRID: Recent Applications + Profile Completion + Quick Tips ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Applications List */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Recent Applications</h2>
            <button onClick={() => navigate('/employee/tracker')} className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-accent-50 rounded-2xl mb-4">
                <Briefcase size={28} className="text-accent-400" />
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 font-semibold mb-1 text-sm">No applications yet</p>
              <p className="text-neutral-400 text-xs mb-4">Start applying to land your next sales role</p>
              <button onClick={() => navigate('/jobs')} className="inline-flex items-center gap-2 bg-accent-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-accent-700 transition-colors">
                <Search size={14} /> Browse Jobs
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.slice(0, 5).map((app: any) => {
                const statusConfig: Record<string, { label: string; dotColor: string; chipClass: string }> = {
                  pending:      { label: 'Applied',          dotColor: 'bg-neutral-400',   chipClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400' },
                  under_review: { label: 'Under Review',     dotColor: 'bg-amber-500',     chipClass: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' },
                  interview:    { label: 'Interview',        dotColor: 'bg-purple-500',    chipClass: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400' },
                  decision:     { label: 'Decision Pending', dotColor: 'bg-blue-500',      chipClass: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' },
                  accepted:     { label: 'Offer Received',   dotColor: 'bg-emerald-500',   chipClass: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' },
                  rejected:     { label: 'Not Selected',     dotColor: 'bg-red-400',       chipClass: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' },
                };
                const s = statusConfig[app.status] || statusConfig['pending'];
                return (
                  <button 
                    key={app.id} 
                    onClick={() => navigate('/employee/tracker')}
                    className="w-full text-left flex items-center gap-4 p-3.5 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all cursor-pointer group hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-100 to-warm-100 flex items-center justify-center text-accent-600 font-extrabold text-sm shrink-0 shadow-sm border border-white/50">
                      {app.job_title?.charAt(0) || 'J'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate group-hover:text-accent-600 transition-colors">{app.job_title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5 font-medium">{app.company_name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${s.chipClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dotColor} shrink-0`} />
                        {s.label}
                      </span>
                      <ChevronRight size={14} className="text-neutral-300 group-hover:text-accent-500 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Right Panel */}
        <div className="space-y-6">

          {/* Profile Completion */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                <Target size={16} className="text-accent-500" /> Profile Score
              </h2>
              <span className="text-lg font-extrabold text-accent-600">{profileScore}%</span>
            </div>
            <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 mb-5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${profileScore}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-accent-500 to-warm-500 rounded-full"
              />
            </div>
            <div className="space-y-2.5">
              {profileItems.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className={item.done ? 'text-emerald-500' : 'text-neutral-200 dark:text-neutral-700'} />
                  <span className={`text-xs font-semibold ${item.done ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            {profileScore < 100 && (
              <button
                onClick={() => navigate('/employee/profile')}
                className="mt-4 w-full text-xs font-bold text-accent-600 hover:text-accent-700 bg-accent-50 hover:bg-accent-100 py-2 rounded-xl transition-colors"
              >
                Complete Profile →
              </button>
            )}
          </motion.div>


        </div>
      </div>

      {/* ── RECOMMENDED JOBS ── */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900 dark:text-white">Recommended Roles</h2>
            <p className="text-xs text-neutral-400 mt-0.5">Top approved jobs matching your profile</p>
          </div>
          <button onClick={() => navigate('/jobs')} className="text-xs font-bold text-accent-600 hover:text-accent-700 flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>

        {approvedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Search size={28} className="text-neutral-200 dark:text-neutral-700 mb-2" />
            <p className="text-sm text-neutral-400">No matching roles right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {approvedJobs.slice(0, 3).map((job: any) => (
              <div
                key={job.id}
                className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/jobs/${job.id}`)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 flex items-center justify-center text-neutral-500 font-bold text-sm shadow-sm border border-neutral-100 dark:border-neutral-800">
                    {job.companyName?.charAt(0) || 'C'}
                  </div>
                  <button
                    onClick={(e) => handleSaveJob(e, job.id)}
                    className={`p-1.5 rounded-lg transition-all ${savedJobs?.includes(job.id) ? 'bg-warm-100 text-warm-500' : 'text-neutral-300 hover:text-warm-400 hover:bg-warm-50'}`}
                  >
                    <Heart size={16} className={savedJobs?.includes(job.id) ? 'fill-warm-500' : ''} />
                  </button>
                </div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white line-clamp-1 mb-1 group-hover:text-accent-600 transition-colors">{job.title}</h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1 mb-3">
                  {job.companyName}
                  {job.companyIsVerified && <BadgeCheck size={12} className="text-blue-500" />}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-xs font-medium rounded-md">
                    {job.location || 'Remote'}
                  </span>
                  {job.salaryRange && (
                    <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium rounded-md">
                      {job.salaryRange}
                    </span>
                  )}
                  {job.commissionRange && (
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-medium rounded-md">
                      OTE {job.commissionRange}
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => handleQuickApply(e, job.id, job.title)}
                  className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold py-2 rounded-lg hover:bg-accent-600 dark:hover:bg-accent-100 transition-colors"
                >
                  Quick Apply
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};
