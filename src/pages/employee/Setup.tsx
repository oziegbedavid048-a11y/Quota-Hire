import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  Upload,
  FileText,
  Linkedin,
  User,
  Briefcase
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';

export const EmployeeSetup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    experienceYears: '',
    linkedinUrl: '',
    bio: '',
    skills: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateProfile } = useAppContext();
  const navigate = useNavigate();

  const handleSkip = () => {
    updateProfile({ setupCompleted: true });
    navigate('/dashboard');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      updateProfile({
        title: formData.title,
        experienceYears: parseInt(formData.experienceYears) || 0,
        linkedinUrl: formData.linkedinUrl,
        bio: formData.bio,
        skills: formData.skills.split(',').map((s) => s.trim()),
        setupCompleted: true
      });
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen  py-12 px-4 relative overflow-hidden font-sans">
      <AnimatedBackground />

      <div className="container mx-auto max-w-3xl relative z-10">
        {/* Hero Banner with 3D Illustration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 card-soft relative overflow-hidden bg-gradient-to-r from-warm-50 to-accent-50 dark:from-warm-900/20 dark:to-accent-900/20 p-6 md:p-8"
        >
          <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-warm-200/40 dark:bg-warm-900/40 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full mb-3">
                <User size={12} /> Profile Setup
              </span>
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
                Build Your <span className="text-accent-600 dark:text-accent-400">Sales Portfolio</span>
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                Set up your profile to start matching with top enterprise sales roles.
              </p>
              <button onClick={handleSkip} className="text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-neutral-900/80 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700">
                Skip for now
              </button>
            </div>
            <div className="w-32 h-32 md:w-44 md:h-44 shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}images/employee_setup.png`}
                alt="Setup 3D Character"
                className="w-full h-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </motion.div>

        {/* Stepper Progress */}
        <div className="flex justify-between items-center mb-12 relative px-4">
          <div className="absolute left-8 right-8 top-1/2 transform -translate-y-1/2 h-1 bg-neutral-200 dark:bg-neutral-800 -z-10 rounded-full"></div>
          <div className="absolute left-8 top-1/2 transform -translate-y-1/2 h-1 bg-accent-500 -z-10 rounded-full transition-all duration-500" style={{ width: `calc(${((step - 1) / 2) * 100}% - 2rem)` }}></div>
          
          {[
            { id: 1, icon: User, label: "Basics" },
            { id: 2, icon: Briefcase, label: "Summary" },
            { id: 3, icon: Upload, label: "Resume" }
          ].map((s) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-soft transition-all duration-500 ${
                step >= s.id 
                  ? 'bg-accent-500 text-white border-4 border-[#f8fafc] dark:border-[#0f1115] scale-110' 
                  : 'bg-white dark:bg-neutral-900 text-neutral-400 border-4 border-[#f8fafc] dark:border-[#0f1115]'
              }`}>
                {step > s.id ? <CheckCircle2 size={24} strokeWidth={3} /> : <s.icon size={22} strokeWidth={2.5} />}
              </div>
              <span className={`mt-3 text-sm font-bold ${step >= s.id ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        <motion.div className="card-soft p-6 md:p-8 relative overflow-hidden mb-12">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-400 to-accent-600" />
          
          <form onSubmit={handleSubmit} className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">Basic Information</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Current / Most Recent Title</label>
                      <input
                        className="w-full input-soft"
                        placeholder="e.g. Enterprise Account Executive"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Years of Sales Experience</label>
                      <input
                        className="w-full input-soft"
                        type="number"
                        placeholder="e.g. 5"
                        value={formData.experienceYears}
                        onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                        required
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">LinkedIn Profile URL</label>
                      <div className="relative">
                        <input
                          className="w-full input-soft pl-12"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={formData.linkedinUrl}
                          onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        />
                        <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">Professional Summary</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Bio / Summary</label>
                      <textarea
                        className="w-full input-soft resize-none min-h-[120px]"
                        placeholder="Briefly describe your sales background, typical deal sizes, and what you're looking for next..."
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Key Skills (comma separated)</label>
                      <input
                        className="w-full input-soft"
                        placeholder="e.g. B2B SaaS, MEDDIC, Salesforce, Outbound Prospecting"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">Resume / CV</h2>

                  <div
                    className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-[24px] p-10 text-center hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-16 h-16 mx-auto bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="h-8 w-8 text-neutral-400 group-hover:text-accent-500 transition-colors" />
                    </div>
                    <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">Upload your resume</h3>
                    <p className="text-neutral-500 mb-6">PDF, DOCX up to 5MB</p>
                    <button type="button" className="btn-soft bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700 px-6 py-2.5 text-sm">
                      Select File
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          updateProfile({ resumeUrl: 'uploaded-file.pdf' });
                        }
                      }}
                    />
                  </div>

                  <div className="relative flex items-center py-4">
                    <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                    <span className="flex-shrink-0 mx-4 text-neutral-400 font-bold text-sm uppercase">OR</span>
                    <div className="flex-grow border-t border-neutral-200 dark:border-neutral-800"></div>
                  </div>

                  <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-[24px] p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-soft">
                    <div>
                      <h3 className="font-extrabold text-xl mb-2 flex items-center gap-2">
                        <FileText size={24} className="text-white" />
                        Don't have a CV ready?
                      </h3>
                      <p className="text-neutral-400 text-sm max-w-md">
                        Use our AI-powered CV generator to create a compelling, conversion-optimized sales resume in minutes.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-soft bg-white text-neutral-900 px-6 py-3 shrink-0 whitespace-nowrap"
                      onClick={() => navigate('/employee/cv-generator')}
                    >
                      Generate CV
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              {step > 1 ? (
                <Button type="button" onClick={() => setStep(step - 1)} variant="outline" className="btn-soft border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button type="submit" className="btn-soft bg-accent-600 text-white shadow-soft" isLoading={isLoading && step === 3}>
                {step === 3 ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};