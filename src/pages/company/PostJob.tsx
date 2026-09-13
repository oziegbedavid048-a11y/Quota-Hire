import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, CheckCircle2, FileText, Check, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { worldCurrencies } from '../../utils/currencies';
import { CompanyProfile } from '../../types';
import { Portal } from '../../components/ui/Portal';


// Same packages, in the same order, as mobile/src/components/company-post-job.tsx.
const PACKAGES = [
  {
    id: 'promoted',
    title: 'QUOTAHIRE PROMOTED JOBS',
    subtitle: 'Promoted Job Post & Direct Applicant Access',
    bestFor: 'Fast hiring with unrestricted direct access to candidates',
    weDo: 'Boost your job listing on the platform, deliver applicant profiles, CVs & cover letters directly to your dashboard',
    youDo: 'Review applicants directly, schedule interviews, and hire on your terms',
    promise: 'Boosted listing reach and direct access to candidate CVs & cover letters.',
    fee: 'One-time promotion fee',
    guarantee: 'Active until fulfilled'
  },
  {
    id: 'pipeline',
    title: 'QUOTAHIRE PIPELINE',
    subtitle: 'Recruit Sales Associate Only',
    bestFor: 'You have Sales Manager + CRM + training',
    weDo: 'Source, vet, test, shortlist 5-7 closers. You interview + hire + manage.',
    youDo: 'Onboarding, training, daily management, payroll',
    promise: 'We fill your pipeline with vetted closers. You manage.',
    fee: '1. Base salary roles: 15% of 1st year base salary.\n2. Commission-only roles: 20% of expected 1-month OTE.',
    guarantee: '90-day free replacement'
  },
  {
    id: 'hunters',
    title: 'QUOTAHIRE COMMISSION HUNTERS',
    subtitle: 'Commission-Only Specialist',
    bestFor: '100% commission pay. No base budget',
    weDo: 'Pipeline vetting + commission mindset test + cold call roleplay',
    youDo: 'Management + targets',
    promise: 'Hunters who sell without base salary.',
    fee: '20% of expected 1-month OTE per hire',
    guarantee: '60-day replacement'
  },
  {
    id: 'sales_ops',
    title: 'QUOTAHIRE SALES OPS',
    subtitle: 'Recruit + Manage Full Sales Team',
    bestFor: 'You want revenue without hiring a Sales Manager',
    weDo: 'Everything in Pipeline + daily management, scripts, KPI tracking, weekly coaching, pipeline reviews, fire underperformers, monthly reports',
    youDo: 'Pay rep commission, product training, approve targets',
    promise: 'We hire + manage. You collect revenue.',
    fee: '1. Setup: 10% of annual base OR 20% of 1-month OTE.\n2. Monthly: 10% of base per rep.\n3. Bonus: 4% of team commission if target hit',
    guarantee: 'Free replacement <60 days.\nTimeline: 21-30 days to full team.'
  }
];

/**
 * The app's step 4 picker: a compact card per package with the title, a tick
 * when chosen, the subtitle, the promise and the fee structure.
 */
const PackageSelect = ({ selected, onSelect }: { selected: string, onSelect: (id: string) => void }) => (
  <div role="radiogroup" aria-label="Recruitment package" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
    {PACKAGES.map(pkg => {
      const isSelected = selected === pkg.id;
      return (
        <button
          key={pkg.id}
          type="button"
          role="radio"
          aria-checked={isSelected}
          onClick={() => onSelect(pkg.id)}
          className={`text-left flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border-2 p-4 transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-500/30 ${
            isSelected
              ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 shadow-md'
              : 'border-slate-200 dark:border-neutral-800 hover:border-accent-300'
          }`}
        >
          <span className="flex items-start justify-between gap-3">
            <span className={`font-extrabold text-sm leading-tight ${isSelected ? 'text-accent-600 dark:text-accent-400' : 'text-slate-900 dark:text-white'}`}>{pkg.title}</span>
            {isSelected && <CheckCircle2 size={18} className="text-accent-600 dark:text-accent-400 shrink-0" />}
          </span>
          <span className="mt-1 text-xs font-bold text-accent-600 dark:text-accent-400">{pkg.subtitle}</span>
          <span className="mt-2 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed"><span className="font-bold">Promise:</span> {pkg.promise}</span>
          <span className="mt-1 text-xs text-slate-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line"><span className="font-bold">Fee Structure:</span> {pkg.fee}</span>
        </button>
      );
    })}
  </div>
);

const PackageCards = ({ selected, onSelect, readOnly }: { selected?: string, onSelect?: (id: string) => void, readOnly?: boolean }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {PACKAGES.map(pkg => (
        <div
          key={pkg.id}
          onClick={() => !readOnly && onSelect && onSelect(pkg.id)}
          className={`flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border-2 transition-all p-5 shadow-sm ${readOnly ? 'border-neutral-200 dark:border-neutral-800' : selected === pkg.id ? 'border-accent-500 shadow-md ring-4 ring-accent-500/20' : 'border-neutral-200 dark:border-neutral-800 hover:border-accent-300 cursor-pointer'}`}
        >
          <h4 className="font-black text-lg text-neutral-900 dark:text-white mb-1 leading-tight">{pkg.title}</h4>
          <p className="text-accent-600 dark:text-accent-400 font-bold text-sm mb-4">{pkg.subtitle}</p>
          
          <div className="space-y-4 text-sm text-neutral-600 dark:text-neutral-400 flex-1">
            <div><span className="font-bold text-neutral-800 dark:text-neutral-200">Best For:</span> {pkg.bestFor}</div>
            <div><span className="font-bold text-neutral-800 dark:text-neutral-200">We Do:</span> {pkg.weDo}</div>
            <div><span className="font-bold text-neutral-800 dark:text-neutral-200">You Do:</span> {pkg.youDo}</div>
            <div><span className="font-bold text-neutral-800 dark:text-neutral-200">Promise:</span> {pkg.promise}</div>
            <div className="whitespace-pre-line"><span className="font-bold text-neutral-800 dark:text-neutral-200">Fee:</span><br/>{pkg.fee}</div>
          </div>
          
          <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 whitespace-pre-line text-xs font-bold text-neutral-500">
            <span className="text-green-600 dark:text-green-500">Guarantee:</span> {pkg.guarantee}
          </div>
        </div>
      ))}
    </div>
  );
};

export const PostJob = () => {
  const [step, setStep] = useState(0);
  const { currentUser, postJob } = useAppContext();
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    isRemote: true,
    currency: 'USD',
    salaryRange: '',
    commissionRange: '',
    description: '',
    requirements: '',
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    companyName: (currentUser as CompanyProfile)?.companyName || currentUser?.name || '',
    companyAddress: '',
    whatsappNumber: '',
    package: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  // Which confirmation to show after a successful post. Promoted roles need
  // payment before they go live, so they get the app's payment wording.
  const [submitted, setSubmitted] = useState<null | 'promoted' | 'standard'>(null);
  const navigate = useNavigate();

  const selectedCurrencyObj = worldCurrencies.find(c => c.code === formData.currency) || worldCurrencies[0];
  const CurrencyIcon = <span className="font-bold text-lg leading-none">{selectedCurrencyObj.symbol}</span>;

  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      title: '',
      location: '',
      isRemote: true,
      salaryRange: '',
      commissionRange: '',
      description: '',
      requirements: '',
      package: ''
    }));
    setStep(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    if (!formData.package || isLoading) return;

    setIsLoading(true);
    const posted = await postJob({
      title: formData.title,
      location: formData.location,
      isRemote: formData.isRemote,
      employment_type: 'Full-time', // Explicitly setting to Full-time as requested
      currency: formData.currency,
      salaryRange: formData.salaryRange,
      commissionRange: formData.commissionRange,
      description: formData.description,
      requirements: formData.requirements.split('\n').filter((r) => r.trim() !== ''),
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      whatsappNumber: formData.whatsappNumber,
      companyAddress: formData.companyAddress,
      companyName: formData.companyName,
      package: formData.package
    });
    setIsLoading(false);
    if (posted) setSubmitted(formData.package === 'promoted' ? 'promoted' : 'standard');
  };

  const postAnother = () => {
    setSubmitted(null);
    resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3, ease: "easeIn" } }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden  font-body py-12 px-4 md:py-16">
      <AnimatedBackground />

      <div className="container mx-auto max-w-3xl relative z-10">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-8 inline-flex items-center text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white dark:bg-neutral-900 px-5 py-2.5 rounded-full shadow-soft"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 card-soft relative overflow-hidden bg-gradient-to-r from-accent-50 to-warm-50 dark:from-accent-900/20 dark:to-warm-900/20 p-6 md:p-8"
        >
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-accent-200/40 dark:bg-accent-900/40 rounded-full blur-[60px]" />
          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-600 dark:text-accent-400 bg-accent-100 dark:bg-accent-900/40 px-3 py-1 rounded-full mb-3">
                <Briefcase size={12} /> Company · Post a Role
              </span>
              <h1 className="text-xl md:text-2xl font-display font-extrabold text-neutral-900 dark:text-white tracking-tight mb-2">
                Find Your Next <span className="text-accent-600 dark:text-accent-400">Sales Superstar</span>
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                Attract elite sales talent in three simple steps.
              </p>
            </div>
            <div className="w-32 h-32 md:w-44 md:h-44 shrink-0">
              <img
                src={`${import.meta.env.BASE_URL}images/post_job_recruiter.webp`}
                alt="Recruiter 3D Character"
                loading="lazy"
                className="w-full h-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </motion.div>

        {step > 0 && step < 4 && (
          <div className="flex justify-between items-center mb-10 relative">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-neutral-200 dark:bg-neutral-800 -z-10 rounded-full"></div>
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-accent-500 -z-10 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
            
            {[
              { id: 1, icon: Briefcase, label: "Basics" },
              { id: 2, icon: FileText, label: "Details" },
              { id: 3, icon: Check, label: "Review" }
            ].map((s) => (
              <div key={s.id} className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-soft transition-all duration-500 ${
                  step >= s.id 
                    ? 'bg-accent-500 text-white border-4 border-white dark:border-[#0f1115] scale-110' 
                    : 'bg-white dark:bg-neutral-900 text-neutral-400 border-4 border-white dark:border-[#0f1115]'
                }`}>
                  <s.icon size={20} strokeWidth={3} />
                </div>
                <span className={`mt-2 text-sm font-bold ${step >= s.id ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form Card */}
        <motion.div 
          className="card-soft p-6 md:p-8 relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-400 to-accent-600" />
          
          <form onSubmit={handleSubmit} className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Our Recruitment Packages</h3>
                    <p className="text-neutral-500">Review our service structures before entering job basics.</p>
                  </div>
                  <PackageCards readOnly />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">The Basics</h3>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <Shield size={18} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Privacy Notice:</strong> Your company contact information, email, and address are kept strictly confidential and will <span className="underline font-semibold">not</span> be accessible by applicants.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <GlassInput
                        icon={<Briefcase size={18} />}
                        label="Company Name"
                        placeholder="e.g. Acme Corp"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        required
                        className="input-soft"
                      />
                      <GlassInput
                        icon={<span className="text-neutral-400">@</span>}
                        label="Contact Email"
                        type="email"
                        placeholder="hiring@company.com"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        required
                        className="input-soft"
                      />
                      <GlassInput
                        icon={<span className="text-neutral-400">#</span>}
                        label="Contact Phone"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        className="input-soft"
                      />
                      <GlassInput
                        icon={<span className="text-emerald-500 font-bold">W</span>}
                        label="WhatsApp Number"
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        className="input-soft"
                      />
                    </div>

                    <GlassInput
                      icon={<MapPin size={18} />}
                      label="Company Address"
                      placeholder="e.g. 123 Main St, Tech Park"
                      value={formData.companyAddress}
                      onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                      required
                      className="input-soft"
                    />



                    <div className="flex flex-col gap-3">
                      <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 ml-1">
                        Workplace Type
                      </label>
                      <div className="flex flex-wrap gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isRemote: true, location: '' })}
                          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2 ${
                            formData.isRemote
                              ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                          }`}
                        >
                          🌍 Remote
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, isRemote: false })}
                          className={`flex-1 min-w-[140px] px-4 py-3 rounded-xl border-2 transition-all font-bold text-sm flex items-center justify-center gap-2 ${
                            !formData.isRemote
                              ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                              : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                          }`}
                        >
                          🏢 Full Time
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {!formData.isRemote && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2">
                            <GlassInput
                              icon={<MapPin size={18} />}
                              label="Job Location (State)"
                              placeholder="e.g. Lagos, Abuja, New York"
                              value={formData.location}
                              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                              required={!formData.isRemote}
                              className="input-soft"
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">The Details</h3>
                  
                  <div className="relative">
                    <GlassInput
                      icon={<Briefcase size={18} />}
                      label="Job Title"
                      placeholder="e.g. Enterprise Account Executive, SDR, Marketing Manager..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="input-soft"
                    />


                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative group">
                      <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">
                        Currency
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                          {CurrencyIcon}
                        </div>
                        <input
                          list="currencies"
                          className="w-full input-soft pl-11"
                          placeholder="Type country or currency"
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                          required
                        />
                        <datalist id="currencies">
                          {worldCurrencies.map((c) => (
                            <option key={c.code} value={c.code}>{c.name} ({c.country})</option>
                          ))}
                        </datalist>
                      </div>
                    </div>

                    <GlassInput
                      icon={CurrencyIcon}
                      label="Salary Range"
                      placeholder={`e.g. ${selectedCurrencyObj.symbol}80k - ${selectedCurrencyObj.symbol}120k Base`}
                      value={formData.salaryRange}
                      onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                      className="input-soft"
                    />

                    <GlassInput
                      icon={CurrencyIcon}
                      label="Commission Range"
                      placeholder={`e.g. ${selectedCurrencyObj.symbol}40k OTE`}
                      value={formData.commissionRange}
                      onChange={(e) => setFormData({ ...formData, commissionRange: e.target.value })}
                      className="input-soft"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">
                      Job Description
                    </label>
                    <textarea
                      className="w-full input-soft resize-none min-h-[160px]"
                      placeholder="Describe the day-to-day responsibilities..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-neutral-700 dark:text-neutral-300 ml-1">
                      Requirements (One per line)
                    </label>
                    <textarea
                      className="w-full input-soft resize-none min-h-[160px]"
                      placeholder="5+ years of B2B SaaS sales experience&#10;Track record of closing six-figure deals"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      required
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 text-green-500 rounded-full flex items-center justify-center shadow-inner-soft mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Review & Post</h3>
                    <p className="text-neutral-500">Everything looks great! Ready to find top talent?</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 rounded-[24px] shadow-inner-soft space-y-4">
                    <div>
                      <p className="text-sm font-bold text-neutral-400">Position</p>
                      <p className="text-lg font-bold text-neutral-900 dark:text-white">{formData.title}</p>
                    </div>
                    <div className="flex gap-4">
                      <div>
                        <p className="text-sm font-bold text-neutral-400">Location</p>
                        <p className="font-bold text-neutral-900 dark:text-white">{formData.isRemote ? 'Remote' : formData.location}</p>
                      </div>
                      {formData.salaryRange && (
                        <div>
                          <p className="text-sm font-bold text-neutral-400">Salary</p>
                          <p className="font-bold text-neutral-900 dark:text-white">{formData.salaryRange}</p>
                        </div>
                      )}
                      {formData.commissionRange && (
                        <div>
                          <p className="text-sm font-bold text-neutral-400">Commission</p>
                          <p className="font-bold text-neutral-900 dark:text-white">{formData.commissionRange}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
              {step === 4 && (
                <motion.div key="step4" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Select Recruitment Package</h3>
                    <p className="text-neutral-500">Choose the structure that matches your hiring plan.</p>
                  </div>
                  <PackageSelect
                    selected={formData.package}
                    onSelect={(id) => setFormData({ ...formData, package: id })}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex justify-between">
              {step > 0 ? (
                <Button type="button" onClick={() => setStep(step - 1)} variant="outline" className="btn-soft border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300">
                  Back
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button 
                type="submit" 
                className="btn-soft bg-accent-600 text-white shadow-soft" 
                isLoading={isLoading && step === 4}
                disabled={step === 4 && !formData.package}
              >
                {step === 0 ? 'Start Post Job' : step === 4 ? 'Post Role' : 'Next'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>

      <Portal>
        <AnimatePresence>
          {submitted && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              />
              <motion.div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="job-submitted-title"
                aria-describedby="job-submitted-message"
                initial={{ opacity: 0, scale: 0.97, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97, y: 8 }}
                transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 flex items-center justify-center">
                  <CheckCircle2 size={28} />
                </div>
                <h2 id="job-submitted-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {submitted === 'promoted' ? 'Job Submitted Successfully!' : 'Success'}
                </h2>
                <p id="job-submitted-message" className="mt-2 text-sm text-slate-600 dark:text-neutral-300 leading-relaxed">
                  {submitted === 'promoted'
                    ? 'Your job has been submitted under the Promoted Job plan. Please check your email for payment completion instructions to activate promotion and direct applicant access.'
                    : 'Job posted successfully! It will be listed once reviewed.'}
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    autoFocus
                    onClick={postAnother}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-accent-500 hover:bg-accent-600 transition-colors"
                  >
                    Post Another Job
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </Portal>
    </div>
  );
};