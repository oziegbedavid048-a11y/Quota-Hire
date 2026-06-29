import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PhoneMockup = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'jobs' | 'tracker' | 'profile'>('dashboard');

  return (
    <div className="relative w-[280px] sm:w-[300px]">
      {/* Ambient glow */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-30 bg-accent-500 scale-75 rounded-full" />

      {/* Phone frame */}
      <div className="relative bg-neutral-900 dark:bg-neutral-800 rounded-[44px] p-2.5 shadow-[0_40px_80px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] ring-1 ring-white/10">

        {/* Side buttons */}
        <div className="absolute -left-[3px] top-24 w-[3px] h-8 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-36 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -left-[3px] top-52 w-[3px] h-12 bg-neutral-700 rounded-l-sm" />
        <div className="absolute -right-[3px] top-32 w-[3px] h-16 bg-neutral-700 rounded-r-sm" />

        {/* Screen */}
        <div className="rounded-[36px] overflow-hidden relative bg-white flex flex-col h-[550px]">
          
          {/* Status bar */}
          <div className="px-6 pt-4 pb-2 flex items-center justify-between relative bg-white z-20">
            <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-20 h-6 bg-black rounded-full z-10" />
            <span className="text-neutral-900 text-xs font-semibold">9:41</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-end gap-0.5 h-3">
                {[1, 1.5, 2, 3].map((h, i) => (
                  <div key={i} className="w-0.5 bg-neutral-900 rounded-sm" style={{ height: `${h * 4}px` }} />
                ))}
              </div>
              <div className="w-5 h-2.5 border border-neutral-900 rounded-sm flex items-center px-0.5">
                <div className="h-1.5 bg-neutral-900 rounded-sm" style={{ width: '70%' }} />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-neutral-50 pb-20 custom-scrollbar relative z-10">
            {/* App header (Navbar mobile) */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-neutral-200 shadow-sm sticky top-0 z-30">
              <div className="flex items-center gap-2">
                 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-warm-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">QH</div>
                 <span className="font-display font-bold text-neutral-900">Quota Hire</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm">AJ</div>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && <MockupDashboard />}
                {activeTab === 'jobs' && <MockupJobs />}
                {activeTab === 'tracker' && <MockupTracker />}
                {activeTab === 'profile' && <MockupProfile />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom nav bar */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.03)]">
            <div className="flex justify-around items-center px-2 py-3">
              <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<path d="M22 12 18 12 15 21 9 3 6 12 2 12"/>} label="Dashboard" />
              <NavButton active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>} label="Jobs" />
              <NavButton active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} icon={<><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>} label="Tracker" />
              <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>} label="Profile" />
            </div>
            {/* Home indicator */}
            <div className="pb-2 flex justify-center">
              <div className="w-24 h-1.5 rounded-full bg-neutral-300" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: any) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${active ? 'text-accent-600' : 'text-neutral-400 hover:text-neutral-600'}`}>
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">{icon}</svg>
    <span className={`text-[9px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
  </div>
);

const MockupDashboard = () => (
  <div className="p-4 space-y-4">
    {/* Welcome Banner */}
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/10 via-white to-warm-500/10 border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-600 bg-white/60 px-2 py-0.5 rounded-full border border-neutral-200/50">
          <svg className="w-3 h-3 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          My Dashboard
        </span>
      </div>
      <h1 className="text-lg font-extrabold text-neutral-900 mb-1 leading-tight">
        Ready to crush it, <span className="text-accent-600">Alex!</span>
      </h1>
      <p className="text-neutral-600 text-[10px] max-w-md">
        You have <strong className="text-neutral-900">12 active applications</strong>.
      </p>
    </div>

    {/* Stat Cards Grid */}
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm hover:-translate-y-0.5 transition-transform">
        <div className="w-8 h-8 rounded-xl bg-accent-50 flex items-center justify-center mb-2">
          <svg className="w-4 h-4 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
        <p className="text-xl font-extrabold text-neutral-900">12</p>
        <p className="text-[10px] font-semibold text-neutral-500">Active Applications</p>
      </div>
      <div className="bg-white rounded-2xl p-3 border border-neutral-100 shadow-sm hover:-translate-y-0.5 transition-transform">
        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-2">
          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
        </div>
        <p className="text-xl font-extrabold text-neutral-900">80%</p>
        <p className="text-[10px] font-semibold text-neutral-500">Profile Score</p>
      </div>
    </div>

    {/* Recent Applications */}
    <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm">
       <div className="flex justify-between items-center mb-3">
         <h2 className="text-sm font-extrabold text-neutral-900">Recent Applications</h2>
       </div>
       <div className="space-y-2">
         {[
           { icon: 'S', title: 'Sr. Account Exec', company: 'Northwind Cloud', status: 'Under Review', color: 'amber' },
           { icon: 'E', title: 'Enterprise AE', company: 'Helios SaaS', status: 'Interview', color: 'purple' },
           { icon: 'G', title: 'Growth Marketer', company: 'Ozone Apps', status: 'Applied', color: 'neutral' }
         ].map((app, i) => (
           <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-neutral-100 bg-neutral-50 shadow-sm">
             <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-100 to-warm-100 flex items-center justify-center text-accent-600 font-extrabold text-xs shadow-sm border border-white/50">{app.icon}</div>
             <div className="flex-1 min-w-0">
               <p className="text-[11px] font-bold text-neutral-900 truncate">{app.title}</p>
               <p className="text-[9px] text-neutral-500 font-medium mt-0.5">{app.company}</p>
             </div>
             <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold bg-${app.color}-50 text-${app.color}-700`}>{app.status}</span>
           </div>
         ))}
       </div>
    </div>
  </div>
);

const MockupJobs = () => (
  <div className="p-4 space-y-4">
    {/* Jobs Hero */}
    <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-warm-50 to-accent-50 border border-neutral-100 p-4 shadow-sm">
       <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-accent-600 bg-accent-100 px-2.5 py-1 rounded-full mb-2">
         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg> Browse Roles
       </span>
       <h1 className="text-sm font-bold text-neutral-900 mb-2">Find your next role</h1>
       <div className="flex items-center gap-2 bg-white p-1 rounded-lg shadow-sm border border-neutral-200">
         <svg className="ml-2 w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
         <input type="text" placeholder="Search roles..." className="w-full text-[10px] bg-transparent outline-none h-6 text-neutral-900 placeholder:text-neutral-400" disabled />
       </div>
    </div>

    {/* Jobs List */}
    <div className="space-y-3">
      {[
        { title: 'Enterprise Account Exec', company: 'GlobalTech', loc: 'Remote', salary: '$120k Base', initial: 'G' },
        { title: 'Senior SDR', company: 'Salesforce', loc: 'San Francisco', salary: '$80k Base', initial: 'S' },
        { title: 'VP of Sales', company: 'Acme Corp', loc: 'Remote', salary: 'OTE $180k', initial: 'A' },
      ].map((job, i) => (
        <div key={i} className="bg-white p-3.5 rounded-2xl border border-neutral-200 shadow-sm hover:border-accent-300 transition-colors">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-900 font-bold text-sm shrink-0 border border-neutral-200">
              {job.initial}
            </div>
            <div>
              <h3 className="text-[12px] font-bold text-neutral-900 leading-tight mb-0.5">{job.title}</h3>
              <p className="text-[10px] text-neutral-500 font-medium">{job.company} • {job.loc}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
             <span className="inline-flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded">
               <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>
               {job.salary}
             </span>
             <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
               Remote
             </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MockupTracker = () => (
  <div className="p-4 space-y-4">
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent-500/10 via-white to-warm-500/10 border border-neutral-100 p-4 shadow-sm text-center">
       <h1 className="text-base font-extrabold text-neutral-900 tracking-tight mb-1">
         Application Tracker
       </h1>
       <div className="flex justify-center gap-2 mt-3">
          <div className="bg-white border border-neutral-200 rounded-lg px-2 py-1.5 text-center min-w-[50px] shadow-sm">
            <div className="text-sm font-extrabold text-neutral-900">12</div>
            <div className="text-[8px] text-neutral-500 font-semibold mt-0.5">Total</div>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg px-2 py-1.5 text-center min-w-[50px] shadow-sm">
            <div className="text-sm font-extrabold text-neutral-900">3</div>
            <div className="text-[8px] text-neutral-500 font-semibold mt-0.5">Interviews</div>
          </div>
       </div>
    </div>

    <div className="space-y-3">
      {[
        { title: 'Enterprise AE', company: 'Helios SaaS', status: 'Interview', color: 'purple', date: '2 days ago' },
        { title: 'Sr. Account Exec', company: 'Northwind Cloud', status: 'Under Review', color: 'amber', date: '1 wk ago' },
        { title: 'Sales Manager', company: 'Stripe', status: 'Offer Received', color: 'emerald', date: 'Just now' },
      ].map((app, i) => (
        <div key={i} className="p-3 bg-white border border-neutral-100 shadow-sm rounded-xl hover:-translate-y-0.5 transition-transform">
           <div className="flex items-start justify-between gap-2 mb-2">
             <h3 className="font-bold text-neutral-900 text-[11px] leading-snug flex-1">{app.title}</h3>
             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-bold bg-${app.color}-50 text-${app.color}-700 shrink-0`}>
               {app.status}
             </span>
           </div>
           <div className="flex items-center gap-2 text-[9px] text-neutral-500 font-medium mt-1">
             <span className="flex items-center gap-0.5"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>{app.company}</span>
             <span>•</span>
             <span className="flex items-center gap-0.5"><svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{app.date}</span>
           </div>
        </div>
      ))}
    </div>
  </div>
);

const MockupProfile = () => (
  <div className="p-4 space-y-4">
    <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm text-center relative overflow-hidden">
       <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-accent-500 to-warm-500 opacity-20"></div>
       <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center text-white text-xl font-bold ring-4 ring-white shadow-sm mx-auto mb-3 relative z-10">AJ</div>
       <h2 className="text-sm font-extrabold text-neutral-900">Alex Johnson</h2>
       <p className="text-[10px] text-neutral-500 font-medium mt-0.5">Senior Account Executive</p>
       <div className="flex items-center justify-center gap-1 mt-2">
         <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">80% Profile Score</span>
       </div>
    </div>
    
    <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm">
      <h3 className="text-[11px] font-extrabold text-neutral-900 mb-2 flex items-center gap-1"><svg className="w-3 h-3 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>Core Skills</h3>
      <div className="flex flex-wrap gap-1.5">
        {['B2B Sales', 'Enterprise Closing', 'SaaS', 'Salesforce', 'Cold Calling'].map(skill => (
          <span key={skill} className="px-2 py-1 bg-neutral-50 border border-neutral-200 text-neutral-700 text-[9px] font-bold rounded-lg shadow-sm">{skill}</span>
        ))}
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-neutral-100 p-4 shadow-sm">
      <h3 className="text-[11px] font-extrabold text-neutral-900 mb-3 flex items-center gap-1"><svg className="w-3 h-3 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>Experience</h3>
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-50 text-accent-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-accent-100">TC</div>
        <div>
          <div className="text-[11px] font-bold text-neutral-900 leading-none">Account Executive</div>
          <div className="text-[9px] text-neutral-500 mt-1">TechCorp • 2020 - Present</div>
          <p className="text-[9px] text-neutral-600 mt-1.5 leading-relaxed">Consistently exceeded quota by 120% YoY. Closed $2.5M in new ARR.</p>
        </div>
      </div>
    </div>
  </div>
);
