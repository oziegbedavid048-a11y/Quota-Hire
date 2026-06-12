import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Wand2, Briefcase, MapPin, CheckCircle2, FileText, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { GlassInput } from '../../components/ui/GlassInput';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { worldCurrencies } from '../../utils/currencies';
import { CompanyProfile } from '../../types';

const jobTemplates: Record<string, { keywords: string[]; description: string; requirements: string }> = {
  'Sales Development Representative (SDR)': {
    keywords: ['sdr', 'sales development', 'business development rep', 'bdr'],
    description: "As an SDR, you will be the engine of our pipeline. Your primary responsibility is to identify, research, and engage outbound prospects through multi-channel outreach including cold calls, personalized emails, and LinkedIn. You will qualify inbound leads and schedule meetings for Account Executives, playing a critical role in our revenue growth.",
    requirements: "0–2 years of sales or customer-facing experience\nExcellent verbal and written communication skills\nHigh energy, resilience, and coachability\nFamiliarity with CRM tools (Salesforce, HubSpot, or similar)\nAbility to manage high daily call and email volume"
  },
  'Account Executive': {
    keywords: ['account executive', 'ae ', 'ae,', 'sales executive', 'closing rep', 'quota-carrying'],
    description: "We are seeking a driven Account Executive to manage the full sales cycle from prospecting to close. You will work closely with SDRs to qualify leads, conduct deep-dive discovery calls, run product demonstrations, and negotiate contracts to drive revenue growth in your territory.",
    requirements: "3+ years of B2B SaaS sales experience\nProven track record of closing five and six-figure deals\nExperience with MEDDIC, BANT, or Challenger methodology\nStrong presentation and negotiation skills\nProficiency with Salesforce and sales engagement tools"
  },
  'Sales Manager': {
    keywords: ['sales manager', 'head of sales', 'sales lead', 'revenue manager'],
    description: "The Sales Manager will lead, coach, and inspire a team of high-performing Account Executives to exceed revenue targets. You will be responsible for pipeline management, forecasting accuracy, and developing strategies to penetrate new markets.",
    requirements: "5+ years of sales experience, 2+ in a leadership role\nProven ability to hire, train, and develop top sales talent\nDeep understanding of enterprise sales cycles\nStrong analytical skills and data-driven decision making\nExperience with CRM forecasting and pipeline management"
  },
  'Sales Associate': {
    keywords: ['sales associate', 'junior sales', 'entry level sales', 'sales rep', 'inside sales'],
    description: "As a Sales Associate, you will be the first point of contact for our potential customers. You will be responsible for identifying new business opportunities, engaging with prospects, and demonstrating the value of our products. This role requires high energy, resilience, and a passion for building relationships.",
    requirements: "1+ years of sales experience (B2B preferred)\nExcellent verbal and written communication skills\nGoal-oriented mindset with a track record of meeting quotas\nProficiency with CRM software (Salesforce, HubSpot)"
  },
  'Enterprise Account Executive': {
    keywords: ['enterprise account', 'enterprise ae', 'enterprise sales', 'strategic account'],
    description: "As an Enterprise Account Executive, you will own complex, high-value sales cycles targeting Fortune 500 and mid-market companies. You will build executive-level relationships, navigate multiple stakeholders, and close transformational deals that shape our company's growth trajectory.",
    requirements: "5+ years of enterprise B2B sales experience\nTrack record of closing $250K+ ARR deals\nExperience selling to C-suite and VP-level buyers\nProficiency with complex deal structuring and procurement\nKnowledge of MEDDIC, Command of the Message, or similar enterprise methodology"
  },
  'VP of Sales': {
    keywords: ['vp of sales', 'vice president sales', 'vp sales', 'head of revenue'],
    description: "The VP of Sales will define and execute our go-to-market strategy, build and scale a world-class sales organization, and partner with executive leadership to achieve aggressive growth targets. You will be responsible for revenue planning, team structure, and overall sales culture.",
    requirements: "8+ years of progressive B2B sales experience\n4+ years leading and scaling sales teams\nProven track record of exceeding $10M+ ARR targets\nExperience building sales processes from the ground up\nStrong executive presence and board-level communication skills"
  },
  'Customer Success Manager': {
    keywords: ['customer success', 'csm', 'client success', 'account manager'],
    description: "As a Customer Success Manager, you will be the primary post-sale relationship owner for a portfolio of strategic accounts. Your goal is to drive product adoption, ensure customer health, identify expansion opportunities, and reduce churn by delivering measurable business value.",
    requirements: "2+ years in Customer Success, Account Management, or related field\nStrong consultative communication skills\nAbility to understand and articulate complex product value\nExperience with CS platforms (Gainsight, ChurnZero, or Totango)\nData-driven approach to health scoring and QBRs"
  },
  'Sales Operations Manager': {
    keywords: ['sales operations', 'sales ops', 'revenue operations', 'rev ops', 'revops'],
    description: "The Sales Operations Manager will partner with sales leadership to optimize process, tooling, and data to accelerate revenue. You will own our CRM architecture, sales analytics, quota planning, and forecasting processes to ensure the team operates at peak efficiency.",
    requirements: "3+ years in Sales Operations or Revenue Operations\nDeep Salesforce CRM expertise (Admin certification preferred)\nStrong SQL and data visualization skills (Tableau, Looker)\nExperience with territory design and quota modelling\nAbility to translate data insights into actionable recommendations"
  },
  'Marketing Manager': {
    keywords: ['marketing manager', 'head of marketing', 'digital marketing', 'growth marketing', 'demand generation'],
    description: "The Marketing Manager will own and execute our integrated marketing strategy across digital, content, and events channels. You will generate qualified pipeline for the sales team, build brand awareness, and measure campaign performance to continuously optimize our go-to-market approach.",
    requirements: "4+ years of B2B marketing experience\nProven ability to drive MQL/SQL pipeline\nExperience with HubSpot, Marketo, or equivalent marketing automation\nStrong copywriting and content strategy skills\nData-driven approach with experience in A/B testing and analytics"
  },
  'Business Development Manager': {
    keywords: ['business development', 'bd manager', 'partnerships', 'strategic partnerships', 'channel sales'],
    description: "As a Business Development Manager, you will identify, negotiate, and close strategic partnerships that expand our market reach and revenue streams. You will cultivate relationships with potential partners, resellers, and channel sales organizations to create mutually beneficial growth opportunities.",
    requirements: "4+ years of business development or partnerships experience\nStrong network in the relevant industry vertical\nExperience structuring and closing complex partnership agreements\nExcellent negotiation and relationship management skills\nAbility to work cross-functionally with product, legal, and finance"
  },
  'Territory Sales Representative': {
    keywords: ['territory sales', 'field sales', 'regional sales', 'outside sales', 'field rep'],
    description: "As a Territory Sales Representative, you will own your region and grow revenue by building strong relationships with new and existing customers through in-person meetings, product demonstrations, and events. This is a field-based role requiring regular travel within your assigned territory.",
    requirements: "2+ years of outside or field sales experience\nStrong hunter mentality with ability to manage a geographic territory\nAbility to travel up to 50% of the time\nExcellent in-person presentation and closing skills\nProficiency in CRM and mobile sales tools"
  },
  'Recruitment Consultant': {
    keywords: ['recruitment', 'recruiter', 'talent acquisition', 'headhunter', 'staffing'],
    description: "As a Recruitment Consultant, you will manage the full recruitment lifecycle — from sourcing and screening candidates to presenting opportunities and managing client relationships. You will build a deep talent network and consistently deliver top-quality hires that exceed client expectations.",
    requirements: "2+ years of recruitment or talent acquisition experience\nStrong sourcing skills across LinkedIn, job boards, and direct outreach\nExcellent candidate and client relationship management\nAbility to manage multiple requisitions simultaneously\nKnowledge of employment law and best practices"
  },
  'Product Manager': {
    keywords: ['product manager', 'pm ', 'product lead', 'product owner', 'head of product'],
    description: "As a Product Manager, you will define and champion the product vision, roadmap, and strategy. Working closely with engineering, design, sales, and customers, you will prioritize features, write clear requirements, and ship products that users love and that drive business growth.",
    requirements: "3+ years of product management experience in a SaaS environment\nStrong ability to translate customer feedback into product requirements\nExperience with agile development methodologies\nData-driven decision making with strong analytical skills\nExcellent stakeholder communication and roadmap management"
  },
  'Software Engineer': {
    keywords: ['software engineer', 'developer', 'frontend', 'backend', 'full stack', 'fullstack', 'react', 'node', 'python dev', 'java dev'],
    description: "We are looking for a talented Software Engineer to join our growing engineering team. You will design, build, and maintain scalable software solutions, collaborate with product and design to ship high-quality features, and contribute to our engineering culture of excellence.",
    requirements: "2+ years of professional software development experience\nProficiency in relevant programming languages and frameworks\nStrong understanding of software design principles and patterns\nExperience with version control (Git), CI/CD pipelines\nExcellent problem-solving and communication skills"
  },
  'Data Analyst': {
    keywords: ['data analyst', 'business analyst', 'data scientist', 'analytics', 'bi analyst', 'data engineer'],
    description: "As a Data Analyst, you will transform raw data into actionable insights that drive strategic decision-making. You will build dashboards, analyze performance trends, and partner closely with leadership and revenue teams to identify growth opportunities.",
    requirements: "2+ years of data analysis experience\nProficiency in SQL and at least one analytics tool (Tableau, Looker, Power BI)\nExperience with Python or R for statistical analysis (a plus)\nStrong ability to present complex data in a clear and compelling way\nMeticulous attention to data quality and accuracy"
  },
  'Operations Manager': {
    keywords: ['operations manager', 'head of operations', 'ops manager', 'chief of staff', 'coo'],
    description: "The Operations Manager will streamline our internal processes, manage cross-functional projects, and ensure the business runs smoothly and efficiently. You will partner with every team to remove friction, implement scalable systems, and drive operational excellence.",
    requirements: "4+ years of operations or project management experience\nStrong process improvement and systems-thinking skills\nExperience managing cross-functional projects and stakeholders\nProficiency with project management tools (Asana, Monday, Notion)\nExcellent organizational and leadership skills"
  },
};

// Fuzzy keyword matcher — returns the best template key for a typed title
const findMatchingTemplate = (title: string): string | null => {
  if (!title || title.trim().length < 3) return null;
  const lower = title.toLowerCase();
  for (const [templateName, data] of Object.entries(jobTemplates)) {
    const allKeywords = [templateName.toLowerCase(), ...data.keywords];
    if (allKeywords.some(kw => lower.includes(kw) || kw.includes(lower))) {
      return templateName;
    }
  }
  return null;
};

export const PostJob = () => {
  const [step, setStep] = useState(1);
  const { currentUser, postJob } = useAppContext();
  
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    isRemote: false,
    currency: 'USD',
    salaryRange: '',
    commissionRange: '',
    description: '',
    requirements: '',
    contactEmail: currentUser?.email || '',
    contactPhone: '',
    companyName: (currentUser as CompanyProfile)?.companyName || currentUser?.name || '',
    companyAddress: '',
    whatsappNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedTemplate, setSuggestedTemplate] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check for templates when title changes
  useEffect(() => {
    const match = findMatchingTemplate(formData.title);
    setSuggestedTemplate(match || null);
  }, [formData.title]);

  const applyTemplate = () => {
    if (suggestedTemplate) {
      setFormData(prev => ({
        ...prev,
        description: jobTemplates[suggestedTemplate].description,
        requirements: jobTemplates[suggestedTemplate].requirements
      }));
    }
  };

  const selectedCurrencyObj = worldCurrencies.find(c => c.code === formData.currency) || worldCurrencies[0];
  const CurrencyIcon = <span className="font-bold text-lg leading-none">{selectedCurrencyObj.symbol}</span>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setIsLoading(true);
    let finalDescription = formData.description;
    if (formData.companyName || formData.companyAddress || formData.contactEmail || formData.contactPhone || formData.whatsappNumber) {
      finalDescription += `\n\n### Company & Contact Information\n`;
      if (formData.companyName) finalDescription += `- Company: ${formData.companyName}\n`;
      if (formData.companyAddress) finalDescription += `- Address: ${formData.companyAddress}\n`;
      if (formData.contactEmail) finalDescription += `- Email: ${formData.contactEmail}\n`;
      if (formData.contactPhone) finalDescription += `- Phone: ${formData.contactPhone}\n`;
      if (formData.whatsappNumber) finalDescription += `- WhatsApp: ${formData.whatsappNumber}\n`;
    }

    setTimeout(() => {
      postJob({
        title: formData.title,
        location: formData.location,
        isRemote: formData.isRemote,
        currency: formData.currency,
        salaryRange: formData.salaryRange,
        commissionRange: formData.commissionRange,
        description: finalDescription,
        requirements: formData.requirements.split('\n').filter((r) => r.trim() !== '')
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
                src={`${import.meta.env.BASE_URL}images/post_job_recruiter.png`}
                alt="Recruiter 3D Character"
                className="w-full h-full object-contain drop-shadow-xl animate-float"
              />
            </div>
          </div>
        </motion.div>

        {/* Stepper Progress */}
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

        {/* Form Card */}
        <motion.div 
          className="card-soft p-6 md:p-8 relative overflow-hidden mb-12"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-400 to-accent-600" />
          
          <form onSubmit={handleSubmit} className="relative z-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" variants={stepVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                  <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-6">The Basics</h3>
                  
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

                    <GlassInput
                      icon={<MapPin size={18} />}
                      label="Location"
                      placeholder="e.g. New York, NY"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      disabled={formData.isRemote}
                      required={!formData.isRemote}
                      className="input-soft"
                    />

                    <label className="flex items-center gap-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer w-fit p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl shadow-inner-soft hover:bg-neutral-100 transition-colors">
                      <input
                        type="checkbox"
                        className="rounded-lg w-5 h-5 text-accent-500 focus:ring-accent-500 bg-white dark:bg-neutral-900 border-none cursor-pointer"
                        checked={formData.isRemote}
                        onChange={(e) => setFormData({ ...formData, isRemote: e.target.checked })}
                      />
                      This is a fully remote position
                    </label>
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

                    {/* Template Suggestion Banner */}
                    <AnimatePresence>
                      {suggestedTemplate && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.25 }}
                          className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3.5"
                        >
                          <div className="flex items-start gap-2.5 flex-1 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Wand2 size={15} className="text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300 leading-tight">
                                Template available: <span className="italic">{suggestedTemplate}</span>
                              </p>
                              <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                                Auto-fill the description &amp; requirements with a professional template — you can edit it afterwards.
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={applyTemplate}
                            className="flex-shrink-0 self-start sm:self-center flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm whitespace-nowrap"
                          >
                            <Wand2 size={13} />
                            Use Template
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
                {step === 3 ? 'Post Job' : 'Next Step'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};