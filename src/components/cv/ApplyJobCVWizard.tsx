import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PDFViewer, PDFDownloadLink, BlobProvider } from '@react-pdf/renderer';
import { Loader2, Download, Send, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext, apiFetch } from '../../context/AppContext';
import { Job, EmployeeProfile } from '../../types';

// CV Engine
import { WizardAnswers, buildCVData, dutiesToBullets } from '../../lib/cv/cvContentBuilder';
import { selectTemplate } from '../../lib/cv/cvTemplateSelector';
import { TemplateId } from '../../lib/cv/types';

// Templates
import { ClassicSplitTemplate } from './templates/ClassicSplitTemplate';
import { ExecutiveDarkTemplate } from './templates/ExecutiveDarkTemplate';
import { VividSidebarTemplate } from './templates/VividSidebarTemplate';
import { InverseGreenTemplate } from './templates/InverseGreenTemplate';
import { CorporateBannerTemplate } from './templates/CorporateBannerTemplate';
import { CoverLetterTemplate } from '../../lib/cv/coverLetterTemplate';

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
      // Auto-select template based on job
      const recommended = selectTemplate(job);
      setSelectedTemplateId(recommended.templateId);
      setSelectedTemplateName(recommended.templateName);
    }
  }, [isOpen, user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/profile/employee/');
      // Profile data from endpoint needs to be mapped to employee profile, but we just need title
      setProfile(user as EmployeeProfile); // user contains basic employee details from context
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
      
      // Convert Blob to Base64
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-[1200px] h-[90vh] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tailor CV for {job.title}</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Step {step} of 4 • {
                    step === 1 ? 'Target Role & Impact' : 
                    step === 2 ? 'Experience Wizard' : 
                    step === 3 ? 'Cover Letter Preview' : 
                    'Final PDF Preview'
                  }
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {['T1', 'T2', 'T3', 'T4', 'T5'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTemplateId(t as TemplateId)}
                      className={`w-8 h-8 rounded-full border-2 text-xs font-bold transition-all ${
                        selectedTemplateId === t ? 'border-primary bg-primary/10 text-primary scale-110' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              
              {/* Left Panel: Inputs */}
              <div className="w-[45%] flex flex-col bg-white border-r border-gray-200 z-10 overflow-y-auto">
                <div className="p-6 flex-1">
                  
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Target Headline</label>
                          <input 
                            value={answers.headline}
                            onChange={e => setAnswers(p => ({ ...p, headline: e.target.value }))}
                            placeholder="e.g. Senior Operations Manager"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          />
                          <p className="text-xs text-gray-500">Matches the job title you are applying for.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Key Achievement (Standout Metric)</label>
                          <textarea 
                            value={answers.achievement}
                            onChange={e => setAnswers(p => ({ ...p, achievement: e.target.value }))}
                            placeholder="e.g. Increased quarterly revenue by 25% through strategic partnerships..."
                            className="w-full px-4 py-2.5 h-24 bg-gray-50 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          />
                          <p className="text-xs text-gray-500">This will be highlighted in your summary and cover letter.</p>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">Extra Job-Specific Skills (Comma separated)</label>
                          <input 
                            value={answers.extraSkills}
                            onChange={e => setAnswers(p => ({ ...p, extraSkills: e.target.value }))}
                            placeholder="e.g. Salesforce, B2B Sales, Cold Calling"
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                          />
                          <p className="text-xs text-gray-500">These are prioritised over your profile skills for this specific job.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <p className="text-sm text-gray-600 mb-4">
                        Add your recent roles. Just type the raw duties, and our engine will convert them into professional, action-verb bullet points instantly.
                      </p>
                      
                      {answers.workEntries.map((entry, i) => (
                        <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4 mb-4 relative">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-gray-700">Role</label>
                              <input value={entry.role} onChange={e => updateWorkEntry(i, 'role', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="Job Title" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-gray-700">Company</label>
                              <input value={entry.company} onChange={e => updateWorkEntry(i, 'company', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="Company Name" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Period</label>
                            <input value={entry.period} onChange={e => updateWorkEntry(i, 'period', e.target.value)} className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-primary" placeholder="e.g. Jan 2020 - Present" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-700">Duties / Responsibilities (Raw text)</label>
                            <textarea 
                              value={entry.duties} 
                              onChange={e => updateWorkEntry(i, 'duties', e.target.value)} 
                              className="w-full px-3 py-2 h-20 bg-white border border-gray-200 rounded-lg text-sm resize-none outline-none focus:border-primary" 
                              placeholder="Managed a team of 5. Handled daily reports. Improved efficiency by 10%..." 
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
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 mb-2">Review your auto-generated cover letter based on your inputs and the job description.</p>
                      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 text-sm text-gray-700 leading-relaxed shadow-sm">
                        <p>{coverLetterData.paragraph1}</p>
                        <p>{coverLetterData.paragraph2}</p>
                        <p>{coverLetterData.paragraph3}</p>
                        <p>{coverLetterData.paragraph4}</p>
                      </div>
                      <p className="text-xs text-gray-500 italic mt-2">This will be sent directly to the employer along with your CV.</p>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="flex flex-col items-center justify-center h-full space-y-6 text-center">
                      <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <Send className="w-10 h-10" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Ready to Apply?</h3>
                      <p className="text-gray-500 max-w-sm mx-auto">
                        Your highly-tailored CV and Cover Letter are ready. Review the PDF preview on the right. If it looks good, save it and proceed to apply.
                      </p>
                    </div>
                  )}

                </div>

                {/* Bottom Actions */}
                <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between shrink-0">
                  <button onClick={handlePrev} disabled={step === 1 || saving} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg flex items-center text-sm font-medium disabled:opacity-50 transition">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>

                  {step < 4 ? (
                    <button onClick={handleNext} className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center text-sm font-medium transition">
                      Next Step <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  ) : (
                    <BlobProvider document={renderTemplate()}>
                      {({ blob, loading: pdfLoading }) => (
                        <button 
                          onClick={() => handleSaveToDjango(blob)} 
                          disabled={pdfLoading || saving}
                          className="px-8 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center text-sm font-medium transition disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                          {saving ? 'Saving...' : 'Save & Continue'}
                        </button>
                      )}
                    </BlobProvider>
                  )}
                </div>
              </div>

              {/* Right Panel: Live PDF Preview */}
              <div className="flex-1 bg-gray-100/50 p-6 flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Preview
                  </h3>
                  {step === 3 ? (
                    <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md">Cover Letter Preview</span>
                  ) : (
                    <PDFDownloadLink document={renderTemplate()} fileName={`CV_${cvData.name.replace(/\s+/g, '_')}.pdf`}>
                      {/* @ts-ignore */}
                      {({ loading: dlLoading }) => (
                        <button className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg flex items-center font-medium disabled:opacity-50" disabled={dlLoading}>
                          <Download className="w-3 h-3 mr-1" /> {dlLoading ? '...' : 'Download PDF'}
                        </button>
                      )}
                    </PDFDownloadLink>
                  )}
                </div>
                
                <div className="flex-1 w-full bg-white rounded-xl shadow-xl border border-gray-200/60 overflow-hidden ring-1 ring-black/5 flex items-center justify-center">
                  {loading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : (
                    <PDFViewer style={{ width: '100%', height: '100%', border: 'none' }} showToolbar={false}>
                      {step === 3 ? <CoverLetterTemplate data={coverLetterData} /> : renderTemplate()}
                    </PDFViewer>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
