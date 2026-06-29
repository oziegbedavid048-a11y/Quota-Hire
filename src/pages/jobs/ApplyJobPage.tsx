import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building, Briefcase, MapPinned, FileText,
  GraduationCap, PenTool, Loader2
} from 'lucide-react';
import { EmployeeProfile } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';
import { ApplyJobCVWizard } from '../../components/cv/ApplyJobCVWizard';
import { apiFetch } from '../../context/AppContext';

type FlowState = 'step1' | 'transition' | 'step2' | 'submitting' | 'success';

export const ApplyJobPage = () => {
  const { id } = useParams<{ id: string }>();
  const { jobs, currentUser, applyForJob, updateProfile } = useAppContext();
  const navigate = useNavigate();
  
  const job = jobs.find((j) => String(j.id) === String(id));
  const profile = currentUser as EmployeeProfile;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [flowState, setFlowState] = useState<FlowState>('step1');
  const [progress, setProgress] = useState(0);
  const [isContinuing, setIsContinuing] = useState(false);

  // CV Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [generatedCvId, setGeneratedCvId] = useState<number | null>(null);

  // Saved CVs State
  const [savedCvs, setSavedCvs] = useState<any[]>([]);
  const [loadingCvs, setLoadingCvs] = useState(false);

  const fetchCvs = async () => {
    setLoadingCvs(true);
    try {
      const cvs = await apiFetch('/cv/my-cvs/');
      setSavedCvs(Array.isArray(cvs) ? cvs : (cvs?.results || []));
    } catch (err) {
      console.error('Failed to fetch CVs', err);
    } finally {
      setLoadingCvs(false);
    }
  };

  useEffect(() => {
    if (profile && flowState === 'step2') {
      fetchCvs();
    }
  }, [profile, flowState]);

  const [formData, setFormData] = useState({
    fullName: '',
    country: '',
    city: '',
    postalCode: '',
    streetAddress: '',
    phoneNumber: '',
    education: '',
    experienceYears: 0,
    skills: '',
  });

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        fullName: profile.name || prev.fullName,
        country: profile.country || prev.country,
        city: profile.city || prev.city,
        postalCode: profile.postalCode || prev.postalCode,
        streetAddress: profile.streetAddress || prev.streetAddress,
        phoneNumber: profile.phoneNumber || prev.phoneNumber,
        education: profile.education || prev.education,
        experienceYears: profile.experienceYears || prev.experienceYears,
        skills: profile.skills ? profile.skills.join(', ') : prev.skills,
      }));
    }
  }, [profile?.id]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-neutral-50 dark:bg-[#0a0a0a]">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-2">Job not found</h2>
          <button
            onClick={() => navigate('/jobs')}
            className="text-accent-600 font-bold"
          >
            ← Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const startProgressBar = () => {
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += 4;
      setProgress(p);
      if (p >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTimeout(() => setFlowState('step2'), 400);
      }
    }, 80);
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsContinuing(true);
    try {
      // Save contact info to profile
      await updateProfile({
        name: formData.fullName,
        country: formData.country,
        city: formData.city,
        postalCode: formData.postalCode,
        streetAddress: formData.streetAddress,
        phoneNumber: formData.phoneNumber,
      });
      setFlowState('transition');
      startProgressBar();
    } catch {
      toast.error('Could not save your details. Please try again.');
    } finally {
      setIsContinuing(false);
    }
  };

  const handleSubmit = async () => {
    setFlowState('submitting');
    try {
      // Save any final changes from the review step
      await updateProfile({
        name: formData.fullName,
        country: formData.country,
        city: formData.city,
        postalCode: formData.postalCode,
        streetAddress: formData.streetAddress,
        phoneNumber: formData.phoneNumber,
        education: formData.education,
        experienceYears: formData.experienceYears,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      });

      // Submit the application, linking the generated CV if one was created
      await applyForJob(job.id, '', generatedCvId || undefined);
      setFlowState('success');
    } catch {
      // applyForJob already toasts the error; revert so user can retry
      setFlowState('step2');
    }
  };

  const JobHeader = () => (
    <div className="flex items-center gap-4 px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/60 shrink-0">
      <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
        {job.companyLogoUrl ? (
          <img src={job.companyLogoUrl} alt={job.companyName} className="w-full h-full object-cover" />
        ) : (
          <span className="font-black text-xl text-neutral-400">{job.companyName?.charAt(0) || 'C'}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-base sm:text-lg font-extrabold text-neutral-900 dark:text-white truncate">{job.title}</h2>
        <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-neutral-500 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1"><Building size={13} /> {job.companyName}</span>
          {job.isRemote ? (
            <span className="flex items-center gap-1"><Briefcase size={13} /> Remote</span>
          ) : job.employment_type ? (
            <span className="flex items-center gap-1"><Briefcase size={13} /> {job.employment_type}</span>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#111] flex flex-col items-center py-4 sm:py-10 px-4 sm:px-6">
      
      {/* Top Navigation */}
      <div className="w-full max-w-2xl mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(`/jobs/${job.id}`)}
          className="flex items-center gap-2 text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to Job Details
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={flowState}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-white dark:bg-[#111] rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col min-h-[500px]"
        >
          {/* Step 1 – Contact Info Form */}
          {flowState === 'step1' && (
            <>
              <JobHeader />
              <div className="flex-1 p-6 sm:p-8">
                <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mb-1">Contact Information</h3>
                <p className="text-sm text-neutral-500 mb-6">Confirm your details before we send your application.</p>

                <form onSubmit={handleContinue} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Phone Number *</label>
                    <input
                      required
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Country *</label>
                      <input
                        required
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">City *</label>
                      <input
                        required
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1.5">Street Address</label>
                      <input
                        type="text"
                        value={formData.streetAddress}
                        onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                        className="w-full rounded-xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-accent-500 focus:border-accent-500 outline-none transition"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={isContinuing}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-60 shadow-md"
                    >
                      {isContinuing ? <Loader2 size={16} className="animate-spin" /> : null}
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* Transition – Reviewing */}
          {flowState === 'transition' && (
            <div className="flex-1 p-6 sm:p-12 flex flex-col items-center justify-center text-center">
              <div className="w-48 h-48 sm:w-72 sm:h-72 mb-6 sm:mb-8 relative">
                <div className="absolute inset-0 bg-accent-500/10 blur-3xl rounded-full"></div>
                <img
                  src={`${import.meta.env.BASE_URL}images/reviewing_app_3d.png`}
                  alt="Reviewing"
                  className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                  style={{ animation: 'float 3s ease-in-out infinite' }}
                />
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-neutral-900 dark:text-white mb-2 tracking-tight">
                Preparing Application
              </h3>
              <p className="text-sm text-neutral-500 font-medium mb-10 h-5">
                {progress < 40 ? "Analyzing your profile..." : progress < 80 ? "Matching job requirements..." : "Finalizing documents..."}
              </p>
              
              <div className="w-full max-w-sm relative mx-auto">
                <motion.div 
                  className="absolute -top-8 font-bold text-sm text-accent-600 dark:text-accent-400 flex flex-col items-center drop-shadow-sm"
                  animate={{ left: `calc(${progress}% - 16px)` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                >
                  {progress}%
                </motion.div>

                <div className="w-full bg-neutral-100 dark:bg-neutral-800/80 rounded-full h-3 sm:h-4 p-0.5 shadow-inner border border-neutral-200/50 dark:border-neutral-700/50">
                  <motion.div
                    className="bg-gradient-to-r from-accent-400 via-accent-500 to-accent-600 h-full rounded-full shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: "linear", duration: 0.1 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2 – Review Application */}
          {flowState === 'step2' && (
            <>
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 text-center shrink-0 bg-neutral-50 dark:bg-neutral-900/60">
                <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">Review Your Application</h2>
                <p className="text-neutral-500 text-sm mt-1">Confirm everything looks right before submitting.</p>
              </div>
              <div className="flex-1 p-6 sm:p-8 space-y-6">

                {/* Contact Info */}
                <section>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                    <MapPinned size={18} className="text-accent-500" /> Contact Information
                  </h3>
                  <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1 block">Full Name</label>
                      <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} className="w-full text-sm font-bold text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-accent-500 outline-none pb-1" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">Email</p>
                      <p className="font-bold text-sm text-neutral-900 dark:text-white truncate pb-1">{profile?.email || '—'}</p>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1 block">Phone Number</label>
                      <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} className="w-full text-sm font-bold text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-accent-500 outline-none pb-1" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1 block">Location (City, Country)</label>
                      <input type="text" value={`${formData.city}, ${formData.country}`} onChange={e => {
                        const parts = e.target.value.split(',');
                        setFormData({ ...formData, city: parts[0]?.trim() || '', country: parts[1]?.trim() || '' });
                      }} className="w-full text-sm font-bold text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-accent-500 outline-none pb-1" placeholder="City, Country" />
                    </div>
                  </div>
                </section>

                {/* Resume Info */}
                <section>
                  <h3 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center gap-2 mb-3">
                    <FileText size={18} className="text-accent-500" /> Resume Information
                  </h3>
                  <div className="bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl p-4 sm:p-5 border border-neutral-200 dark:border-neutral-800 space-y-4">
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                        <Briefcase size={12} /> Select Resume
                      </p>
                      
                      {loadingCvs ? (
                        <div className="flex items-center gap-2 text-sm text-neutral-500 py-2">
                          <Loader2 size={16} className="animate-spin" /> Loading saved resumes...
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* Option: Main Profile Resume */}
                          {profile?.resumeUrl && (
                            <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${!generatedCvId ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-900/10' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'}`}>
                              <div className="pt-0.5">
                                <input type="radio" name="resume-selection" checked={!generatedCvId} onChange={() => setGeneratedCvId(null)} className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <FileText size={14} className={!generatedCvId ? 'text-accent-600' : 'text-neutral-500'} />
                                  Attached Profile Resume
                                </p>
                                <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-accent-600 hover:underline mt-1 inline-block" onClick={(e) => e.stopPropagation()}>
                                  View Resume
                                </a>
                              </div>
                            </label>
                          )}

                          {/* Option: Saved Generated CVs */}
                          {savedCvs.map(cv => (
                            <label key={cv.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${generatedCvId === cv.id ? 'border-accent-500 bg-accent-50/50 dark:bg-accent-900/10' : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 bg-white dark:bg-neutral-800'}`}>
                              <div className="pt-0.5">
                                <input type="radio" name="resume-selection" checked={generatedCvId === cv.id} onChange={() => setGeneratedCvId(cv.id)} className="w-4 h-4 text-accent-600 focus:ring-accent-500 border-neutral-300" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                                  <FileText size={14} className={generatedCvId === cv.id ? 'text-accent-600' : 'text-neutral-500'} />
                                  {cv.target_role || 'Tailored CV'} ({cv.template_name})
                                </p>
                                <p className="text-xs font-medium text-neutral-500 mt-1">Generated: {new Date(cv.generated_at).toLocaleDateString()}</p>
                              </div>
                            </label>
                          ))}

                          {/* No resume saved fallback */}
                          {!profile?.resumeUrl && savedCvs.length === 0 && (
                            <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-center">
                              <p className="text-sm font-medium text-neutral-500">No resume saved on your profile.</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-1.5 block">
                          <FileText size={12} /> Tailored CV & Cover Letter
                        </label>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 sm:p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                        <p className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-300 leading-relaxed">
                          Stand out by auto-generating a customized CV and Cover Letter tailored specifically to this job description.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsWizardOpen(true)}
                          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-xl shadow-md transition-all flex justify-center items-center gap-2"
                        >
                          <PenTool size={16} /> Generate New Tailored CV
                        </button>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-1.5 mb-1 block">
                        <GraduationCap size={12} /> Education
                      </label>
                      <textarea
                        value={formData.education}
                        onChange={e => setFormData({ ...formData, education: e.target.value })}
                        className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-accent-500 outline-none resize-none pb-1"
                        rows={2}
                        placeholder="e.g. B.Sc Computer Science"
                      />
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-1.5 mb-1 block">
                        <Briefcase size={12} /> Experience (Years)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.experienceYears}
                        onChange={e => setFormData({ ...formData, experienceYears: parseInt(e.target.value) || 0 })}
                        className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-accent-500 outline-none pb-1"
                      />
                    </div>

                    <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide flex items-center gap-1.5 mb-2 block">
                        <PenTool size={12} /> Skills (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.skills}
                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                        placeholder="e.g. Sales, Python, Marketing"
                        className="w-full text-sm font-medium text-neutral-900 dark:text-white bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-accent-500 outline-none pb-1"
                      />
                    </div>
                  </div>
                </section>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => setFlowState('step1')}
                    className="w-full sm:w-auto text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors px-4 py-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-center"
                  >
                    ← Edit Details
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-600 hover:bg-accent-700 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all"
                  >
                    Submit Application
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Submitting */}
          {flowState === 'submitting' && (
            <div className="flex-1 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-accent-100 dark:border-accent-900/50 border-t-accent-600 rounded-full animate-spin mb-6" />
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white">
                Sending to {job.companyName}...
              </h3>
              <p className="text-neutral-500 text-sm mt-2">Please don't close this window.</p>
            </div>
          )}

          {/* Success */}
          {flowState === 'success' && (
            <div className="flex-1 p-6 sm:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.1),transparent_70%)] rounded-full blur-3xl pointer-events-none" />

              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-40 h-40 sm:w-64 sm:h-64 mb-6 sm:mb-8 mx-auto relative z-10"
              >
                <div className="absolute inset-0 bg-accent-500/10 blur-3xl rounded-full" />
                <img
                  src={`${import.meta.env.BASE_URL}images/success_plane_3d_nobg.png`}
                  alt="Success"
                  className="w-full h-full object-contain drop-shadow-2xl relative z-10"
                  style={{ animation: 'float 3s ease-in-out infinite' }}
                />
              </motion.div>
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative z-10 w-full"
              >
                <h3 className="text-2xl sm:text-4xl font-display font-extrabold text-neutral-900 dark:text-white mb-3 sm:mb-4 tracking-tight">
                  Application Submitted!
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base font-medium mb-8 sm:mb-10 max-w-sm mx-auto leading-relaxed px-4 sm:px-0">
                  Your profile and contact details have been successfully and securely delivered. Best of luck!
                </p>
                <button
                  onClick={() => navigate('/employee/tracker')}
                  className="w-full max-w-xs mx-auto flex items-center justify-center gap-2 bg-gradient-to-br from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 active:scale-95 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-lg shadow-accent-500/25 transition-all"
                >
                  Track My Application <ArrowLeft size={18} className="rotate-180" />
                </button>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <ApplyJobCVWizard
        job={job}
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={(cvId) => {
          setGeneratedCvId(cvId);
          setIsWizardOpen(false);
          fetchCvs();
          toast.success("CV generated successfully. Don't forget to submit your application!");
        }}
      />
    </div>
  );
};
