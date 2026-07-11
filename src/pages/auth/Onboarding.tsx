import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Target, Check, MapPin, Phone, Briefcase, Building, Globe, Image as ImageIcon } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { toast } from 'sonner';
import { ImageCropperModal } from '../../components/ui/ImageCropperModal';

export const Onboarding = () => {
  const { currentUser, fetchData, updateProfileImage } = useAppContext();
  const navigate = useNavigate();
  
  // Basic states
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEmployee = currentUser?.role === 'employee';

  // Common/Employee states
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  
  // Company states
  const [companyName, setCompanyName] = useState(currentUser?.name || '');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');

  // Avatar/Logo
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropFileName, setCropFileName] = useState<string>('');

  useEffect(() => {
    // If not logged in, or already setup AND not fresh off signup, kick them out
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.setupCompleted && localStorage.getItem('needs_onboarding') !== 'true') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const handleCropComplete = (croppedFile: File) => {
    setAvatarFile(croppedFile);
    setCropImageSrc(null);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      // 1. Upload Avatar if selected
      if (avatarFile) {
        await updateProfileImage(avatarFile);
      }

      // 2. Update Profile
      if (isEmployee) {
        await apiFetch('/profile/employee/', {
          method: 'PATCH',
          body: JSON.stringify({
            title: title,
            bio: bio,
            skills: skills.split(',').map(s => s.trim()).filter(Boolean),
            phone_number: phone,
            city: city,
            country: country
          })
        });
      } else {
        await apiFetch('/profile/company/', {
          method: 'PATCH',
          body: JSON.stringify({
            company_name: companyName,
            contact_phone: phone,
            website: website,
            industry: industry,
            about_company: aboutCompany
          })
        });
      }

      // 3. Mark as setup completed
      const location = isEmployee ? [city, country].filter(Boolean).join(', ') : '';
      await apiFetch('/auth/me/', {
        method: 'PATCH',
        body: JSON.stringify({ 
          setup_completed: true,
          ...(location ? { location } : {})
        })
      });

      // Cleanup & Redirect
      localStorage.removeItem('needs_onboarding');
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
      toast.error(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-lighten" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen dark:mix-blend-lighten" />

      <div className="w-full max-w-2xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)] relative z-10">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 sm:mb-12 relative px-2">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full -z-10"></div>
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent-500 rounded-full -z-10 transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          
          {[1, 2, 3].map(i => (
            <div key={i} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300 ${
              step >= i 
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30' 
                : 'bg-white dark:bg-neutral-900 text-neutral-400 border-2 border-neutral-200 dark:border-neutral-800'
            }`}>
              {step > i ? <Check size={16} /> : i}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-accent-100 dark:bg-accent-900/50 text-accent-600 dark:text-accent-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {isEmployee ? <User size={32} /> : <Building size={32} />}
                </div>
                <h1 className="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                  Welcome to Quota Hire!
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base mb-6">
                  {isEmployee ? "Let's set up your contact details to match you with top companies." : "Let's set up your basic information to attract top talent."}
                </p>
              </div>

              <div className="space-y-5 max-w-md mx-auto">
                {isEmployee ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <GlassInput
                        label="City"
                        icon={<MapPin size={20} />}
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="e.g. London"
                      />
                      <GlassInput
                        label="Country"
                        icon={<MapPin size={20} />}
                        value={country}
                        onChange={e => setCountry(e.target.value)}
                        placeholder="e.g. UK"
                      />
                    </div>
                    <GlassInput
                      label="Phone Number"
                      icon={<Phone size={20} />}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                  </>
                ) : (
                  <>
                    <GlassInput
                      label="Company Name"
                      icon={<Building size={20} />}
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="Acme Corp"
                    />
                    <GlassInput
                      label="Contact Phone"
                      icon={<Phone size={20} />}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                    />
                    <GlassInput
                      label="Website"
                      icon={<Globe size={20} />}
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://acme.com"
                    />
                  </>
                )}
              </div>

              <div className="pt-6 max-w-md mx-auto">
                <Button onClick={handleNext} className="w-full bg-accent-600 hover:bg-accent-700 text-white flex items-center justify-center py-3.5 rounded-xl font-bold text-base shadow-lg shadow-accent-600/20">
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                  {isEmployee ? 'Professional Profile' : 'Company Details'}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">Tell us a bit more about what you do.</p>
              </div>

              <div className="space-y-5 max-w-md mx-auto">
                {isEmployee ? (
                  <>
                    <GlassInput
                      label="Professional Title"
                      icon={<Briefcase size={20} />}
                      value={title}
                      onChange={e => setTitle(e.target.value)}
                      placeholder="e.g. Senior B2B Sales Exec"
                    />
                    <GlassInput
                      label="Top Skills (comma separated)"
                      icon={<Target size={20} />}
                      value={skills}
                      onChange={e => setSkills(e.target.value)}
                      placeholder="SaaS, Cold Calling, Salesforce"
                    />
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 ml-1">Bio / Summary</label>
                      <textarea 
                        value={bio} 
                        onChange={e => setBio(e.target.value)} 
                        rows={4} 
                        placeholder="A short description about your experience..." 
                        className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 focus:border-accent-500 outline-none text-neutral-900 dark:text-white transition-colors resize-none shadow-sm"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <GlassInput
                      label="Industry"
                      icon={<Briefcase size={20} />}
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      placeholder="e.g. SaaS, FinTech, Healthcare"
                    />
                    <div>
                      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 ml-1">About Company</label>
                      <textarea 
                        value={aboutCompany} 
                        onChange={e => setAboutCompany(e.target.value)} 
                        rows={4} 
                        placeholder="Describe your company's mission and culture..." 
                        className="w-full px-4 py-3 rounded-2xl bg-white/50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 focus:border-accent-500 outline-none text-neutral-900 dark:text-white transition-colors resize-none shadow-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 max-w-md mx-auto">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-1/3 py-3.5 rounded-xl font-bold">Back</Button>
                <Button onClick={handleNext} className="w-full sm:w-2/3 bg-accent-600 hover:bg-accent-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-accent-600/20">
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-6 text-center">
              <div className="mb-8">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImageIcon size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-neutral-900 dark:text-white mb-2">
                  {isEmployee ? 'Profile Picture (Optional)' : 'Company Logo (Optional)'}
                </h2>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base">
                  Profiles with pictures get significantly more views.
                </p>
              </div>

              {/* Optional Photo Upload */}
              <div className="max-w-md mx-auto">
                <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl p-6 sm:p-8 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group relative flex flex-col items-center">
                  <input type="file" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                  
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform overflow-hidden shadow-sm">
                    {avatarFile ? (
                      <img src={URL.createObjectURL(avatarFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon size={32} className="text-neutral-400" />
                    )}
                  </div>
                  
                  <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                    {avatarFile ? 'Change Photo' : 'Click to upload'}
                  </p>
                  <p className="text-xs text-neutral-500">Supports JPG, PNG (Max 5MB)</p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-8 max-w-md mx-auto">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full sm:w-1/3 py-3.5 rounded-xl font-bold">Back</Button>
                <Button 
                  onClick={handleFinish} 
                  disabled={isSubmitting} 
                  className="w-full sm:w-2/3 bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-500/20"
                >
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
