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
      <div className="min-h-screen py-12 relative overflow-hidden flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <AnimatedBackground />
        <div className="w-12 h-12 border-2 border-accent-200 border-t-accent-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen py-12 relative overflow-hidden flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <AnimatedBackground />
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 text-center max-w-md relative z-10 shadow-sm">
          <Building2 className="w-10 h-10 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Profile Not Found</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-6">
            {error || "The company profile you are trying to view doesn't exist or is currently unavailable."}
          </p>
          <button
            onClick={handleBack}
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 py-2.5 rounded-xl text-xs font-bold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 relative overflow-hidden bg-neutral-50 dark:bg-neutral-950">
      <AnimatedBackground />

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <button
          onClick={handleBack}
          className="mb-6 inline-flex items-center text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Go Back
        </button>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
        >
          {/* Header Layout */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left border-b border-neutral-100 dark:border-neutral-800 pb-6">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500 font-extrabold text-2xl border border-neutral-200 dark:border-neutral-700/50 overflow-hidden shrink-0">
              {profile.logoUrl ? (
                <img src={profile.logoUrl} alt={profile.companyName} className="w-full h-full object-cover" />
              ) : (
                profile.companyName.charAt(0).toUpperCase()
              )}
            </div>

            {/* Profile details */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                  Hiring Company
                </span>
                <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider text-blue-500 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100/50 dark:border-blue-900/20">
                  <BadgeCheck size={10} className="mr-0.5" /> Verified
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight truncate">
                {profile.companyName}
              </h1>

              {/* Tags */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {profile.industry && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-850 px-2.5 py-1 rounded-lg border border-neutral-200/50 dark:border-neutral-800">
                    <Building2 size={11} className="text-neutral-400" /> {profile.industry}
                  </span>
                )}
                {profile.website && (
                  <a
                    href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-accent-600 dark:text-neutral-400 dark:hover:text-accent-400 bg-neutral-50 dark:bg-neutral-850 px-2.5 py-1 rounded-lg border border-neutral-200/50 dark:border-neutral-800 transition-colors"
                  >
                    <Globe size={11} className="text-neutral-400" /> {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* About Section - Rendered only if aboutCompany has content */}
          {profile.aboutCompany && profile.aboutCompany.trim().length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                About the Company
              </h2>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                {profile.aboutCompany}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
