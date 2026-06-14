import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, UploadCloud, FileText, CheckCircle2, X,
  ChevronRight, Briefcase, GraduationCap, MapPin, Phone,
  Sparkles, RefreshCw, User, Clock
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { uploadResume, updateProfile } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.endsWith('.docx') &&
      !selectedFile.name.endsWith('.doc')
    ) {
      setError('Please upload a PDF or Word document (.doc, .docx).');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setIsParsing(true);

    try {
      const response = await uploadResume(selectedFile);
      setParsedData(response.parsed);
    } catch (err: any) {
      setError(err.message || 'Failed to parse resume. Please try again or fill manually.');
      setFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFileChange(e.dataTransfer.files[0]);
  };

  const handleSaveToProfile = async () => {
    if (!parsedData) return;
    setIsSaving(true);
    try {
      await updateProfile({
        title: parsedData.title || undefined,
        bio: parsedData.bio || undefined,
        skills: parsedData.skills?.length > 0 ? parsedData.skills : undefined,
        education: parsedData.education || undefined,
        experienceYears: parsedData.experience_years || undefined,
        phoneNumber: parsedData.phone_number || undefined,
        location: parsedData.location || undefined,
      });
      toast.success('Profile updated successfully from resume!');
      navigate('/employee/profile');
    } catch {
      toast.error('Failed to save parsed data to profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── helpers ──
  const Field = ({ label, value }: { label: string; value?: string | number | null }) => (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 shrink-0">
        {label}
      </span>
      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 break-words leading-snug">
        {value || <span className="text-neutral-400 dark:text-neutral-600 font-normal italic text-xs">Not found</span>}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-6 px-4">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employee/profile')}
            className="shrink-0 p-2.5 rounded-full bg-white dark:bg-neutral-900 shadow-sm border border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white truncate">
              Smart Resume Upload
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
              Upload your CV to auto-fill your profile
            </p>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {/* ── Upload dropzone ── */}
          {!parsedData && !isParsing && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`m-4 border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 scale-[1.01]'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-accent-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={e => e.target.files && handleFileChange(e.target.files[0])}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                <div className="w-14 h-14 bg-accent-50 dark:bg-accent-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UploadCloud size={28} className="text-accent-500" />
                </div>
                <p className="font-extrabold text-base text-neutral-900 dark:text-white mb-1">
                  Click or drag & drop
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  PDF, DOC or DOCX · max 5 MB
                </p>
              </div>

              {error && (
                <div className="mx-4 mb-4 flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40 rounded-2xl text-red-600 dark:text-red-400 text-sm">
                  <X size={16} className="shrink-0 mt-0.5" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
                {[
                  { icon: FileText, text: 'Text-based PDF' },
                  { icon: Briefcase, text: 'Word document' },
                  { icon: Sparkles, text: 'Auto-fills profile' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1.5 p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl">
                    <Icon size={16} className="text-accent-500" />
                    <span className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 text-center leading-tight">{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Parsing loader ── */}
          {isParsing && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm p-10 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw size={28} className="text-accent-500" />
                </motion.div>
              </div>
              <div>
                <p className="font-extrabold text-neutral-900 dark:text-white">Reading your CV…</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Extracting details from <span className="font-semibold">{file?.name}</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Parsed results ── */}
          {parsedData && !isParsing && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Success banner */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                <div className="shrink-0 w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-emerald-900 dark:text-emerald-100 text-sm">Extraction Complete</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed mt-0.5">
                    Review the details below, then tap "Save to Profile" to fill all your profile sections automatically.
                  </p>
                </div>
              </div>

              {/* Professional identity */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-neutral-50 dark:border-neutral-800">
                  <User size={14} className="text-accent-500 shrink-0" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                    Professional Identity
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <Field label="Job Title" value={parsedData.title} />
                  <div className="h-px bg-neutral-50 dark:bg-neutral-800" />
                  <Field label="Professional Summary" value={parsedData.bio} />
                </div>
              </div>

              {/* Contact & meta */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-neutral-50 dark:border-neutral-800">
                  <MapPin size={14} className="text-accent-500 shrink-0" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                    Contact & Details
                  </span>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <Phone size={16} className="text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                    <Field label="Phone" value={parsedData.phone_number} />
                  </div>
                  <div className="flex items-start gap-3 min-w-0">
                    <MapPin size={16} className="text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                    <Field label="Location" value={parsedData.location} />
                  </div>
                  <div className="flex items-start gap-3 min-w-0">
                    <Clock size={16} className="text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                    <Field
                      label="Experience"
                      value={parsedData.experience_years ? `${parsedData.experience_years} year${parsedData.experience_years !== 1 ? 's' : ''}` : null}
                    />
                  </div>
                </div>
              </div>

              {/* Qualifications */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-neutral-50 dark:border-neutral-800">
                  <GraduationCap size={14} className="text-accent-500 shrink-0" />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-500">
                    Qualifications
                  </span>
                </div>
                <div className="p-5 space-y-4">
                  <Field label="Education" value={parsedData.education} />
                  <div className="h-px bg-neutral-50 dark:bg-neutral-800" />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-2">
                      Detected Skills
                    </span>
                    {parsedData.skills?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills.map((skill: string) => (
                          <span
                            key={skill}
                            className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-100 dark:border-accent-900/40"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-neutral-400 italic">No skill matches found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pb-6">
                <button
                  onClick={() => { setParsedData(null); setFile(null); setError(null); }}
                  className="flex-1 px-5 py-3.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-extrabold text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Upload Different File
                </button>
                <button
                  onClick={handleSaveToProfile}
                  disabled={isSaving}
                  className="flex-1 px-5 py-3.5 rounded-2xl bg-accent-600 hover:bg-accent-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-accent-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <RefreshCw size={16} />
                      </motion.div>
                      Saving…
                    </>
                  ) : (
                    <>
                      Confirm & Save to Profile
                      <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
