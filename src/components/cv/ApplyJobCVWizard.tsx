import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFViewer, BlobProvider } from '@react-pdf/renderer';
import { Loader2, Send, ChevronRight, ChevronLeft, X, Sparkles, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { Job, EmployeeProfile } from '../../types';

// CV Engine
import { WizardAnswers, buildCVData } from '../../lib/cv/cvContentBuilder';
import { selectTemplate } from '../../lib/cv/cvTemplateSelector';
import { TemplateId } from '../../lib/cv/types';

// Templates
import { ClassicSplitTemplate } from './templates/ClassicSplitTemplate';
import { ExecutiveDarkTemplate } from './templates/ExecutiveDarkTemplate';
import { VividSidebarTemplate } from './templates/VividSidebarTemplate';
import { InverseGreenTemplate } from './templates/InverseGreenTemplate';
import { CorporateBannerTemplate } from './templates/CorporateBannerTemplate';

interface ApplyJobCVWizardProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (cvId: number) => void;
}

export function ApplyJobCVWizard({ job, isOpen, onClose, onComplete }: ApplyJobCVWizardProps) {
  const { currentUser } = useAppContext();
  const user = currentUser;
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  
  // Steps: 1=Role, 2=Experience, 3=Generating, 4=Review
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Template selection
  const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>('T1');
  const [selectedTemplateName, setSelectedTemplateName] = useState('Classic Split');

  // Wizard state
  const [answers, setAnswers] = useState<WizardAnswers>({
    headline: '',
    achievement: '',
    extraSkills: '',
    workEntries: [
      { role: '', company: '', period: '', duties: '' },
    ],
  });

  useEffect(() => {
    if (isOpen && user?.id) {
      loadProfile();
      const recommended = selectTemplate(job);
      setSelectedTemplateId(recommended.templateId);
      setSelectedTemplateName(recommended.templateName);
      setStep(1); // reset on open
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/profile/employee/');
      setProfile(user as EmployeeProfile); 
      setAnswers(prev => ({
        ...prev,
        headline: res.title || (user as any).title || job.title,
      }));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile for CV generation');
    } finally {
      setLoading(false);
    }
  };

  // Simulate Generation Step
  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => {
        setStep(4);
      }, 2500); // 2.5s simulated AI generation
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (!profile && !loading) return null;

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const addWorkEntry = () => {
    setAnswers(prev => ({
      ...prev,
      workEntries: [...prev.workEntries, { role: '', company: '', period: '', duties: '' }]
    }));
  };

  const updateWorkEntry = (index: number, field: string, value: string) => {
    setAnswers(prev => {
      const newEntries = [...prev.workEntries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, workEntries: newEntries };
    });
  };

  // Build the live data
  const { cvData, coverLetterData } = buildCVData(
    profile || (user as EmployeeProfile),
    job,
    answers,
    selectedTemplateId,
    selectedTemplateName
  );

  const renderTemplate = () => {
    switch (selectedTemplateId) {
      case 'T2': return <ExecutiveDarkTemplate data={cvData} />;
      case 'T3': return <VividSidebarTemplate data={cvData} />;
      case 'T4': return <InverseGreenTemplate data={cvData} />;
      case 'T5': return <CorporateBannerTemplate data={cvData} />;
      case 'T1':
      default: return <ClassicSplitTemplate data={cvData} />;
    }
  };

  const handleSaveToDjango = async (blob: Blob | null) => {
    if (!blob) return toast.error('Failed to generate PDF blob');
    
    try {
      setSaving(true);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result?.toString().split(',')[1];
        if (!base64data) throw new Error('Base64 conversion failed');

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
            coverLetterData.paragraph4
          ].join('\n\n'),
          work_experience_json: answers.workEntries
        };

        const res = await apiFetch('/cv/save/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('CV Generated & Saved!');
        onComplete(res.id);
      };
    } catch (err) {
      console.error(err);
      toast.error('Failed to save CV');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 pb-0">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full sm:max-w-2xl bg-gray-50 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 h-[90vh] sm:h-auto sm:max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-gray-200 shrink-0">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Tailor CV for {job.title}</h2>
                {step !== 3 && (
                  <p className="text-gray-500 mt-0.5 text-xs sm:text-sm">
                    Step {step === 4 ? 3 : step} of 3 • {
                      step === 1 ? 'Target Role & Impact' : 
                      step === 2 ? 'Experience Wizard' : 
                      'Final Review'
                    }
                  </p>
                )}
              </div>
              <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition ml-4">
                <X className="w-5 h-5" />
              </button>
            </div>


            {/* Main Body - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white">
              
              {step === 1 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Target Headline</label>
                    <input 
                      value={answers.headline}
                      onChange={e => setAnswers(p => ({ ...p, headline: e.target.value }))}
                      placeholder="e.g. Senior Operations Manager"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                    />
                    <p className="text-[11px] text-gray-500">Matches the exact job title you are applying for.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Key Achievement (Standout Metric)</label>
                    <textarea 
                      value={answers.achievement}
                      onChange={e => setAnswers(p => ({ ...p, achievement: e.target.value }))}
                      placeholder="e.g. Increased quarterly revenue by 25% through strategic partnerships..."
                      className="w-full px-4 py-3 h-24 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Extra Job-Specific Skills</label>
                    <input 
                      value={answers.extraSkills}
                      onChange={e => setAnswers(p => ({ ...p, extraSkills: e.target.value }))}
                      placeholder="e.g. Salesforce, B2B Sales, Cold Calling"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="p-5 sm:p-6 space-y-5">
                  <p className="text-sm text-gray-600">
                    Add your roles. Type the raw duties, and our engine will convert them into professional bullet points instantly on the final PDF.
                  </p>
                  
                  {answers.workEntries.map((entry, i) => (
                    <div key={i} className="p-4 sm:p-5 bg-gray-50 border border-gray-200 rounded-xl space-y-4 relative">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-700">Role</label>
                          <input value={entry.role} onChange={e => updateWorkEntry(i, 'role', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="Job Title" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-gray-700">Company</label>
                          <input value={entry.company} onChange={e => updateWorkEntry(i, 'company', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="Company Name" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Period</label>
                        <input value={entry.period} onChange={e => updateWorkEntry(i, 'period', e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="e.g. Jan 2020 - Present" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700">Duties / Responsibilities</label>
                        <textarea 
                          value={entry.duties} 
                          onChange={e => updateWorkEntry(i, 'duties', e.target.value)} 
                          className="w-full px-3 py-2 h-20 bg-white border border-gray-200 rounded-lg text-sm resize-none outline-none focus:border-primary" 
                          placeholder="Managed a team of 5. Handled daily reports..." 
                        />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={addWorkEntry} className="w-full py-3 border-dashed border-2 border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition font-medium text-sm">
                    + Add Another Role
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center min-h-[50vh]">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                      <Sparkles className="w-10 h-10 text-primary animate-bounce" />
                    </div>
                    <Loader2 className="w-24 h-24 text-primary animate-spin absolute inset-0 opacity-50" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Generating Application</h3>
                  <p className="text-gray-500 max-w-sm mx-auto text-sm">
                    Our AI is formatting your achievements, crafting your cover letter, and rendering the highly-tailored PDF CV...
                  </p>
                </div>
              )}

              {step === 4 && (
                <div className="p-5 sm:p-6 space-y-8 bg-gray-50/50">
                  
                  {/* Cover Letter Section */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-gray-900">Generated Cover Letter</h3>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 space-y-4 text-sm text-gray-700 leading-relaxed shadow-sm">
                      <p>{coverLetterData.paragraph1}</p>
                      <p>{coverLetterData.paragraph2}</p>
                      <p>{coverLetterData.paragraph3}</p>
                      <p>{coverLetterData.paragraph4}</p>
                    </div>
                  </div>

                  {/* PDF Viewer Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-gray-900">Tailored CV PDF</h3>
                      </div>
                    </div>
                    
                    {/* The PDF viewer rendered inside a scrollable container for mobile */}
                    <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative" style={{ height: '60vh' }}>
                      <BlobProvider document={renderTemplate()}>
                        {({ url, loading: pdfLoading, error }) => {
                          if (pdfLoading) return (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                            </div>
                          );
                          if (error) return (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 p-6 text-center">
                              <p className="text-red-600 font-bold mb-2">Error generating PDF</p>
                              <p className="text-red-500 text-sm">{error.message}</p>
                            </div>
                          );
                          if (!url) return null;
                          return (
                            <iframe 
                              src={url} 
                              className="w-full h-full border-none"
                              title="Generated CV Preview"
                            />
                          );
                        }}
                      </BlobProvider>
                    </div>

                    {/* Template Selector */}
                    <div className="bg-white p-4 border border-gray-200 rounded-xl flex items-center justify-between overflow-x-auto hide-scrollbar shadow-sm mt-4">
                      <span className="text-sm font-semibold text-gray-700 mr-4 whitespace-nowrap">Change CV Design:</span>
                      <div className="flex gap-3">
                        {['T1', 'T2', 'T3', 'T4', 'T5'].map((t) => (
                          <button
                            key={t}
                            onClick={() => setSelectedTemplateId(t as TemplateId)}
                            className={`w-9 h-9 rounded-full border-2 text-xs font-bold transition-all shrink-0 ${
                              selectedTemplateId === t ? 'border-primary bg-primary/10 text-primary scale-110 shadow-md shadow-primary/20' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

            {/* Footer Actions */}
            {step !== 3 && (
              <div className="p-4 sm:p-5 bg-white border-t border-gray-200 flex justify-between shrink-0">
                {step < 4 ? (
                  <>
                    <button onClick={handlePrev} disabled={step === 1 || saving} className="px-4 py-2 sm:py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl flex items-center text-sm font-medium disabled:opacity-50 transition">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <button onClick={handleNext} className="px-6 py-2 sm:py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl flex items-center text-sm font-medium transition shadow-md shadow-gray-900/20">
                      {step === 2 ? 'Generate Application' : 'Next Step'} <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </>
                ) : (
                  <BlobProvider document={renderTemplate()}>
                    {({ blob, loading: pdfLoading }) => (
                      <button 
                        onClick={() => handleSaveToDjango(blob)} 
                        disabled={pdfLoading || saving}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl flex items-center justify-center text-sm font-bold transition disabled:opacity-50 shadow-lg shadow-emerald-600/30"
                      >
                        {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Send className="w-5 h-5 mr-2" />}
                        {saving ? 'Saving...' : 'Continue Applying'}
                      </button>
                    )}
                  </BlobProvider>
                )}
              </div>
            )}
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
