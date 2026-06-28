import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Globe, FileText, ArrowRight, Star } from 'lucide-react';
import { GenerateCVModal } from '../../components/cv/GenerateCVModal';
import { EuropassCVWizard } from '../../components/cv/EuropassCVWizard';
import { toast } from 'sonner';

export function CVGeneratorPage() {
  const [showStandard, setShowStandard] = useState(false);
  const [showEuropass, setShowEuropass] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">

      {/* ── Dashboard Style Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500/10 via-white dark:via-neutral-900 to-warm-500/10 border border-neutral-100 dark:border-neutral-800 p-8 sm:p-12 shadow-sm mb-10 flex flex-col items-center text-center"
      >
        <div className="z-10 w-full max-w-[280px] sm:max-w-[360px] md:max-w-lg mb-8">
          <motion.img
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: [0, -15, 0], opacity: 1 }}
            transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut" }, opacity: { duration: 0.8 } }}
            src="/assets/resume_3d.png"
            alt="3D Resume Illustration"
            className="w-full h-auto drop-shadow-2xl mx-auto"
          />
        </div>
        
        <div className="z-10 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 text-xs font-bold mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered CV Generator
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-neutral-900 dark:text-white mb-4 tracking-tight leading-tight">
            Build Your Perfect CV
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base sm:text-lg leading-relaxed">
            Choose a style below. Your generated CV will be saved automatically to your profile so you can download it anytime and use it for applications.
          </p>
        </div>

        {/* Decorative background blurs */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-accent-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-warm-400/20 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* ── List Layout Options ── */}
      <div className="flex flex-col gap-5">

        {/* ── Standard CV Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => setShowStandard(true)}
          className="group relative cursor-pointer rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-accent-500/50 dark:hover:border-accent-500/50 shadow-sm hover:shadow-xl hover:shadow-accent-500/5 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-center p-6 sm:p-8 gap-6 sm:gap-8"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#116108] to-[#72dd15] flex items-center justify-center shadow-lg shadow-accent-900/20 group-hover:scale-105 transition-transform">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white mb-2 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">
              Generate Standard CV
            </h2>
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
              Professional multi-template CV. Answer a few questions about your experience, skills and goals — we'll generate a polished, downloadable PDF tailored to you.
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#116108] to-[#72dd15] hover:from-[#0e4f06] hover:to-[#15750a] shadow-md shadow-accent-900/20 transition-all group-hover:shadow-lg flex items-center justify-center gap-2">
              Start <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* ── Europass Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => setShowEuropass(true)}
          className="group relative cursor-pointer rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/40 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:border-accent-500/50 dark:hover:border-accent-500/50 shadow-sm hover:shadow-xl hover:shadow-accent-500/5 transition-all duration-300 overflow-hidden flex flex-col sm:flex-row items-center p-6 sm:p-8 gap-6 sm:gap-8"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-gradient-to-br from-[#15750a] to-[#72dd15] flex items-center justify-center shadow-lg shadow-accent-900/20 group-hover:scale-105 transition-transform relative">
            <Globe className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                Generate Europe CV
              </h2>
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-md bg-accent-400 text-accent-900 uppercase tracking-wide">
                EU Style
              </span>
            </div>
            <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-2xl">
              Create an official Europe-formatted CV, including CEFR language levels, digital skills, and your passport photo.
            </p>
          </div>

          <div className="w-full sm:w-auto shrink-0 mt-2 sm:mt-0">
            <button className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-md transition-all group-hover:shadow-lg flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #15750a 0%, #72dd15 100%)' }}>
              Start <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ——— Info strip ——— */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 p-5 sm:p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 flex items-start gap-4 sm:gap-5"
      >
        <div className="w-10 h-10 shrink-0 rounded-xl bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-600 dark:text-accent-400">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mb-1">Your CVs are saved automatically</p>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Once generated, all your CVs appear under <strong className="text-neutral-700 dark:text-neutral-300">My Profile → Generated Documents</strong> and can be downloaded as PDF at any time. CVs generated during job applications are also saved there automatically.
          </p>
        </div>
      </motion.div>

      {/* ── Modals ── */}
      <GenerateCVModal isOpen={showStandard} onClose={() => setShowStandard(false)} />
      <EuropassCVWizard
        isOpen={showEuropass}
        onClose={() => setShowEuropass(false)}
        onSaved={() => {
          setShowEuropass(false);
          toast.success('Europass CV saved! View it in your profile → Generated Documents.', { duration: 5000 });
        }}
      />
    </div>
  );
}

