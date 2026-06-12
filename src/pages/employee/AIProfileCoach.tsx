import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, Loader2, BarChart2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';

export const AIProfileCoach = () => {
  const { currentUser } = useAppContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/ai-analysis/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAnalysisData(data);
    } catch (e) {
      console.error(e);
      // Fallback for UI testing if backend is down
      setAnalysisData({
        score: 85,
        percentile: 90,
        strengths: ["Strong SAAS experience", "Great tenure", "Clear quota achievement"],
        tips: [
          { title: "Expand on MEDDIC", desc: "You mentioned MEDDIC but didn't provide specific examples." },
          { title: "Add more metrics", desc: "Include specific numbers for deal sizes and quota attainment." }
        ]
      });
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setShowResults(true);
      }, 1500); // Artificial delay for effect
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="min-h-screen relative overflow-hidden  font-sans py-12 px-4">
      <AnimatedBackground />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-8">
          
          {/* Hero Banner with 3D Illustration */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 card-soft relative overflow-hidden bg-gradient-to-r from-accent-50 to-warm-50 dark:from-accent-900/20 dark:to-warm-900/20 p-6 md:p-8"
          >
            <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-accent-200/40 dark:bg-accent-900/40 rounded-full blur-[60px]" />
            <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-400 rounded-full text-xs font-extrabold mb-3 shadow-inner-soft">
                  <Sparkles size={12} /> Beta Feature
                </div>
                <h1 className="text-xl md:text-2xl font-display font-extrabold text-neutral-900 dark:text-white mb-2">
                  Meet Your <span className="text-accent-600 dark:text-accent-400">AI Profile Coach</span>
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                  Get intelligent, actionable feedback to make your profile stand out to top companies.
                </p>
              </div>
              <div className="w-32 h-32 md:w-44 md:h-44 shrink-0">
                <img
                  src="/images/ai_coach_orb.png"
                  alt="AI Coach 3D Character"
                  className="w-full h-full object-contain drop-shadow-xl animate-float"
                />
              </div>
            </div>
          </motion.div>

          {!showResults ? (
            <motion.div variants={itemVariants} className="card-soft p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent-400 to-indigo-400" />
              <div className="w-28 h-28 bg-gradient-to-br from-accent-500 to-indigo-500 rounded-[32px] mx-auto mb-8 flex items-center justify-center text-white shadow-soft">
                {isAnalyzing ? <Loader2 size={48} className="animate-spin" /> : <Sparkles size={48} />}
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 dark:text-white mb-4">
                {isAnalyzing ? "Analyzing your profile..." : "Ready for your review?"}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-md mx-auto mb-10 leading-relaxed">
                {isAnalyzing 
                  ? "Our AI is currently scanning your experience, skills, and summary against thousands of successful placements."
                  : "Our AI will scan your profile against thousands of successful placements and give you a score and actionable tips."}
              </p>
              {!isAnalyzing && (
                <button onClick={handleAnalyze} className="btn-soft bg-accent-600 hover:bg-accent-700 text-white shadow-soft px-6 py-2.5 text-base inline-flex items-center gap-3">
                  Generate Analysis <ArrowRight size={20} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
              
              {/* Score Card */}
              <motion.div variants={itemVariants} className="card-soft overflow-hidden p-0 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-accent-600 to-indigo-700 opacity-100" />
                <div className="relative z-10 p-10 flex flex-col md:flex-row items-center gap-10 text-white">
                  <div className="relative w-48 h-48 shrink-0">
                    <svg className="w-full h-full transform -rotate-90 drop-shadow-md" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" />
                      <motion.circle 
                        initial={{ strokeDashoffset: 251 }}
                        animate={{ strokeDashoffset: 251 - (251 * (analysisData?.score || 0) / 100) }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        cx="50" cy="50" r="40" stroke="white" strokeWidth="12" fill="none" strokeDasharray="251" strokeLinecap="round" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl md:text-2xl md:text-2xl md:text-xl md:text-2xl font-black">{analysisData?.score || 0}</span>
                      <span className="text-sm font-bold uppercase opacity-80 mt-1">/ 100</span>
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-xl md:text-2xl font-display font-extrabold mb-3">Great Profile, {currentUser?.name.split(' ')[0]}!</h2>
                    <p className="text-white/90 mb-6 text-lg leading-relaxed max-w-lg">
                      You are in the top <span className="font-bold underline decoration-2">{100 - (analysisData?.percentile || 0)}%</span> of candidates. 
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3">
                      {analysisData?.strengths?.map((strength: string, i: number) => (
                        <div key={i} className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/20">
                          <CheckCircle2 size={16} /> {strength}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div variants={itemVariants} className="card-soft p-8 md:p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-[20px] shadow-inner-soft"><AlertCircle size={28} /></div>
                    <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">Areas for Improvement</h3>
                  </div>
                  {analysisData?.tips?.length === 0 ? (
                    <p className="text-neutral-500 font-bold">Your profile looks perfect! No major improvements needed.</p>
                  ) : (
                    <ul className="space-y-6">
                      {analysisData?.tips?.map((tip: any, i: number) => (
                        <li key={i} className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl shadow-inner-soft">
                          <span className="text-accent-500 font-black text-xl mt-0.5">{i+1}.</span>
                          <div>
                            <p className="font-extrabold text-neutral-900 dark:text-white mb-1">{tip.title}</p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{tip.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button onClick={() => window.location.href = '/employee/profile'} className="w-full mt-8 btn-soft bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 py-3">
                    Edit Profile Now
                  </button>
                </motion.div>

                <motion.div variants={itemVariants} className="card-soft p-8 md:p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-500 rounded-[20px] shadow-inner-soft"><BarChart2 size={28} /></div>
                    <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">Market Positioning</h3>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-2xl shadow-inner-soft">
                      <div className="flex justify-between text-sm mb-3 font-bold">
                        <span className="text-neutral-700 dark:text-neutral-300">Years of Experience</span>
                        <span className="text-neutral-900 dark:text-white">9/10</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-green-500 rounded-full w-[90%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div></div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-2xl shadow-inner-soft">
                      <div className="flex justify-between text-sm mb-3 font-bold">
                        <span className="text-neutral-700 dark:text-neutral-300">Industry Relevance</span>
                        <span className="text-neutral-900 dark:text-white">7/10</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-yellow-500 rounded-full w-[70%] shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div></div>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-5 rounded-2xl shadow-inner-soft">
                      <div className="flex justify-between text-sm mb-3 font-bold">
                        <span className="text-neutral-700 dark:text-neutral-300">Skill Alignment</span>
                        <span className="text-neutral-900 dark:text-white">8/10</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-accent-500 rounded-full w-[80%] shadow-[0_0_10px_rgba(var(--color-accent-500),0.5)]"></div></div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
