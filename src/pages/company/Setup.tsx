import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Globe, CheckCircle2, Image, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppContext } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';

export const CompanySetup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    industry: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { updateProfile, currentUser } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && 'companyName' in currentUser && currentUser.companyName) {
      setFormData((prev) => ({
        ...prev,
        companyName: currentUser.companyName
      }));
    }
  }, [currentUser]);

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
        companyName: formData.companyName,
        website: formData.website,
        industry: formData.industry,
        description: formData.description,
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
          className="mb-10 card-soft relative overflow-hidden bg-gradient-to-r from-accent-50 to-warm-50 dark:from-accent-900/20 dark:to-warm-900/20 p-6 md:p-8"
        >
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-warm-200/40 dark:bg-warm-900/40 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full mb-3">
                <Building2 size={12} /> Company Setup
              </span>
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
                Set Up Your <span className="text-accent-600 dark:text-accent-400">Company Profile</span>
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                Set up your profile to start attracting top sales talent.
              </p>
              <button onClick={handleSkip} className="text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-neutral-900/80 px-4 py-2 rounded-full border border-neutral-200 dark:border-neutral-700">
                Skip for now
              </button>
            </div>
            <div className="w-32 h-32 md:w-44 md:h-44 shrink-0">
              <img
                src="/images/company_setup.png"
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
            { id: 1, icon: Building2, label: "Basics" },
            { id: 2, icon: Globe, label: "Details" },
            { id: 3, icon: FileText, label: "About" }
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
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">Company Basics</h2>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 p-6 bg-accent-50 dark:bg-accent-900/10 rounded-3xl shadow-inner-soft">
                    <div className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-[20px] flex items-center justify-center text-accent-500 shadow-sm shrink-0">
                      <Image size={40} />
                    </div>
                    <div className="text-center sm:text-left">
                      <h3 className="font-extrabold text-neutral-900 dark:text-white text-lg mb-1">Company Logo</h3>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Recommended size: 400x400px</p>
                      <button
                        type="button"
                        className="btn-soft bg-white text-accent-600 border border-accent-200 px-5 py-2 text-sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Upload Logo
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            updateProfile({ logoUrl: 'uploaded-logo.png' });
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Company Name</label>
                    <input
                      className="w-full input-soft"
                      placeholder="e.g. Acme Corp"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      required
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">Industry & Online Presence</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Industry</label>
                      <input
                        className="w-full input-soft"
                        placeholder="e.g. B2B SaaS"
                        value={formData.industry}
                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                        required
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Website URL</label>
                      <div className="relative">
                        <input
                          className="w-full input-soft pl-12"
                          placeholder="https://example.com"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        />
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">About the Company</h2>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">Company Description</label>
                    <textarea
                      className="w-full input-soft resize-none min-h-[160px]"
                      placeholder="Tell candidates about your mission, culture, and what makes your sales team unique..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={6}
                      required
                    />
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
              
              <Button type="submit" className="btn-soft bg-accent-600 text-white shadow-soft hover:bg-accent-700" isLoading={isLoading && step === 3}>
                {step === 3 ? 'Complete Setup' : 'Continue'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};