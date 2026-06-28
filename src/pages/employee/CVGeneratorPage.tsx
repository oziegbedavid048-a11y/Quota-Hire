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

      {/* ── Hero Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-200 dark:border-accent-800 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 text-xs font-bold mb-5">
          <Sparkles className="w-3.5 h-3.5" />
          AI-Powered CV Generator
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white mb-3 tracking-tight">
          Build Your Perfect CV
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Choose a style below. Your generated CV will be saved to your profile so you can download it anytime.
        </p>
      </motion.div>

      {/* ── Card grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* ── Standard CV Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => setShowStandard(true)}
          className="group relative cursor-pointer rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-blue-500 dark:hover:border-blue-500 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden"
        >
          {/* Top gradient band */}
          <div className="h-2 w-full bg-gradient-to-r from-[#1B4F8A] to-[#2563eb]" />

          <div className="p-7">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1B4F8A] to-[#2563eb] flex items-center justify-center mb-5 shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
              Generate CV
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
              Professional multi-template CV. Answer a few questions about your experience, skills and goals — we'll generate a polished, downloadable PDF tailored to you.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Steel Blue Template', 'AI-formatted bullets', 'Multiple designs', 'Instant PDF'].map(tag => (
                <span key={tag} className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1B4F8A] to-[#2563eb] hover:from-[#163d6e] hover:to-[#1d4ed8] shadow-md shadow-blue-900/20 transition-all group-hover:shadow-lg">
              Generate CV <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* ── Europass Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => setShowEuropass(true)}
          className="group relative cursor-pointer rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-yellow-500 dark:hover:border-yellow-500 shadow-sm hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300 overflow-hidden"
        >
          {/* EU blue top band */}
          <div className="h-2 w-full bg-gradient-to-r from-[#003399] to-[#1a4db3]" />

          {/* EU Stars watermark */}
          <div className="absolute top-4 right-5 text-yellow-400 text-xl opacity-20 group-hover:opacity-40 transition-opacity select-none pointer-events-none">
            ★★★★★★★★★★★★
          </div>

          <div className="p-7">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#003399] to-[#1a4db3] flex items-center justify-center mb-5 shadow-lg shadow-blue-900/20 group-hover:scale-105 transition-transform relative">
              <Globe className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full w-4 h-4 flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-blue-900 fill-blue-900" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors">
                Generate Europass CV
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-yellow-400 text-blue-900 uppercase tracking-wide">
                EU Style
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
              Official European Europass format with passport photo, CEFR language table, competencies grid and all required sections — perfect for jobs in Europe.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Europass Format', 'Passport Photo', 'CEFR Languages', 'EU-Standard Sections'].map(tag => (
                <span key={tag} className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-yellow-700 dark:text-yellow-300 border" style={{ background: 'rgba(0,51,153,0.06)', borderColor: 'rgba(0,51,153,0.15)' }}>
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-md transition-all group-hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #003399 0%, #1a4db3 100%)' }}>
              <span className="text-yellow-400">★</span> Generate Europass CV <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Info strip ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-10 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-start gap-4"
      >
        <div className="w-9 h-9 shrink-0 rounded-xl bg-accent-100 dark:bg-accent-900/40 flex items-center justify-center text-accent-600 dark:text-accent-400 mt-0.5">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">Your CVs are saved automatically</p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
            Once generated, all your CVs appear under <strong>My Profile → Generated Documents</strong> and can be downloaded as PDF at any time. CVs generated during job applications are also saved there automatically.
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
