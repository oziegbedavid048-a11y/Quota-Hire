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

      {/* â”€â”€ Hero Header â”€â”€ */}
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

      {/* â”€â”€ Card grid â”€â”€ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

        {/* â”€â”€ Standard CV Card â”€â”€ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          onClick={() => setShowStandard(true)}
          className="group relative cursor-pointer rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-accent-500 dark:hover:border-accent-500 shadow-sm hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300 overflow-hidden"
        >
          {/* Top gradient band */}
          <div className="h-2 w-full bg-gradient-to-r from-[#116108] to-[#72dd15]" />

          <div className="p-7">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#116108] to-[#72dd15] flex items-center justify-center mb-5 shadow-lg shadow-accent-900/20 group-hover:scale-105 transition-transform">
              <FileText className="w-7 h-7 text-white" />
            </div>

            <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white mb-2 group-hover:text-accent-700 dark:group-hover:text-accent-400 transition-colors">
              Generate CV
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
              Professional multi-template CV. Answer a few questions about your experience, skills and goals â€” we'll generate a polished, downloadable PDF tailored to you.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Steel accent Template', 'AI-formatted bullets', 'Multiple designs', 'Instant PDF'].map(tag => (
                <span key={tag} className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 border border-accent-100 dark:border-accent-800">
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#116108] to-[#72dd15] hover:from-[#0e4f06] hover:to-[#15750a] shadow-md shadow-accent-900/20 transition-all group-hover:shadow-lg">
              Generate CV <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* â”€â”€ Europass Card â”€â”€ */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          onClick={() => setShowEuropass(true)}
          className="group relative cursor-pointer rounded-3xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-accent-500 dark:hover:border-accent-500 shadow-sm hover:shadow-2xl hover:shadow-accent-500/10 transition-all duration-300 overflow-hidden"
        >
          {/* EU accent top band */}
          <div className="h-2 w-full bg-gradient-to-r from-[#15750a] to-[#72dd15]" />

          {/* EU Stars watermark */}
          <div className="absolute top-4 right-5 text-accent-400 text-xl opacity-20 group-hover:opacity-40 transition-opacity select-none pointer-events-none">
            â˜…â˜…â˜…â˜…â˜…â˜…â˜…â˜…â˜…â˜…â˜…â˜…
          </div>

          <div className="p-7">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#15750a] to-[#72dd15] flex items-center justify-center mb-5 shadow-lg shadow-accent-900/20 group-hover:scale-105 transition-transform relative">
              <Globe className="w-7 h-7 text-white" />
              <div className="absolute -top-1 -right-1 bg-accent-400 rounded-full w-4 h-4 flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-accent-900 fill-accent-900" />
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">
                Generate Europe CV
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-accent-400 text-accent-900 uppercase tracking-wide">
                EU Style
              </span>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
              Create an official Europe-formatted CV, including CEFR language levels, digital skills, and your passport photo.
            </p>

            {/* Feature tags */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['Europass Format', 'Passport Photo', 'CEFR Languages', 'EU-Standard Sections'].map(tag => (
                <span key={tag} className="px-2.5 py-1 text-[11px] font-bold rounded-lg text-accent-700 dark:text-accent-300 border" style={{ background: 'rgba(114,221,21,0.1)', borderColor: 'rgba(114,221,21,0.2)' }}>
                  {tag}
                </span>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white shadow-md transition-all group-hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #15750a 0%, #72dd15 100%)' }}>
              <span className="text-accent-400">â˜…</span> Generate Europe CV <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* â”€â”€ Info strip â”€â”€ */}
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
            Once generated, all your CVs appear under <strong>My Profile â†’ Generated Documents</strong> and can be downloaded as PDF at any time. CVs generated during job applications are also saved there automatically.
          </p>
        </div>
      </motion.div>

      {/* â”€â”€ Modals â”€â”€ */}
      <GenerateCVModal isOpen={showStandard} onClose={() => setShowStandard(false)} />
      <EuropassCVWizard
        isOpen={showEuropass}
        onClose={() => setShowEuropass(false)}
        onSaved={() => {
          setShowEuropass(false);
          toast.success('Europass CV saved! View it in your profile â†’ Generated Documents.', { duration: 5000 });
        }}
      />
    </div>
  );
}

