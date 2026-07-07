import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ChevronRight, Upload, Target, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { toast } from 'sonner';
import { ImageCropperModal } from '../../components/ui/ImageCropperModal';

export const Onboarding = () => {
  const { currentUser, fetchData, updateProfileImage } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [location, setLocation] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Crop states
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>('');

  const handleCropComplete = (croppedFile: File) => {
    setAvatarFile(croppedFile);
    setCropImageSrc(null);
  };

  // Skip onboarding if not logged in or admin
  if (!currentUser || currentUser.role === 'admin') {
    navigate('/');
    return null;
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      if (location) {
        await apiFetch('/auth/me/', {
          method: 'PUT',
          body: JSON.stringify({ location })
        });
      }

      const endpoint = currentUser.role === 'company' ? '/profile/company/' : '/profile/employee/';
      const payload = currentUser.role === 'company' 
        ? { industry: skills, description: bio }
        : { skills: skills.split(',').map((s: string) => s.trim()).filter(Boolean), bio: bio };

      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (avatarFile) {
        await updateProfileImage(avatarFile);
      }

      await fetchData(false);
      toast.success('Profile setup complete!');
      const savedCode = sessionStorage.getItem('redirect_job_code');
      if (savedCode) {
        sessionStorage.removeItem('redirect_job_code');
        navigate(`/jobs?code=${savedCode}`);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      toast.error('Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setCropFileName(file.name);
      setCropImageSrc(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCropFileName(file.name);
      setCropImageSrc(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-lighten" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-lighten" />

      <div className="w-full max-w-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative z-10">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent-500 rounded-full -z-10 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
              step >= i 
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30' 
                : 'bg-white dark:bg-neutral-900 text-neutral-400 border-2 border-neutral-200 dark:border-neutral-800'
            }`}>
              {step > i ? <Check size={18} /> : i}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/50 text-accent-600 dark:text-accent-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <User size={32} />
                </div>
                <h1 className="text-xl md:text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">Welcome, {currentUser.name}!</h1>
                <p className="text-neutral-500 dark:text-neutral-400">Let's set up your profile to get the most out of Quota Hire.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Your Role</label>
                  <input type="text" disabled value={currentUser.role} className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border-transparent text-neutral-500 capitalize cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Location</label>
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. San Francisco, CA or Remote" className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 focus:border-accent-500 outline-none text-neutral-900 dark:text-white transition-colors" />
                </div>
              </div>

              <Button onClick={handleNext} className="w-full mt-8 bg-accent-600 hover:bg-accent-700 text-white flex items-center justify-center">
                Continue <ChevronRight size={18} className="ml-2" />
              </Button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Upload size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">Upload a Profile Picture</h2>
                <p className="text-neutral-500 dark:text-neutral-400">Profiles with pictures get 3x more views.</p>
              </div>

              <div 
                className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-3xl p-10 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group relative"
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                <div className="w-24 h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform overflow-hidden">
                  {avatarFile ? (
                    <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} className="text-neutral-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                  {avatarFile ? avatarFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-neutral-500">SVG, PNG, JPG or GIF (max. 800x400px)</p>
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(1)} className="w-1/3">Back</Button>
                <Button onClick={handleNext} className="w-2/3 bg-accent-600 hover:bg-accent-700 text-white">
                  {avatarFile ? 'Continue' : 'Skip for now'}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                  {currentUser.role === 'employee' ? 'What are your top skills?' : 'Company Overview'}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400">Help us match you with the perfect opportunities.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    {currentUser.role === 'employee' ? 'Skills (comma separated)' : 'Industry'}
                  </label>
                  <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder={currentUser.role === 'employee' ? 'B2B Sales, Cold Calling, Salesforce' : 'e.g. SaaS, FinTech'} className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 focus:border-accent-500 outline-none text-neutral-900 dark:text-white transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Bio / Summary</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="A short description about yourself or your company..." className="w-full px-4 py-3 rounded-xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 focus:border-accent-500 outline-none text-neutral-900 dark:text-white transition-colors resize-none"></textarea>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setStep(2)} className="w-1/3">Back</Button>
                <Button onClick={handleFinish} disabled={isSubmitting} className="w-2/3 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20">
                  {isSubmitting ? 'Saving...' : 'Complete Setup'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {cropImageSrc && (
        <ImageCropperModal
          isOpen={!!cropImageSrc}
          imageSrc={cropImageSrc}
          fileName={cropFileName}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
};
