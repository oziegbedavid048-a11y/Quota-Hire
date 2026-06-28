import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlobProvider } from '@react-pdf/renderer';
import {
  X, ChevronRight, ChevronLeft, Loader2, FileText,
  Sparkles, ExternalLink, User, Briefcase, GraduationCap,
  Globe, Star, Send, AlertTriangle, Camera, Plus, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { EmployeeProfile } from '../../types';
import { EuropassTemplate, EuropassData } from './templates/EuropassTemplate';

interface EuropassCVWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (cvId: number) => void;
}

type WorkEntry = EuropassData['workExperience'][0];
type EduEntry = EuropassData['education'][0];
type LangEntry = EuropassData['foreignLanguages'][0];

const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const STEPS = [
  { id: 1, label: 'Personal Details',     icon: User },
  { id: 2, label: 'Work Experience',      icon: Briefcase },
  { id: 3, label: 'Education',            icon: GraduationCap },
  { id: 4, label: 'Languages & Digital',  icon: Globe },
  { id: 5, label: 'Competencies',         icon: Star },
  { id: 6, label: 'Preview & Save',       icon: FileText },
];

const EMPTY_WORK: WorkEntry = { dates: '', role: '', employer: '', location: '', duties: '' };
const EMPTY_EDU: EduEntry = { dates: '', qualification: '', institution: '', location: '', fieldOfStudy: '' };
const EMPTY_LANG: LangEntry = { language: '', listening: 'B2', reading: 'B2', spokenInteraction: 'B2', spokenProduction: 'B2', writing: 'B2' };

export function EuropassCVWizard({ isOpen, onClose, onSaved }: EuropassCVWizardProps) {
  const { currentUser } = useAppContext();
  const profile = currentUser as EmployeeProfile;

  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const blobRef = useRef<Blob | null>(null);
  const urlRef  = useRef<string | null>(null);

  // ── Personal Info ──────────────────────────────────────────────────────────
  const [personal, setPersonal] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nationality: '',
    address: '',
    phone: '',
    email: '',
    linkedinUrl: '',
    website: '',
    jobTitle: '',
    summary: '',
  });

  const [passportImage, setPassportImage] = useState<string | null>(null);

  // ── Work Experience ────────────────────────────────────────────────────────
  const [workEntries, setWorkEntries] = useState<WorkEntry[]>([{ ...EMPTY_WORK }]);

  // ── Education ──────────────────────────────────────────────────────────────
  const [eduEntries, setEduEntries] = useState<EduEntry[]>([{ ...EMPTY_EDU }]);

  // ── Languages ──────────────────────────────────────────────────────────────
  const [motherTongue, setMotherTongue] = useState('English');
  const [foreignLangs, setForeignLangs] = useState<LangEntry[]>([{ ...EMPTY_LANG }]);

  // ── Digital & Competencies ─────────────────────────────────────────────────
  const [digitalSkills, setDigitalSkills] = useState('');
  const [commComp, setCommComp] = useState('');
  const [orgComp, setOrgComp] = useState('');
  const [jobComp, setJobComp] = useState('');
  const [otherComp, setOtherComp] = useState('');

  // ── Additional ─────────────────────────────────────────────────────────────
  const [drivingLicence, setDrivingLicence] = useState('');
  const [certifications, setCertifications] = useState('');
  const [hobbies, setHobbies] = useState('');

  // Reset when opened
  useEffect(() => {
    if (isOpen && profile) {
      const nameParts = (profile.name || '').split(' ');
      setPersonal({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        dateOfBirth: '',
        nationality: '',
        address: [profile.city, profile.country].filter(Boolean).join(', '),
        phone: profile.phoneNumber || '',
        email: profile.email || '',
        linkedinUrl: profile.linkedinUrl || '',
        website: '',
        jobTitle: profile.title || '',
        summary: profile.bio || '',
      });
      setDigitalSkills((profile.skills || []).join(', '));
      setStep(1);
      blobRef.current = null;
      urlRef.current = null;
      setGenerating(false);
      setSaving(false);
    }
  }, [isOpen]);

  // ── Passport photo handler ─────────────────────────────────────────────────
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPassportImage(evt.target?.result as string);
      toast.success('Passport photo attached!');
    };
    reader.readAsDataURL(file);
  };

  // ── Build EuropassData ─────────────────────────────────────────────────────
  const buildData = useCallback((): EuropassData => ({
    ...personal,
    passportImageUrl: passportImage || undefined,
    workExperience: workEntries.filter(e => e.role.trim() || e.employer.trim()),
    education: eduEntries.filter(e => e.qualification.trim() || e.institution.trim()),
    motherTongue,
    foreignLanguages: foreignLangs.filter(l => l.language.trim()),
    digitalSkills,
    communicationCompetencies: commComp,
    organisationalCompetencies: orgComp,
    jobRelatedCompetencies: jobComp,
    otherCompetencies: otherComp,
    drivingLicence,
    certifications,
    hobbies,
  }), [personal, passportImage, workEntries, eduEntries, motherTongue, foreignLangs,
       digitalSkills, commComp, orgComp, jobComp, otherComp, drivingLicence, certifications, hobbies]);

  const euroData = buildData();

  // ── Auto-Fill Example Data ─────────────────────────────────────────────────
  const handleAutoFill = () => {
    setPersonal({
      firstName: 'Faithful',
      lastName: 'Awuojo Imadi',
      dateOfBirth: '14/05/1992',
      nationality: 'Nigerian',
      address: '12, Example Street, Victoria Island, Lagos, Nigeria',
      phone: '+234 800 000 0000',
      email: 'faithful.imadi@example.com',
      linkedinUrl: 'linkedin.com/in/faithful-imadi',
      website: '',
      jobTitle: 'Senior Full Stack Developer',
      summary: 'Experienced Senior Full Stack Developer with over 8 years of expertise in building scalable enterprise applications. Proficient in React, Node.js, and Python. Passionate about creating efficient solutions and leading cross-functional teams to deliver high-quality software on time.',
    });
    setWorkEntries([
      {
        dates: '05/2020 – Present',
        role: 'Senior Software Engineer',
        employer: 'TechNova Solutions',
        location: 'Lagos, Nigeria',
        duties: 'Lead a team of 5 developers to build a scalable SaaS platform.\nReduced system latency by 40% through database optimization.\nImplemented CI/CD pipelines using GitHub Actions and AWS.',
      },
      {
        dates: '01/2016 – 04/2020',
        role: 'Full Stack Developer',
        employer: 'Digital Creations Agency',
        location: 'Abuja, Nigeria',
        duties: 'Developed and maintained responsive web applications using React and Django.\nCollaborated with UI/UX designers to implement modern interfaces.\nIntegrated third-party APIs for payment processing and analytics.',
      }
    ]);
    setEduEntries([
      {
        dates: '09/2011 – 07/2015',
        qualification: 'B.Sc. Computer Science',
        institution: 'University of Lagos',
        location: 'Lagos, Nigeria',
        fieldOfStudy: 'First Class Honours',
      }
    ]);
    setMotherTongue('English');
    setForeignLangs([
      { language: 'French', listening: 'B2', reading: 'B2', spokenInteraction: 'B1', spokenProduction: 'B1', writing: 'B2' }
    ]);
    setDigitalSkills('Programming Languages: JavaScript, TypeScript, Python, Java\nFrameworks: React, Next.js, Django, Node.js\nTools: Git, Docker, AWS, Azure, CI/CD, JIRA\nDatabases: PostgreSQL, MongoDB, Redis');
    setCommComp('Excellent communication skills gained through leading team meetings, presenting technical solutions to non-technical stakeholders, and mentoring junior developers.');
    setOrgComp('Strong leadership and project management skills. Successfully managed agile sprints and coordinated cross-functional teams of up to 10 members.');
    setJobComp('Deep understanding of software architecture, microservices, and cloud infrastructure. Proficient in debugging complex production issues.');
    setOtherComp('Adaptable and quick learner. Strong problem-solving mindset with a focus on delivering business value.');
    setDrivingLicence('Category B');
    setCertifications('AWS Certified Solutions Architect – Associate (2022)\nScrum Master Certified (SMC) (2021)');
    setHobbies('Open-source contributing, Playing chess, Photography');
    toast.success('Form filled with example data! Feel free to edit.');
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 1 && !personal.firstName.trim()) {
      toast.error('Please enter your first name.'); return;
    }
    if (step === 1 && !personal.email.trim()) {
      toast.error('Please enter your email address.'); return;
    }
    if (step === 2) {
      const valid = workEntries.filter(e => e.role.trim() && e.employer.trim());
      if (valid.length === 0) {
        toast.error('Please add at least one work experience entry.'); return;
      }
    }
    if (step === 5) {
      // Transition to generating animation, then step 6
      setGenerating(true);
      setTimeout(() => {
        setGenerating(false);
        setStep(6);
      }, 2200);
      return;
    }
    setStep(s => Math.min(s + 1, 6));
  };
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  // ── Save to backend ────────────────────────────────────────────────────────
  const handleSave = async (blob: Blob | null) => {
    if (!blob) {
      toast.error('PDF is still rendering. Please wait a moment.'); return;
    }
    setSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const b64 = reader.result?.toString().split(',')[1];
            if (!b64) throw new Error('Base64 conversion failed.');
            const res = await apiFetch('/cv/save/', {
              method: 'POST',
              body: JSON.stringify({
                template_id: 'EU1',
                template_name: 'Europass',
                target_role: personal.jobTitle || 'Europass CV',
                target_company: '',
                cv_pdf_base64: b64,
                cover_letter_text: personal.summary || '',
                work_experience_json: workEntries,
              }),
            });
            toast.success('Europass CV saved to your profile!');
            onSaved?.(res.id);
            resolve();
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('FileReader failed.'));
      });
    } catch (err: any) {
      toast.error(`Failed to save: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Shared styles ──────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none text-sm transition';
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';
  const cefrSelect = (value: string, onChange: (v: string) => void) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:border-blue-900 transition"
    >
      {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
    </select>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 pb-0">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-2xl bg-gray-50 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 h-[94vh] sm:h-auto sm:max-h-[92vh]"
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 shrink-0"
                 style={{ background: 'linear-gradient(135deg, #003399 0%, #1a4db3 100%)' }}>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-400">★★</span> Generate Europass CV
                </h2>
                {!generating && step !== 6 && (
                  <p className="text-blue-200 text-xs mt-0.5">
                    Step {step} of 5 · {STEPS[step - 1]?.label}
                  </p>
                )}
              </div>
              <button onClick={onClose} className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition ml-4 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Progress bar ── */}
            {!generating && (
              <div className="flex gap-1 px-5 py-2 bg-blue-950 shrink-0 items-center justify-between">
                <div className="flex gap-1 flex-1 mr-4">
                  {[1, 2, 3, 4, 5, 6].map(s => (
                    <div key={s}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${s <= step ? 'bg-yellow-400' : 'bg-blue-800'}`}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleAutoFill}
                  className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 bg-blue-800 text-blue-200 hover:bg-blue-700 hover:text-white rounded-md transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-3 h-3" /> Auto-Fill Example
                </button>
              </div>
            )}

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto bg-white">

              {/* Generating animation */}
              {generating && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[50vh]">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 rounded-full flex items-center justify-center animate-pulse"
                         style={{ background: 'rgba(0,51,153,0.1)' }}>
                      <span className="text-4xl">★</span>
                    </div>
                    <Loader2 className="w-24 h-24 animate-spin absolute inset-0 opacity-20" style={{ color: '#003399' }} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Building Your Europass CV</h3>
                  <p className="text-gray-400 max-w-sm text-sm leading-relaxed">
                    Formatting your profile in official Europass style with all sections…
                  </p>
                </div>
              )}

              {/* ── STEP 1: Personal Details ── */}
              {!generating && step === 1 && (
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>First Name *</label>
                      <input value={personal.firstName}
                        onChange={e => setPersonal(p => ({ ...p, firstName: e.target.value }))}
                        placeholder="John" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Last Name *</label>
                      <input value={personal.lastName}
                        onChange={e => setPersonal(p => ({ ...p, lastName: e.target.value }))}
                        placeholder="Doe" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Job Title / Desired Position</label>
                    <input value={personal.jobTitle}
                      onChange={e => setPersonal(p => ({ ...p, jobTitle: e.target.value }))}
                      placeholder="e.g. Senior Sales Manager" className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Date of Birth</label>
                      <input value={personal.dateOfBirth}
                        onChange={e => setPersonal(p => ({ ...p, dateOfBirth: e.target.value }))}
                        placeholder="e.g. 12/05/1990" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Nationality</label>
                      <input value={personal.nationality}
                        onChange={e => setPersonal(p => ({ ...p, nationality: e.target.value }))}
                        placeholder="e.g. Nigerian" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Address</label>
                    <input value={personal.address}
                      onChange={e => setPersonal(p => ({ ...p, address: e.target.value }))}
                      placeholder="123 Street, London, UK" className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Phone *</label>
                      <input value={personal.phone}
                        onChange={e => setPersonal(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+44 7700 000000" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Email *</label>
                      <input value={personal.email}
                        onChange={e => setPersonal(p => ({ ...p, email: e.target.value }))}
                        placeholder="john@email.com" className={inputCls} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>LinkedIn URL</label>
                      <input value={personal.linkedinUrl}
                        onChange={e => setPersonal(p => ({ ...p, linkedinUrl: e.target.value }))}
                        placeholder="linkedin.com/in/johndoe" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Website (Optional)</label>
                      <input value={personal.website}
                        onChange={e => setPersonal(p => ({ ...p, website: e.target.value }))}
                        placeholder="www.yoursite.com" className={inputCls} />
                    </div>
                  </div>

                  <div>
                    <label className={labelCls}>Personal Statement (Optional)</label>
                    <textarea value={personal.summary}
                      onChange={e => setPersonal(p => ({ ...p, summary: e.target.value }))}
                      rows={3}
                      placeholder="Brief professional summary about yourself…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  {/* Passport Photo */}
                  <div>
                    <label className={labelCls}>Passport Photo (Recommended for Europass)</label>
                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-blue-300 shrink-0 flex items-center justify-center bg-blue-100">
                        {passportImage ? (
                          <img src={passportImage} alt="Passport" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handlePhotoUpload}
                          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-900 file:text-white hover:file:bg-blue-800 transition w-full" />
                        <p className="text-[10px] text-blue-600 mt-1">
                          Photo will appear blended in the top-left of your Europass CV header. Recommended: square format, professional attire.
                        </p>
                        {passportImage && (
                          <button onClick={() => setPassportImage(null)}
                            className="text-[10px] text-red-500 hover:text-red-700 mt-1 transition">
                            ✕ Remove photo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Work Experience ── */}
              {!generating && step === 2 && (
                <div className="p-5 sm:p-6 space-y-4">
                  <p className="text-sm text-gray-500">Add your work experience (up to 5 roles). Duties become bullet points on the CV.</p>
                  {workEntries.map((entry, i) => (
                    <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Role {i + 1}</p>
                        {workEntries.length > 1 && (
                          <button onClick={() => setWorkEntries(p => p.filter((_, idx) => idx !== i))}
                            className="p-1 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Dates (e.g. Jan 2020 – Present)</label>
                          <input value={entry.dates}
                            onChange={e => setWorkEntries(p => { const n = [...p]; n[i] = { ...n[i], dates: e.target.value }; return n; })}
                            placeholder="Jan 2020 – Present"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Job Title / Role *</label>
                          <input value={entry.role}
                            onChange={e => setWorkEntries(p => { const n = [...p]; n[i] = { ...n[i], role: e.target.value }; return n; })}
                            placeholder="Senior Sales Manager"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Employer / Company *</label>
                          <input value={entry.employer}
                            onChange={e => setWorkEntries(p => { const n = [...p]; n[i] = { ...n[i], employer: e.target.value }; return n; })}
                            placeholder="Acme Corporation"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Location (City, Country)</label>
                          <input value={entry.location}
                            onChange={e => setWorkEntries(p => { const n = [...p]; n[i] = { ...n[i], location: e.target.value }; return n; })}
                            placeholder="London, UK"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-700 mb-1 block">Duties & Responsibilities</label>
                        <textarea value={entry.duties}
                          onChange={e => setWorkEntries(p => { const n = [...p]; n[i] = { ...n[i], duties: e.target.value }; return n; })}
                          rows={3}
                          placeholder="Led a team of 8 sales reps. Developed new market strategies. Increased revenue by 30%..."
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm resize-none outline-none focus:border-blue-900 transition" />
                        <p className="text-[10px] text-gray-400 mt-1">Each sentence becomes a bullet point on the CV.</p>
                      </div>
                    </div>
                  ))}
                  {workEntries.length < 5 && (
                    <button onClick={() => setWorkEntries(p => [...p, { ...EMPTY_WORK }])}
                      className="w-full py-3 border-dashed border-2 border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Another Role
                    </button>
                  )}
                </div>
              )}

              {/* ── STEP 3: Education ── */}
              {!generating && step === 3 && (
                <div className="p-5 sm:p-6 space-y-4">
                  <p className="text-sm text-gray-500">Add your educational qualifications (up to 3).</p>
                  {eduEntries.map((entry, i) => (
                    <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Qualification {i + 1}</p>
                        {eduEntries.length > 1 && (
                          <button onClick={() => setEduEntries(p => p.filter((_, idx) => idx !== i))}
                            className="p-1 text-gray-400 hover:text-red-500 transition rounded-full hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Dates (e.g. 2018 – 2022)</label>
                          <input value={entry.dates}
                            onChange={e => setEduEntries(p => { const n = [...p]; n[i] = { ...n[i], dates: e.target.value }; return n; })}
                            placeholder="2018 – 2022"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Qualification / Degree *</label>
                          <input value={entry.qualification}
                            onChange={e => setEduEntries(p => { const n = [...p]; n[i] = { ...n[i], qualification: e.target.value }; return n; })}
                            placeholder="B.Sc. Business Administration"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Field of Study</label>
                          <input value={entry.fieldOfStudy || ''}
                            onChange={e => setEduEntries(p => { const n = [...p]; n[i] = { ...n[i], fieldOfStudy: e.target.value }; return n; })}
                            placeholder="Marketing & Sales"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Institution *</label>
                          <input value={entry.institution}
                            onChange={e => setEduEntries(p => { const n = [...p]; n[i] = { ...n[i], institution: e.target.value }; return n; })}
                            placeholder="University of Lagos"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-700 mb-1 block">Location</label>
                          <input value={entry.location}
                            onChange={e => setEduEntries(p => { const n = [...p]; n[i] = { ...n[i], location: e.target.value }; return n; })}
                            placeholder="Lagos, Nigeria"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {eduEntries.length < 3 && (
                    <button onClick={() => setEduEntries(p => [...p, { ...EMPTY_EDU }])}
                      className="w-full py-3 border-dashed border-2 border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 transition font-medium text-sm flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Another Qualification
                    </button>
                  )}
                </div>
              )}

              {/* ── STEP 4: Languages & Digital Skills ── */}
              {!generating && step === 4 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <label className={labelCls}>Mother Tongue *</label>
                    <input value={motherTongue}
                      onChange={e => setMotherTongue(e.target.value)}
                      placeholder="e.g. English" className={inputCls} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className={labelCls}>Foreign Languages (CEFR Levels)</label>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="text-left p-2 font-bold text-blue-900 border border-blue-100 min-w-[100px]">Language</th>
                            <th className="p-2 font-bold text-blue-900 border border-blue-100">Listening</th>
                            <th className="p-2 font-bold text-blue-900 border border-blue-100">Reading</th>
                            <th className="p-2 font-bold text-blue-900 border border-blue-100">Spoken Int.</th>
                            <th className="p-2 font-bold text-blue-900 border border-blue-100">Spoken Prod.</th>
                            <th className="p-2 font-bold text-blue-900 border border-blue-100">Writing</th>
                            <th className="p-2 border border-blue-100"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {foreignLangs.map((lang, i) => (
                            <tr key={i} className="border border-gray-100">
                              <td className="p-1.5 border border-gray-100">
                                <input value={lang.language}
                                  onChange={e => setForeignLangs(p => { const n = [...p]; n[i] = { ...n[i], language: e.target.value }; return n; })}
                                  placeholder="e.g. French"
                                  className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs outline-none focus:border-blue-900" />
                              </td>
                              {(['listening', 'reading', 'spokenInteraction', 'spokenProduction', 'writing'] as const).map(field => (
                                <td key={field} className="p-1 border border-gray-100">
                                  {cefrSelect(lang[field], v => setForeignLangs(p => { const n = [...p]; n[i] = { ...n[i], [field]: v }; return n; }))}
                                </td>
                              ))}
                              <td className="p-1 border border-gray-100">
                                {foreignLangs.length > 1 && (
                                  <button onClick={() => setForeignLangs(p => p.filter((_, idx) => idx !== i))}
                                    className="p-1 text-gray-400 hover:text-red-500 transition">
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {foreignLangs.length < 4 && (
                      <button onClick={() => setForeignLangs(p => [...p, { ...EMPTY_LANG }])}
                        className="mt-2 text-xs font-bold text-blue-900 flex items-center gap-1 hover:text-blue-700 transition">
                        <Plus className="w-3.5 h-3.5" /> Add Language
                      </button>
                    )}
                    <p className="text-[10px] text-gray-400 mt-2">A1/A2 = Basic, B1/B2 = Independent, C1/C2 = Proficient (CEFR)</p>
                  </div>

                  <div>
                    <label className={labelCls}>Digital Skills</label>
                    <textarea value={digitalSkills}
                      onChange={e => setDigitalSkills(e.target.value)}
                      rows={3}
                      placeholder="e.g. Microsoft Office Suite (Word, Excel, PowerPoint), Salesforce CRM, HubSpot, Google Analytics, Adobe Acrobat"
                      className={`${inputCls} resize-none`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">List all relevant software, tools, and digital platforms.</p>
                  </div>

                  <div>
                    <label className={labelCls}>Driving Licence (Optional)</label>
                    <input value={drivingLicence}
                      onChange={e => setDrivingLicence(e.target.value)}
                      placeholder="e.g. Full UK Driving Licence (Category B)" className={inputCls} />
                  </div>

                  <div>
                    <label className={labelCls}>Certifications (Optional)</label>
                    <textarea value={certifications}
                      onChange={e => setCertifications(e.target.value)}
                      rows={2}
                      placeholder="e.g. Salesforce Certified Sales Representative (2023), HubSpot Sales Certification (2022)"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 5: Competencies ── */}
              {!generating && step === 5 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
                    <strong>Europass Competencies</strong> — These sections appear in the official Europass "Personal Competencies" section. Describe your key strengths in each category.
                  </div>

                  <div>
                    <label className={labelCls}>Communication Competencies *</label>
                    <textarea value={commComp}
                      onChange={e => setCommComp(e.target.value)}
                      rows={3}
                      placeholder="e.g. Excellent interpersonal and presentation skills acquired through 5+ years in client-facing sales roles. Experienced in delivering pitches to C-suite executives..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Organisational / Managerial Competencies *</label>
                    <textarea value={orgComp}
                      onChange={e => setOrgComp(e.target.value)}
                      rows={3}
                      placeholder="e.g. Proven ability to lead cross-functional teams of 10+. Managed pipeline of over £2M quarterly. Skilled in time management, task delegation, and project tracking..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Job-Related Competencies *</label>
                    <textarea value={jobComp}
                      onChange={e => setJobComp(e.target.value)}
                      rows={3}
                      placeholder="e.g. Proficient in full sales cycle from prospecting to closing. Expert in SPIN selling, value-based selling, and solution-based approaches..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Other Competencies (Optional)</label>
                    <textarea value={otherComp}
                      onChange={e => setOtherComp(e.target.value)}
                      rows={2}
                      placeholder="e.g. Cultural adaptability, multilingual communication, cross-border collaboration..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Hobbies & Interests (Optional)</label>
                    <input value={hobbies}
                      onChange={e => setHobbies(e.target.value)}
                      placeholder="e.g. Football, Photography, Travelling, Reading"
                      className={inputCls}
                    />
                  </div>
                </div>
              )}

              {/* ── STEP 6: Preview & Save ── */}
              {!generating && step === 6 && (
                <div className="p-5 sm:p-6 space-y-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                           style={{ background: '#003399' }}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900">Your Europass CV Preview</h3>
                    </div>
                    <button
                      onClick={() => urlRef.current && window.open(urlRef.current, '_blank', 'noopener,noreferrer')}
                      title="Open in new tab"
                      className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-400 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  <BlobProvider document={<EuropassTemplate data={euroData} />}>
                    {({ blob, url, loading: blobLoading, error: blobError }) => {
                      if (blob) blobRef.current = blob;
                      if (url) urlRef.current = url;
                      return (
                        <>
                          <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative"
                               style={{ height: '52vh', minHeight: '360px' }}>
                            {blobLoading && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                                <Loader2 className="w-8 h-8 animate-spin mb-3" style={{ color: '#003399' }} />
                                <p className="text-sm text-gray-500 font-medium">Rendering Europass PDF…</p>
                              </div>
                            )}
                            {!blobLoading && blobError && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center z-10">
                                <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
                                <p className="text-red-700 font-bold text-sm">Failed to render PDF</p>
                                <p className="text-red-500 text-xs mt-1">{blobError.message}</p>
                              </div>
                            )}
                            {!blobLoading && !blobError && url && (
                              <object data={url} type="application/pdf" className="w-full h-full border-none" aria-label="Europass CV Preview">
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
                                  <FileText className="w-12 h-12 text-gray-300 mb-4" />
                                  <p className="text-gray-600 font-semibold text-sm mb-3">Preview not supported in this browser</p>
                                  <button onClick={() => urlRef.current && window.open(urlRef.current, '_blank')}
                                    className="flex items-center gap-2 px-4 py-2 text-white rounded-xl text-sm font-semibold transition mt-3"
                                    style={{ background: '#003399' }}>
                                    <ExternalLink className="w-4 h-4" /> Open PDF
                                  </button>
                                </div>
                              </object>
                            )}
                          </div>

                          {/* Save button */}
                          <button
                            onClick={() => handleSave(blob)}
                            disabled={blobLoading || saving || !!blobError}
                            className="w-full py-3.5 text-white rounded-xl flex items-center justify-center text-sm font-bold transition shadow-lg disabled:opacity-50"
                            style={{ background: 'linear-gradient(135deg, #003399 0%, #1a4db3 100%)' }}
                          >
                            {saving ? (
                              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving to Profile…</>
                            ) : blobLoading ? (
                              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Waiting for PDF to render…</>
                            ) : (
                              <><Send className="w-5 h-5 mr-2" /> Save Europass CV to Profile</>
                            )}
                          </button>
                          {blobError && (
                            <p className="text-center text-xs text-red-500 mt-1">Cannot save — PDF failed to render. Please go back and check your entries.</p>
                          )}
                        </>
                      );
                    }}
                  </BlobProvider>
                </div>
              )}
            </div>

            {/* ── Footer Navigation ── */}
            {!generating && step !== 6 && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                <button onClick={handlePrev} disabled={step === 1}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl flex items-center text-sm font-medium disabled:opacity-30 transition">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button onClick={handleNext}
                  className="px-6 py-2.5 text-white rounded-xl flex items-center text-sm font-semibold transition shadow-md"
                  style={{ background: 'linear-gradient(135deg, #003399 0%, #1a4db3 100%)' }}>
                  {step === 5 ? (
                    <><Sparkles className="w-4 h-4 mr-1.5" /> Generate Europass CV</>
                  ) : (
                    <>Next Step <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>
            )}

            {/* Step 6 footer */}
            {!generating && step === 6 && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                <button onClick={() => setStep(5)}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl flex items-center text-sm font-medium transition">
                  <ChevronLeft className="w-4 h-4 mr-1" /> Edit Details
                </button>
                <button onClick={onClose}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition">
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
