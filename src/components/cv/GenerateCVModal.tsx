import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlobProvider } from '@react-pdf/renderer';
import {
  X, ChevronRight, ChevronLeft, Loader2, FileText,
  Sparkles, CheckCircle, User, Briefcase,
  GraduationCap, Star, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { EmployeeProfile } from '../../types';
import { SteelBlueBannerTemplate } from './templates/SteelBlueBannerTemplate';
import { CVData } from '../../lib/cv/types';
import { generateAIAssistedSuggestions } from '../../lib/cv/cvContentBuilder';
import { PdfPreview } from './PdfPreview';

// ── Types ────────────────────────────────────────────────────────────────────
interface WorkEntry {
  role: string;
  company: string;
  period: string;
  duties: string;
}

interface GenerateCVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildCVDataFromForm(profile: EmployeeProfile, form: FormState): CVData {
  const extraSkillsList = form.extraSkills
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const allSkills = [...new Set([...(profile.skills ?? []), ...extraSkillsList])].slice(0, 10);

  const years = profile.experienceYears ?? 0;
  const domain = form.headline.toLowerCase().includes('sales')
    ? 'sales and business development'
    : form.headline.toLowerCase().includes('manager') || form.headline.toLowerCase().includes('director')
    ? 'management and leadership'
    : form.headline.toLowerCase().includes('finance') || form.headline.toLowerCase().includes('account')
    ? 'finance and accounting'
    : form.headline.toLowerCase().includes('software') || form.headline.toLowerCase().includes('developer')
    ? 'software engineering and technology'
    : 'professional services';

  const summary = years > 0
    ? `${form.headline} with ${years}+ years of proven expertise in ${domain}. ${allSkills.length ? `Skilled in ${allSkills.slice(0, 3).join(', ')}.` : ''} Committed to delivering exceptional outcomes and driving meaningful impact in every role.`
    : `${form.headline} with a strong background in ${domain}. ${allSkills.length ? `Skilled in ${allSkills.slice(0, 3).join(', ')}.` : ''} Dedicated to delivering high-quality results and exceeding expectations consistently.`;

  const experience: WorkEntry[] = form.workEntries
    .filter(e => e.role.trim() || e.company.trim())
    .slice(0, 3);

  const langList = form.languages
    ? form.languages.split(',').map(l => l.trim()).filter(Boolean)
    : ['English (Native)', 'French (Conversational)'];

  return {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phoneNumber || '',
    location: [profile.city, profile.country].filter(Boolean).join(', '),
    linkedinUrl: profile.linkedinUrl,
    headline: form.headline || profile.title || 'Professional',
    summary,
    experience,
    skills: allSkills,
    education: form.education || profile.education || '',
    achievement: form.achievement,
    targetRole: form.headline,
    companyName: '',
    templateId: 'T14',
    templateName: 'Steel Blue Banner',
    certifications: form.certifications
      ? form.certifications.split(',').map(c => c.trim()).filter(Boolean)
      : [],
    languages: langList,
    strengths: form.strengths
      ? form.strengths.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    interests: [],
    references: 'Available upon request',
  };
}

// ── Form State ────────────────────────────────────────────────────────────────
interface FormState {
  headline: string;
  achievement: string;
  extraSkills: string;
  languages: string;
  education: string;
  certifications: string;
  strengths: string;
  workEntries: WorkEntry[];
}

const INITIAL_FORM: FormState = {
  headline: '',
  achievement: '',
  extraSkills: '',
  languages: '',
  education: '',
  certifications: '',
  strengths: '',
  workEntries: [{ role: '', company: '', period: '', duties: '' }],
};

// ── Step config ───────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Target Role & Summary', icon: User },
  { id: 2, label: 'Work Experience', icon: Briefcase },
  { id: 3, label: 'Education & Skills', icon: GraduationCap },
  { id: 4, label: 'Preview & Save', icon: Star },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function GenerateCVModal({ isOpen, onClose }: GenerateCVModalProps) {
  const { currentUser, updateProfile } = useAppContext();
  const profile = currentUser as EmployeeProfile;

  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormState>({
    ...INITIAL_FORM,
    headline: (profile as any)?.title || '',
    education: profile?.education || '',
    extraSkills: (profile?.skills || []).join(', '),
  });

  const currentBlobRef = useRef<Blob | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const [backendSaved, setBackendSaved] = useState(false);
  const [backendSaving, setBackendSaving] = useState(false);

  // Reset on open
  const handleOpen = useCallback(() => {
    setStep(1);
    setGenerating(false);
    setSaving(false);
    setSaved(false);
    setBackendSaved(false);
    setBackendSaving(false);
    currentBlobRef.current = null;
    currentUrlRef.current = null;
    setForm({
      ...INITIAL_FORM,
      headline: (profile as any)?.title || '',
      education: profile?.education || '',
      extraSkills: (profile?.skills || []).join(', '),
    });
  }, [profile]);

  const handleSuggest = () => {
    if (!form.headline) {
      toast.error('Please enter a Target Headline first.');
      return;
    }
    const effectiveProfile = profile || (currentUser as EmployeeProfile);
    const suggestions = generateAIAssistedSuggestions(form.headline, effectiveProfile);
    
    setForm(prev => ({
      ...prev,
      achievement: suggestions.achievement || prev.achievement,
      extraSkills: suggestions.extraSkills || prev.extraSkills,
      workEntries: suggestions.workEntries && suggestions.workEntries.length > 0 ? suggestions.workEntries : prev.workEntries,
    }));
    toast.success('Suggestions applied! Feel free to edit them.');
  };

  // Navigate steps
  const handleNext = () => {
    // Validation
    if (step === 1 && !form.headline.trim()) {
      toast.error('Please enter a target headline/job title.');
      return;
    }
    if (step === 2) {
      const validEntries = form.workEntries.filter(e => e.role.trim() && e.company.trim());
      if (validEntries.length === 0) {
        toast.error('Please add at least one valid work experience (role and company).');
        return;
      }
    }
    if (step === 3 && (!form.education.trim() || !form.extraSkills.trim())) {
      toast.error('Please enter your education background and core skills.');
      return;
    }

    if (step === 3) {
      setGenerating(true);
      setTimeout(() => {
        setGenerating(false);
        setStep(4);
      }, 2200);
    } else {
      setStep(s => Math.min(s + 1, 4));
    }
  };
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  // Work entries
  const addEntry = () =>
    setForm(p => ({ ...p, workEntries: [...p.workEntries, { role: '', company: '', period: '', duties: '' }] }));

  const updateEntry = (i: number, field: keyof WorkEntry, val: string) =>
    setForm(p => {
      const entries = [...p.workEntries];
      entries[i] = { ...entries[i], [field]: val };
      return { ...p, workEntries: entries };
    });

  const removeEntry = (i: number) =>
    setForm(p => ({ ...p, workEntries: p.workEntries.filter((_, idx) => idx !== i) }));

  // Save profile from CV data
  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const extraSkillsList = form.extraSkills.split(',').map(s => s.trim()).filter(Boolean);
      const allSkills = [...new Set([...(profile.skills ?? []), ...extraSkillsList])];

      await updateProfile({
        title: form.headline || undefined,
        education: form.education || undefined,
        bio: (profile as any)?.bio || undefined,
        skills: allSkills.length ? allSkills : undefined,
      });

      setSaved(true);
      toast.success('Profile updated from your generated CV!');
    } catch (e: any) {
      toast.error('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveToDjango = async (blob: Blob | null) => {
    if (!blob) {
      toast.error('PDF is still rendering. Please wait a moment.');
      return;
    }
    setBackendSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const b64 = reader.result?.toString().split(',')[1];
            if (!b64) throw new Error('Base64 conversion failed.');
            await apiFetch('/cv/save/', {
              method: 'POST',
              body: JSON.stringify({
                template_id: 'T14',
                template_name: 'Steel Blue Banner',
                target_role: form.headline || 'Generated CV',
                target_company: '',
                cv_pdf_base64: b64,
                cover_letter_text: '',
                work_experience_json: form.workEntries,
              }),
            });
            setBackendSaved(true);
            toast.success('CV saved to your Generated Documents!');
            resolve();
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('FileReader failed.'));
      });
    } catch (err: any) {
      toast.error(`Failed to save CV: ${err?.message || 'Unknown error'}`);
    } finally {
      setBackendSaving(false);
    }
  };

  // Build CV data
  const cvData = buildCVDataFromForm(profile, form);

  // ── Shared styles & helpers ────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none text-sm transition';
  const labelCls = 'block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5';

  const SuggestionChips = ({ options, fieldKey, isAppend = false }: { options: string[], fieldKey: keyof FormState, isAppend?: boolean }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => {
            setForm(p => {
              const current = p[fieldKey] as string;
              let newVal = opt;
              if (isAppend) {
                newVal = current ? `${current}, ${opt}` : opt;
              }
              return { ...p, [fieldKey]: newVal };
            });
          }}
          className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100 hover:bg-blue-100 transition active:scale-95"
        >
          + {opt}
        </button>
      ))}
    </div>
  );

  return (
    <AnimatePresence onExitComplete={handleOpen}>
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
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Generate Your Resume</h2>
                {!generating && step !== 4 && (
                  <p className="text-gray-400 text-xs mt-0.5">
                    Step {step} of 3 · {STEPS[step - 1]?.label}
                  </p>
                )}
                {step === 4 && !generating && (
                  <p className="text-gray-400 text-xs mt-0.5">Preview & Save to Profile</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition ml-4 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Step progress bar ── */}
            {!generating && (
              <div className="flex gap-1 px-5 py-3 bg-white border-b border-gray-100 shrink-0">
                {[1, 2, 3, 4].map(s => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                      s <= step ? 'bg-blue-900' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto bg-white">

              {/* Generating animation */}
              {generating && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[50vh]">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-10 h-10 text-blue-800 animate-bounce" />
                    </div>
                    <Loader2 className="w-24 h-24 text-blue-700 animate-spin absolute inset-0 opacity-30" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Building Your Resume</h3>
                  <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                    Formatting your experience, crafting your summary, and rendering your Steel Blue CV…
                  </p>
                </div>
              )}

              {/* ── Step 1: Target Role & Summary ── */}
              {!generating && step === 1 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Target Headline / Job Title <span className="text-red-400">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggest}
                        className="text-[11px] font-bold flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md transition"
                      >
                        <Sparkles className="w-3 h-3" />
                        Autofill Suggestions
                      </button>
                    </div>
                    <input
                      value={form.headline}
                      onChange={e => setForm(p => ({ ...p, headline: e.target.value }))}
                      placeholder="e.g. Senior Sales Executive"
                      className={inputCls}
                    />
                    <p className="text-[11px] text-gray-400">This becomes the title on your resume and drives the summary generation.</p>
                    <SuggestionChips
                      fieldKey="headline"
                      options={['Account Executive', 'Sales Development Rep', 'Customer Success Manager', 'Operations Analyst']}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Key Achievement <span className="text-gray-400 font-normal">(Optional)</span></label>
                    <textarea
                      value={form.achievement}
                      onChange={e => setForm(p => ({ ...p, achievement: e.target.value }))}
                      placeholder="e.g. Increased revenue by 30% in 6 months through strategic partnership initiatives…"
                      className={`${inputCls} h-24 resize-none`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Languages <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input
                      value={form.languages}
                      onChange={e => setForm(p => ({ ...p, languages: e.target.value }))}
                      placeholder="e.g. English, French, Spanish"
                      className={inputCls}
                    />
                    <p className="text-[11px] text-gray-400">Leave empty to auto-detect from your profile.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Strengths <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input
                      value={form.strengths}
                      onChange={e => setForm(p => ({ ...p, strengths: e.target.value }))}
                      placeholder="e.g. Leadership, Adaptability, Attention to Detail"
                      className={inputCls}
                    />
                    <SuggestionChips
                      fieldKey="strengths"
                      isAppend={true}
                      options={['Leadership', 'Negotiation', 'Problem Solving', 'Client Retention', 'Strategic Planning']}
                    />
                  </div>
                </div>
              )}

              {/* ── Step 2: Work Experience ── */}
              {!generating && step === 2 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <p className="text-sm text-gray-500">
                    Add up to 3 work roles. Type raw duties — the engine converts them into professional bullet points.
                  </p>

                  {form.workEntries.map((entry, i) => (
                    <div key={i} className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4 relative">
                      {form.workEntries.length > 1 && (
                        <button
                          onClick={() => removeEntry(i)}
                          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Role {i + 1}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-700">Job Title</label>
                          <input
                            value={entry.role}
                            onChange={e => updateEntry(i, 'role', e.target.value)}
                            placeholder="e.g. Sales Manager"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-700">Company</label>
                          <input
                            value={entry.company}
                            onChange={e => updateEntry(i, 'company', e.target.value)}
                            placeholder="e.g. Acme Corp"
                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Period</label>
                        <input
                          value={entry.period}
                          onChange={e => updateEntry(i, 'period', e.target.value)}
                          placeholder="e.g. Jan 2020 – Present"
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-900 transition"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Duties / Responsibilities</label>
                        <textarea
                          value={entry.duties}
                          onChange={e => updateEntry(i, 'duties', e.target.value)}
                          className="w-full px-3 py-2 h-24 bg-white border border-gray-200 rounded-lg text-sm resize-none outline-none focus:border-blue-900 transition"
                          placeholder="Managed a team of 10. Handled quarterly reports and client accounts…"
                        />
                        <p className="text-[10px] text-gray-400">Each sentence or line becomes a bullet point on the CV.</p>
                      </div>
                    </div>
                  ))}

                  {form.workEntries.length < 3 && (
                    <button
                      type="button"
                      onClick={addEntry}
                      className="w-full py-3 border-dashed border-2 border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                    >
                      + Add Another Role
                    </button>
                  )}
                </div>
              )}

              {/* ── Step 3: Education & Skills ── */}
              {!generating && step === 3 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className={labelCls}>Education Background</label>
                    <textarea
                      value={form.education}
                      onChange={e => setForm(p => ({ ...p, education: e.target.value }))}
                      rows={4}
                      placeholder="e.g. B.Sc. Business Administration – University of Lagos (2018–2022)"
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Core Skills <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input
                      value={form.extraSkills}
                      onChange={e => setForm(p => ({ ...p, extraSkills: e.target.value }))}
                      placeholder="e.g. CRM, B2B Sales, Negotiation, Cold Calling"
                      className={inputCls}
                    />
                    <p className="text-[11px] text-gray-400">These are pre-filled from your existing profile skills. Edit as needed.</p>
                    <SuggestionChips
                      fieldKey="extraSkills"
                      isAppend={true}
                      options={['Salesforce', 'HubSpot', 'B2B Sales', 'Cold Calling', 'Account Management', 'Agile']}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelCls}>Certifications <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                    <input
                      value={form.certifications}
                      onChange={e => setForm(p => ({ ...p, certifications: e.target.value }))}
                      placeholder="e.g. PMP – 2023, HubSpot Sales Certification – 2022"
                      className={inputCls}
                    />
                    <SuggestionChips
                      fieldKey="certifications"
                      isAppend={true}
                      options={['HubSpot Inbound Sales', 'Salesforce Certified Admin', 'Google Project Management', 'PMP']}
                    />
                  </div>

                  {/* Preview of what will be on CV */}
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1">
                    <p className="font-bold text-blue-800 mb-2">✓ Summary of your CV content:</p>
                    <p><span className="font-medium">Name:</span> {profile.name || '—'}</p>
                    <p><span className="font-medium">Headline:</span> {form.headline || '—'}</p>
                    <p><span className="font-medium">Experience Entries:</span> {form.workEntries.filter(e => e.role).length}</p>
                    <p><span className="font-medium">Skills:</span> {form.extraSkills.slice(0, 60) || (profile.skills || []).join(', ').slice(0, 60) || '—'}</p>
                  </div>
                </div>
              )}

              {/* ── Step 4: Preview ── */}
              {!generating && step === 4 && (
                <div className="p-5 sm:p-6 space-y-6">

                  {/* PDF Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-900">Your Steel Blue CV</h3>
                      </div>
                      {/* Removed Open PDF Button */}
                    </div>

                    <BlobProvider document={<SteelBlueBannerTemplate data={cvData} />}>
                      {({ blob, url, loading: blobLoading, error: blobError }) => {
                        if (blob) currentBlobRef.current = blob;
                        if (url) currentUrlRef.current = url;

                        return (
                          <>
                            {/* PDF viewer */}
                            {!blobLoading && !blobError && url ? (
                              <PdfPreview url={url} />
                            ) : (
                              <div
                                className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative select-none"
                                style={{ height: '50vh', minHeight: '340px' }}
                              >
                                {blobLoading && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-800 mb-3" />
                                    <p className="text-sm text-gray-500 font-medium">Rendering PDF…</p>
                                  </div>
                                )}
                                {!blobLoading && blobError && (
                                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center z-10">
                                    <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
                                    <p className="text-red-700 font-bold text-sm">Failed to render PDF</p>
                                    <p className="text-red-500 text-xs mt-1">Please go back and check your entries.</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Save to Django CTA */}
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
                              <p className="text-sm font-bold text-blue-800 mb-1">💾 Save to Generated Documents</p>
                              <p className="text-xs text-blue-600 mb-3">
                                Save this CV so you can download it later from your profile's Generated Documents section.
                              </p>
                              {backendSaved ? (
                                <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                                  <CheckCircle className="w-5 h-5" /> CV saved to your profile!
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleSaveToDjango(blob)}
                                  disabled={backendSaving || blobLoading}
                                  className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-xl flex items-center justify-center text-sm font-bold transition shadow-md shadow-blue-700/20"
                                >
                                  {backendSaving ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving CV…</>
                                  ) : (
                                    <><FileText className="w-4 h-4 mr-2" /> Save CV to Profile</>
                                  )}
                                </button>
                              )}
                            </div>

                            {/* Update Profile CTA */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-3">
                              <p className="text-sm font-bold text-emerald-800 mb-1">Update Profile Info</p>
                              <p className="text-xs text-emerald-600 mb-3">
                                Click below to update your profile (title, education, skills) using the information from this resume.
                              </p>
                              {saved ? (
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                  <CheckCircle className="w-5 h-5" />
                                  Profile updated successfully!
                                </div>
                              ) : (
                                <button
                                  onClick={handleUpdateProfile}
                                  disabled={saving || blobLoading}
                                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl flex items-center justify-center text-sm font-bold transition shadow-md shadow-emerald-600/20"
                                >
                                  {saving ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating Profile…</>
                                  ) : (
                                    <><CheckCircle className="w-4 h-4 mr-2" /> Update Profile from CV</>
                                  )}
                                </button>
                              )}
                            </div>
                          </>
                        );
                      }}
                    </BlobProvider>
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer Navigation ── */}
            {!generating && step !== 4 && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                <button
                  onClick={handlePrev}
                  disabled={step === 1}
                  className="px-4 py-2 sm:py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl flex items-center text-sm font-medium disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={step === 1 && !form.headline.trim()}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl flex items-center text-sm font-semibold transition shadow-md shadow-blue-900/20"
                >
                  {step === 3 ? (
                    <><Sparkles className="w-4 h-4 mr-1.5" /> Generate CV</>
                  ) : (
                    <>Next Step <ChevronRight className="w-4 h-4 ml-1" /></>
                  )}
                </button>
              </div>
            )}

            {/* Step 4 footer — just close */}
            {!generating && step === 4 && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex justify-between items-center shrink-0">
                <button
                  onClick={() => { setStep(3); setSaved(false); }}
                  className="px-4 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl flex items-center text-sm font-medium transition"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Edit Details
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-semibold transition"
                >
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
