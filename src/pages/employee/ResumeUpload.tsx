import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UploadCloud, FileText, CheckCircle2, AlertCircle, X, ChevronRight, Briefcase, GraduationCap, MapPin, Mail, Phone, Code2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';

export default function ResumeUpload() {
  const navigate = useNavigate();
  const { uploadResume, updateProfile } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (selectedFile: File) => {
    if (!selectedFile) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.docx') && !selectedFile.name.endsWith('.doc')) {
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSaveToProfile = async () => {
    if (!parsedData) return;

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
    } catch (err) {
      toast.error('Failed to save parsed data to profile.');
    }
  };

  return (
    <div className="min-h-screen py-6 sm:py-10 relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full mx-auto px-4 max-w-2xl relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/employee/profile')}
            className="p-2.5 rounded-full bg-white dark:bg-neutral-900 shadow-soft text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white">Smart Resume Upload</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Upload your CV to automatically fill your profile</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!parsedData && !isParsing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-soft p-6 sm:p-10"
            >
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-accent-500 bg-accent-50 dark:bg-accent-900/20 scale-[1.02]'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-accent-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileChange(e.target.files[0])}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                />
                
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UploadCloud size={32} className="text-accent-500" />
                </div>
                
                <h3 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white mb-2">
                  Click to upload or drag & drop
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 max-w-sm mx-auto">
                  PDF, DOC, or DOCX (Max 5MB). We'll extract your details and prepopulate your profile.
                </p>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {isParsing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-soft p-12 flex flex-col items-center justify-center text-center min-h-[400px]"
            >
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 border-4 border-neutral-100 dark:border-neutral-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-accent-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-accent-500">
                  <FileText size={24} />
                </div>
              </div>
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2">Reading your resume...</h2>
              <p className="text-neutral-500 dark:text-neutral-400">Extracting skills, experience, and contact info.</p>
            </motion.div>
          )}

          {parsedData && !isParsing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="card-soft p-5 sm:p-6 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30 flex items-start gap-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100 mb-1">Extraction Complete</h3>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Review the details we found below. You can confirm and save this to your profile, and then edit anything that isn't quite right.
                  </p>
                </div>
              </div>

              <div className="card-soft p-6 space-y-6">
                
                {/* Basic Info */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Briefcase size={14} /> Professional Identity
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 mb-1">Job Title</div>
                      <div className="font-bold text-neutral-900 dark:text-white">{parsedData.title || <span className="text-neutral-400 font-normal italic">Not found</span>}</div>
                    </div>
                    
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 mb-1">Professional Summary</div>
                      <div className="text-sm text-neutral-900 dark:text-white leading-relaxed">{parsedData.bio || <span className="text-neutral-400 italic">Not found</span>}</div>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

                {/* Contact & Meta */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <MapPin size={14} /> Contact & Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                      <Phone size={16} className="text-neutral-400 shrink-0" />
                      <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">{parsedData.phone_number || <span className="text-neutral-400 font-normal italic">Not found</span>}</div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                      <MapPin size={16} className="text-neutral-400 shrink-0" />
                      <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">{parsedData.location || <span className="text-neutral-400 font-normal italic">Not found</span>}</div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-3">
                      <Briefcase size={16} className="text-neutral-400 shrink-0" />
                      <div className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {parsedData.experience_years ? `${parsedData.experience_years} Years Exp` : <span className="text-neutral-400 font-normal italic">Exp not found</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-neutral-100 dark:border-neutral-800" />

                {/* Education & Skills */}
                <div>
                  <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <GraduationCap size={14} /> Qualifications
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 mb-2">Education</div>
                      <div className="text-sm text-neutral-900 dark:text-white whitespace-pre-wrap">{parsedData.education || <span className="text-neutral-400 italic">Not found</span>}</div>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-3 sm:p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      <div className="text-xs text-neutral-500 mb-2">Detected Skills</div>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.skills && parsedData.skills.length > 0 ? (
                          parsedData.skills.map((skill: string) => (
                            <span key={skill} className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-bold text-neutral-700 dark:text-neutral-300">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-neutral-400 italic">No exact skill matches found</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => { setParsedData(null); setFile(null); }}
                  className="flex-1 px-6 py-3.5 sm:py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-extrabold hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  Upload Different File
                </button>
                <button
                  onClick={handleSaveToProfile}
                  className="flex-1 px-6 py-3.5 sm:py-4 rounded-2xl bg-accent-600 hover:bg-accent-700 text-white font-extrabold shadow-lg shadow-accent-500/25 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  Confirm & Save to Profile <ChevronRight size={18} />
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
