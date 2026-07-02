import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BlobProvider } from '@react-pdf/renderer';
import {
  Loader2, Send, ChevronRight, ChevronLeft, X, Sparkles,
  FileText, AlertTriangle, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { Job, EmployeeProfile } from '../../types';
import { PdfPreview } from './PdfPreview';

// CV Engine
import { WizardAnswers, buildCVData, generateAIAssistedSuggestions } from '../../lib/cv/cvContentBuilder';
import { selectTemplate } from '../../lib/cv/cvTemplateSelector';
import { TemplateId } from '../../lib/cv/types';

// Templates
import { VividSidebarTemplate } from './templates/VividSidebarTemplate';
import { ModernTechTemplate } from './templates/ModernTechTemplate';
import { SteelBlueBannerTemplate } from './templates/SteelBlueBannerTemplate';
import { PlainTemplate1 } from './templates/plain/PlainTemplate1';
import { PlainTemplate2 } from './templates/plain/PlainTemplate2';
import { PlainTemplate3 } from './templates/plain/PlainTemplate3';
import { PlainTemplate4 } from './templates/plain/PlainTemplate4';

interface ApplyJobCVWizardProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (cvId: number) => void;
}

const PIC_TEMPLATES: Record<string, { name: string; color: string }> = {
  T3:  { name: 'Crimson Banner',       color: '#8B1A1A' },
  T7:  { name: 'Dark Green Pro',       color: '#1a3c2a' },
  T14: { name: 'Steel Blue Banner',    color: '#1B4F8A' },
};

const PLAIN_TEMPLATES: Record<string, { name: string; color: string }> = {
  P1:  { name: 'Traditional Formal',     color: '#000000' },
  P2:  { name: 'Corporate Clean',        color: '#1B4F8A' },
  P3:  { name: 'Minimalist Classic',     color: '#2D5016' },
  P4:  { name: 'Modern Plain',           color: '#1E293B' },
  T14: { name: 'Steel Blue Banner',    color: '#1B4F8A' },
};

export function ApplyJobCVWizard({ job, isOpen, onClose, onComplete }: ApplyJobCVWizardProps) {
  const { currentUser } = useAppContext();

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passportImage, setPassportImage] = useState<string | null>(null);

  // ── Steps: 1=Role, 2=Experience, 3=Generating, 4=Review ──────────────────
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // ── Blob ref: stores the latest PDF blob for the save handler ─────────────
  // (avoids setState-in-render by using a ref instead of state)
  const currentBlobRef = useRef<Blob | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  // ── Template selection ────────────────────────────────────────────────────
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('T1');
  const [selectedTemplateName, setSelectedTemplateName] = useState('Classic Split');

  // ── Wizard state ──────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<WizardAnswers>({
    headline: '',
    achievement: '',
    extraSkills: '',
    languages: '',
    workEntries: [{ role: '', company: '', period: '', duties: '' }],
  });

  // ── Load profile when wizard opens ───────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!currentUser?.id) {
      setProfileError('You must be logged in to generate a CV.');
      return;
    }
    try {
      setProfileLoading(true);
      setProfileError(null);
      // Try to fetch a fresh profile from the API
      const res = await apiFetch('/profile/employee/');
      // Merge fetched data with currentUser for maximum completeness
      const merged: EmployeeProfile = { ...(currentUser as EmployeeProfile), ...res };
      setProfile(merged);
      setAnswers(prev => ({
        ...prev,
        headline: res.title || (currentUser as any).title || job.title,
      }));
    } catch (err: any) {
      console.error('[CV Wizard] Profile load error:', err);
      // Graceful fallback: use currentUser data so we don't block CV generation
      if (currentUser) {
        setProfile(currentUser as EmployeeProfile);
        setAnswers(prev => ({
          ...prev,
          headline: (currentUser as any).title || job.title,
        }));
        setProfileError(`Profile loaded from cache (${err?.message || 'network error'}). Some details may be incomplete.`);
      } else {
        setProfileError(`Failed to load profile: ${err?.message || 'Unknown error'}. Cannot generate CV.`);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [currentUser, job.title]);

  useEffect(() => {
    if (isOpen) {
      const recommended = selectTemplate(job);
      setSelectedTemplateId(recommended.templateId);
      setSelectedTemplateName(recommended.templateName);
      setStep(1);
      currentBlobRef.current = null;
      currentUrlRef.current = null;
      loadProfile();
    }
  }, [isOpen]);

  // ── Simulate Generation Step (step 3 → 4) ────────────────────────────────
  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => setStep(4), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // ── Reset PDF state when template changes ─────────────────────────────────
  useEffect(() => {
    currentBlobRef.current = null;
    currentUrlRef.current = null;
  }, [selectedTemplateId]);

  // ── Dynamic Template Logic ────────────────────────────────────────────────
  const availableTemplates = passportImage 
    ? { ...PIC_TEMPLATES, ...Object.fromEntries(Object.entries(PLAIN_TEMPLATES).slice(0, 4)) }
    : PLAIN_TEMPLATES;

  // Auto-switch template if photo is removed and current template is PIC_TEMPLATE
  useEffect(() => {
    const isStrictlyPicTemplate = Object.keys(PIC_TEMPLATES).includes(selectedTemplateId) && !Object.keys(PLAIN_TEMPLATES).includes(selectedTemplateId);
    if (!passportImage && isStrictlyPicTemplate) {
      setSelectedTemplateId('P1');
      setSelectedTemplateName(PLAIN_TEMPLATES['P1'].name);
    }
  }, [passportImage, selectedTemplateId]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const addWorkEntry = () =>
    setAnswers(prev => ({
      ...prev,
      workEntries: [...prev.workEntries, { role: '', company: '', period: '', duties: '' }],
    }));

  const updateWorkEntry = (index: number, field: string, value: string) =>
    setAnswers(prev => {
      const newEntries = [...prev.workEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, workEntries: newEntries };
    });

  const handleSuggest = () => {
    if (!answers.headline) {
      toast.error('Please enter a Target Headline first.');
      return;
    }
    const effectiveProfile = profile || (currentUser as EmployeeProfile);
    const suggestions = generateAIAssistedSuggestions(answers.headline, effectiveProfile);
    setAnswers(prev => ({
      ...prev,
      achievement: suggestions.achievement || prev.achievement,
      extraSkills: suggestions.extraSkills || prev.extraSkills,
      workEntries: suggestions.workEntries || prev.workEntries,
    }));
    toast.success('Suggestions applied! Feel free to edit them.');
  };

  const handlePassportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setPassportImage(event.target?.result as string);
      toast.success('Passport photo attached.');
    };
    reader.readAsDataURL(file);
  };

  // ── Build CV data (always from latest profile + answers) ──────────────────
  const effectiveProfile = profile || (currentUser as EmployeeProfile);
  const { cvData, coverLetterData } = buildCVData(
    effectiveProfile,
    job,
    answers,
    selectedTemplateId,
    selectedTemplateName,
    passportImage
  );

  // ── Render the selected PDF template ─────────────────────────────────────
  const renderTemplate = () => {
    switch (selectedTemplateId) {
      case 'T3':  return <VividSidebarTemplate data={cvData} />;
      case 'T7':  return <ModernTechTemplate data={cvData} />;
      case 'T14': return <SteelBlueBannerTemplate data={cvData} />;
      case 'P1':  return <PlainTemplate1 data={cvData} />;
      case 'P2':  return <PlainTemplate2 data={cvData} />;
      case 'P3':  return <PlainTemplate3 data={cvData} />;
      case 'P4':  return <PlainTemplate4 data={cvData} />;
      default:    return <PlainTemplate1 data={cvData} />;
    }
  };

  // ── Save CV to Django backend ─────────────────────────────────────────────
  const handleSaveToDjango = async (blob: Blob | null) => {
    if (!blob) {
      toast.error('PDF is still generating. Please wait a moment and try again.');
      return;
    }

    setSaving(true);
    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = async () => {
          try {
            const base64data = reader.result?.toString().split(',')[1];
            if (!base64data) throw new Error('Base64 conversion failed — PDF data is empty.');

            const payload = {
              job_id: job.id,
              template_id: selectedTemplateId,
              template_name: selectedTemplateName,
              target_role: job.title,
              target_company: job.companyName || 'Unknown',
              cv_pdf_base64: base64data,
              cover_letter_text: [
                coverLetterData.paragraph1,
                coverLetterData.paragraph2,
                coverLetterData.paragraph3,
                coverLetterData.paragraph4,
              ].join('\n\n'),
              work_experience_json: answers.workEntries,
            };

            const res = await apiFetch('/cv/save/', {
              method: 'POST',
              body: JSON.stringify(payload),
            });

            toast.success('CV Generated & Saved!');
            onComplete(res.id);
            resolve();
          } catch (err: any) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('FileReader failed to read the PDF blob.'));
      });
    } catch (err: any) {
      console.error('[CV Wizard] Save error:', err);
      toast.error(`Failed to save CV: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };


  // ── Render guard: show loading or fatal error before main UI ──────────────
  const isFatalError = profileError && !profile && !currentUser;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 pb-0">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-2xl bg-gray-50 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 h-[92vh] sm:h-auto sm:max-h-[92vh]"
          >
            {/* ── Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Tailor CV for {job.title}
                </h2>
                {step !== 3 && (
                  <p className="text-gray-400 mt-0.5 text-xs sm:text-sm">
                    Step {step === 4 ? 3 : step} of 3 •{' '}
                    {step === 1 ? 'Target Role & Impact' : step === 2 ? 'Experience Wizard' : 'Final Review'}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition ml-4 shrink-0"
                aria-label="Close wizard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Profile warning banner (non-fatal errors) ─────────────────── */}
            {profileError && !isFatalError && (
              <div className="px-5 py-2.5 bg-amber-50 border-b border-amber-200 flex items-start gap-2 shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 leading-relaxed">{profileError}</p>
              </div>
            )}

            {/* ── Main Body ─────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto bg-white">

              {/* Fatal error state */}
              {isFatalError ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[50vh]">
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Cannot Generate CV</h3>
                  <p className="text-red-600 text-sm mb-4 max-w-sm">{profileError}</p>
                  <button
                    onClick={loadProfile}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </button>
                </div>
              ) : profileLoading ? (
                /* Loading profile */
                <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[50vh]">
                  <Loader2 className="w-10 h-10 animate-spin text-gray-400 mb-4" />
                  <p className="text-gray-500 text-sm">Loading your profile…</p>
                </div>
              ) : (
                <>
                  {/* ── Step 1: Role & Impact ─────────────────────────────── */}
                  {step === 1 && (
                    <div className="p-5 sm:p-6 space-y-5">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-semibold text-gray-700">
                            Target Headline
                          </label>
                          <button
                            type="button"
                            onClick={handleSuggest}
                            className="text-xs flex items-center gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded transition"
                          >
                            <Sparkles className="w-3 h-3" />
                            Autofill Suggestions
                          </button>
                        </div>
                        <input
                          value={answers.headline}
                          onChange={e => setAnswers(p => ({ ...p, headline: e.target.value }))}
                          placeholder="e.g. Senior Operations Manager"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition"
                        />
                        <p className="text-[11px] text-gray-400">Matches the exact job title you are applying for. Click Autofill to generate content based on this.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          Key Achievement (Standout Metric)
                        </label>
                        <textarea
                          value={answers.achievement}
                          onChange={e => setAnswers(p => ({ ...p, achievement: e.target.value }))}
                          placeholder="e.g. Increased quarterly revenue by 25% through strategic partnerships..."
                          className="w-full px-4 py-3 h-24 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          Extra Job-Specific Skills
                        </label>
                        <input
                          value={answers.extraSkills}
                          onChange={e => setAnswers(p => ({ ...p, extraSkills: e.target.value }))}
                          placeholder="e.g. Salesforce, B2B Sales, Cold Calling"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition"
                        />
                        <p className="text-[11px] text-gray-400">Comma-separated. These get prioritised in your CV.</p>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          Languages (Select 2 or 3)
                        </label>
                        <input
                          value={answers.languages}
                          onChange={e => setAnswers(p => ({ ...p, languages: e.target.value }))}
                          placeholder="e.g. English, French, Spanish"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 outline-none text-sm transition"
                        />
                        <p className="text-[11px] text-gray-400">Comma-separated. If left empty, a default set based on your profile will be used.</p>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-semibold text-gray-700">
                          Passport Photo (Optional)
                        </label>
                        <div className="flex items-center gap-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                          {passportImage ? (
                            <img src={passportImage} alt="Passport" className="w-12 h-12 rounded-full object-cover border border-gray-300" />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center border border-gray-300 border-dashed">
                              <FileText className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePassportUpload}
                              className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300 transition w-full"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                              If uploaded, it will appear on select templates (e.g. Classic Split, Executive Blue). If not, no photo will be shown.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Profile preview */}
                      {effectiveProfile && (
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 space-y-1">
                          <p className="font-semibold text-blue-800 mb-2">✓ Profile data will be used:</p>
                          <p><span className="font-medium">Name:</span> {effectiveProfile.name || '—'}</p>
                          <p><span className="font-medium">Skills:</span> {(effectiveProfile.skills || []).slice(0, 5).join(', ') || '—'}</p>
                          <p><span className="font-medium">Location:</span> {[effectiveProfile.city, effectiveProfile.country].filter(Boolean).join(', ') || '—'}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Step 2: Experience Wizard ─────────────────────────── */}
                  {step === 2 && (
                    <div className="p-5 sm:p-6 space-y-5">
                      <p className="text-sm text-gray-500">
                        Add your work roles. Type raw duties and our engine converts them into professional bullet points on the final PDF.
                      </p>

                      {answers.workEntries.map((entry, i) => (
                        <div key={i} className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-gray-700">Role</label>
                              <input
                                value={entry.role}
                                onChange={e => updateWorkEntry(i, 'role', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-900 transition"
                                placeholder="Job Title"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-gray-700">Company</label>
                              <input
                                value={entry.company}
                                onChange={e => updateWorkEntry(i, 'company', e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-900 transition"
                                placeholder="Company Name"
                              />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Period</label>
                            <input
                              value={entry.period}
                              onChange={e => updateWorkEntry(i, 'period', e.target.value)}
                              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-gray-900 transition"
                              placeholder="e.g. Jan 2020 - Present"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Duties / Responsibilities</label>
                            <textarea
                              value={entry.duties}
                              onChange={e => updateWorkEntry(i, 'duties', e.target.value)}
                              className="w-full px-3 py-2 h-20 bg-white border border-gray-200 rounded-lg text-sm resize-none outline-none focus:border-gray-900 transition"
                              placeholder="Managed a team of 5. Handled daily reports..."
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addWorkEntry}
                        className="w-full py-3 border-dashed border-2 border-gray-300 text-gray-500 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                      >
                        + Add Another Role
                      </button>
                    </div>
                  )}

                  {/* ── Step 3: Generating animation ─────────────────────── */}
                  {step === 3 && (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[50vh]">
                      <div className="relative mb-8">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
                          <Sparkles className="w-10 h-10 text-emerald-500 animate-bounce" />
                        </div>
                        <Loader2 className="w-24 h-24 text-emerald-400 animate-spin absolute inset-0 opacity-40" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating Application</h3>
                      <p className="text-gray-400 max-w-sm mx-auto text-sm leading-relaxed">
                        Formatting your achievements, crafting your cover letter, and rendering your tailored PDF CV…
                      </p>
                    </div>
                  )}

                  {/* ── Step 4: Final Review ──────────────────────────────── */}
                  {step === 4 && (
                    <div className="p-5 sm:p-6 space-y-8 bg-gray-50/50">

                      {/* Cover Letter */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                            <FileText className="w-4 h-4" />
                          </div>
                          <h3 className="font-bold text-gray-900">Generated Cover Letter</h3>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 text-sm text-gray-600 leading-relaxed shadow-sm">
                          <p>{coverLetterData.paragraph1}</p>
                          <p>{coverLetterData.paragraph2}</p>
                          <p>{coverLetterData.paragraph3}</p>
                          <p>{coverLetterData.paragraph4}</p>
                        </div>
                      </div>

                      {/* PDF Preview Section */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <FileText className="w-4 h-4" />
                            </div>
                            <h3 className="font-bold text-gray-900">Tailored CV Preview</h3>
                          </div>
                          {/* Quick action buttons removed to enforce partial preview */}
                          <div className="flex items-center gap-2">
                          </div>
                        </div>

                        {/* ── BlobProvider: single source of truth for PDF blob ── */}
                        <BlobProvider document={renderTemplate()}>
                          {({ blob, url, loading: blobLoading, error: blobError }) => {
                            // Safe ref update (refs don't trigger re-renders)
                            if (blob) currentBlobRef.current = blob;
                            if (url) currentUrlRef.current = url;

                            return (
                              <>
                                {/* PDF Viewer Container */}
                                  {!blobLoading && !blobError && url ? (
                                    <PdfPreview url={url} />
                                  ) : (
                                    <div
                                      className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative select-none"
                                      style={{ height: '55vh', minHeight: '380px' }}
                                    >
                                      {/* Loading overlay */}
                                      {blobLoading && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
                                          <p className="text-sm text-gray-500 font-medium">Rendering PDF…</p>
                                          <p className="text-xs text-gray-400 mt-1">This usually takes a few seconds</p>
                                        </div>
                                      )}

                                      {/* Error state */}
                                      {!blobLoading && blobError && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center z-10">
                                          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
                                          <p className="text-red-700 font-bold text-sm mb-1">Failed to Render PDF</p>
                                          <p className="text-red-500 text-xs mb-4 max-w-xs">
                                            {blobError.message || 'An unexpected error occurred while rendering the CV template.'}
                                          </p>
                                          <p className="text-gray-400 text-xs">
                                            Try switching to a different template below, or reload the wizard.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                {/* Template Selector */}
                                <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-sm mt-4">
                                  <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                                    Change CV Design
                                  </p>
                                  <div className="flex gap-2 flex-wrap">
                                    {(Object.entries(availableTemplates) as [TemplateId, { name: string; color: string }][]).map(([id, { name, color }]) => (
                                      <button
                                        key={id}
                                        onClick={() => {
                                          setSelectedTemplateId(id);
                                          setSelectedTemplateName(name);
                                        }}
                                        className={`px-3 py-1.5 rounded-full border-2 text-xs font-semibold transition-all ${
                                          selectedTemplateId === id
                                            ? 'text-white shadow-md scale-105'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                        style={
                                          selectedTemplateId === id
                                            ? { backgroundColor: color, borderColor: color }
                                            : {}
                                        }
                                      >
                                        {name}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* ── Footer Save Button (uses same blob from BlobProvider) ── */}
                                <div className="pt-2">
                                  <button
                                    onClick={() => handleSaveToDjango(blob)}
                                    disabled={blobLoading || saving || !!blobError}
                                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl flex items-center justify-center text-sm font-bold transition shadow-lg shadow-emerald-600/30 disabled:shadow-none"
                                  >
                                    {saving ? (
                                      <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Saving CV & Attaching to Application…
                                      </>
                                    ) : blobLoading ? (
                                      <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Waiting for PDF to render…
                                      </>
                                    ) : (
                                      <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Continue Applying with This CV
                                      </>
                                    )}
                                  </button>
                                  {blobError && (
                                    <p className="text-center text-xs text-red-500 mt-2">
                                      Cannot save — PDF failed to render. Please try a different template.
                                    </p>
                                  )}
                                </div>
                              </>
                            );
                          }}
                        </BlobProvider>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Footer Navigation (steps 1, 2 only) ───────────────────────── */}
            {!isFatalError && !profileLoading && step !== 3 && step !== 4 && (
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
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl flex items-center text-sm font-semibold transition shadow-md shadow-gray-900/20"
                >
                  {step === 2 ? 'Generate Application' : 'Next Step'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
