import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Tag, Building2, BadgeCheck } from 'lucide-react';
import { apiFetch } from '../../context/AppContext';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';

interface CompanyProfileData {
  id: string;
  companyName: string;
  website?: string;
  industry?: string;
  aboutCompany?: string;
  logoUrl?: string;
}

export const PublicProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CompanyProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    apiFetch(`/company/${id}/`)
      .then((data: any) => {
        setProfile({
          id: data.id,
          companyName: data.company_name,
          website: data.website,
          industry: data.industry,
          aboutCompany: data.about_company,
          logoUrl: data.logo_url,
        });
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load company profile');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/jobs');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-12 relative overflow-hidden flex items-center justify-center">
        <AnimatedBackground />
        <div className="w-16 h-16 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen py-12 relative overflow-hidden flex flex-col items-center justify-center">
        <AnimatedBackground />
        <div className="card-soft p-8 text-center max-w-md relative z-10">
          <Building2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
            {error || "The company profile you are trying to view doesn't exist or is currently unavailable."}
          </p>
          <button
            onClick={handleBack}
            className="btn-soft bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-6 py-2.5"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      <AnimatedBackground />

      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <button
          onClick={handleBack}
          className="mb-8 inline-flex items-center text-sm font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white dark:bg-neutral-900 px-5 py-2.5 rounded-full shadow-soft border border-neutral-100 dark:border-neutral-800"
        >
          <ArrowLeft size={16} className="mr-2" />
          Go Back
        </button>

        {/* Hero Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="card-soft p-6 md:p-8 lg:p-10 mb-8 bg-gradient-to-br from-white via-white/80 to-accent-50/10 dark:from-neutral-900 dark:via-neutral-900/80 dark:to-accent-950/5 backdrop-blur-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/5 dark:bg-accent-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-warm-500/5 dark:bg-warm-500/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[24px] bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center text-accent-600 dark:text-accent-400 font-extrabold text-3xl sm:text-4xl shadow-inner-soft shrink-0 border border-neutral-100 dark:border-neutral-800/50 overflow-hidden">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.companyName} className="w-full h-full object-cover" />
              ) : (
                profile.companyName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Profile details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-950/40 px-3 py-1 rounded-full border border-accent-100/50 dark:border-accent-900/20">
                  <Building2 size={12} /> Company Profile
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-3 py-1 rounded-full border border-blue-100/50 dark:border-blue-900/20">
                  <BadgeCheck size={12} /> Verified
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black text-neutral-900 dark:text-white tracking-tight mb-3 truncate">
                {profile.companyName}
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {profile.industry && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-100 dark:border-neutral-700">
                    <Tag size={12} className="text-neutral-400" /> {profile.industry}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-600 hover:text-accent-600 dark:text-neutral-300 dark:hover:text-accent-400 bg-neutral-50 dark:bg-neutral-800 px-3 py-1.5 rounded-xl border border-neutral-100 dark:border-neutral-700 transition-colors"
                  >
                    <Globe size={12} className="text-neutral-400" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* About Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="card-soft p-6 md:p-8 lg:p-10"
        >
          <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-6 border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-accent-500 rounded-full" />
            About the Company
          </h2>

          <div className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
            {profile.aboutCompany || "No detailed description provided by the company."}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
