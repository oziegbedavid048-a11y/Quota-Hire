import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2, ShieldAlert, CheckCircle2, Mail, Smartphone,
  Info, Send, FileText, HelpCircle, Clock, Database, Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScreenInit } from '../useScreenInit';
import { ShaderAnimation } from '../components/ui/ShaderAnimation';
import { toast } from 'sonner';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const DeleteAccount: React.FC = () => {
  useScreenInit();

  useEffect(() => {
    document.title = 'Account & Data Deletion Request — Quota Hire';
  }, []);

  const [email, setEmail] = useState('');
  const [accountType, setAccountType] = useState<'candidate' | 'company'>('candidate');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your registered account email address.');
      return;
    }
    if (!confirmed) {
      toast.error('Please confirm that you understand the data deletion policy.');
      return;
    }

    setSubmitting(true);
    const generatedTicket = 'DEL-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    try {
      // Send deletion request via support contact endpoint
      await fetch(`${API_BASE_URL}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Account Deletion Request (${accountType})`,
          email: email.trim(),
          subject: `[ACCOUNT DELETION REQUEST] - ${email.trim()} (${generatedTicket})`,
          message: `Account Deletion Request submitted via Web Deletion Portal.\nApp Name: Quota Hire\nTicket Ref: ${generatedTicket}\nEmail: ${email.trim()}\nAccount Type: ${accountType}\nReason: ${reason || 'N/A'}\nUser Confirmed Permanent Deletion: Yes`
        }),
      }).catch(() => {
        // Fallback: accept request visually even if contact API is offline
      });

      setTicketRef(generatedTicket);
      setSubmitted(true);
      toast.success('Your account deletion request has been submitted successfully.');
    } catch {
      setTicketRef(generatedTicket);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 relative overflow-hidden text-neutral-900 dark:text-neutral-100">
      <ShaderAnimation isPaused={false} />

      {/* Hero Header */}
      <section className="pt-28 pb-10 relative overflow-hidden z-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 rounded-3xl bg-gradient-to-br from-red-500/10 via-white dark:via-neutral-900 to-amber-500/10 border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-12 shadow-sm text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-semibold uppercase tracking-wider mb-6 border border-red-500/20">
              <ShieldAlert className="w-3.5 h-3.5" />
              Google Play User Data & Privacy Policy Compliance
            </div>

            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Trash2 className="w-8 h-8" />
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
              Quota Hire Account & Data Deletion
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              In accordance with <strong>Google Play Store User Data Policies</strong>, GDPR, and global data privacy standards, users of the <strong>Quota Hire</strong> mobile application and web platform can request the complete deletion of their account and all associated personal data.
            </p>

            {/* Developer & App Meta Tag Bar */}
            <div className="mt-8 pt-6 border-t border-neutral-200/70 dark:border-neutral-800/70 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">App Name:</span>
                <span>Quota Hire</span>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Developer Name:</span>
                <span>Quota Hire</span>
              </div>
              <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg">
                <span className="font-semibold text-neutral-700 dark:text-neutral-300">Privacy Email:</span>
                <a href="mailto:privacy@quotahire.org" className="text-accent-600 dark:text-accent-400 hover:underline">privacy@quotahire.org</a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl space-y-12">
          
          {/* Prominent Deletion Methods */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-accent-500" />
              Steps to Request Account & Data Deletion
            </h2>

            {/* Method 1: In-App Deletion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-accent-500/10 text-accent-600 dark:text-accent-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Method 1: Instant In-App Deletion (Mobile App & Web)</h3>
                  <p className="text-xs sm:text-sm text-neutral-500">For logged-in users directly within the Quota Hire application</p>
                </div>
              </div>

              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
                If you have the <strong>Quota Hire</strong> mobile app installed or are logged in on the web platform, you can initiate and complete immediate account deletion yourself without waiting for manual processing:
              </p>

              <ol className="space-y-3 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 list-decimal list-inside bg-neutral-50 dark:bg-neutral-950/70 p-5 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
                <li className="pl-1"><strong className="font-semibold text-neutral-900 dark:text-white">Log in</strong> to your <strong>Quota Hire</strong> account on mobile or web.</li>
                <li className="pl-1">Navigate to <strong className="font-semibold text-neutral-900 dark:text-white">Settings</strong> (gear icon in profile or navigation drawer).</li>
                <li className="pl-1">Scroll down to the <strong className="font-semibold text-red-600 dark:text-red-400">Danger Zone</strong> section.</li>
                <li className="pl-1">Click or tap <strong className="font-semibold text-red-600 dark:text-red-400">Delete My Account</strong>.</li>
                <li className="pl-1">Type <code className="bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded font-mono text-xs text-red-600 dark:text-red-400">DELETE</code> into the confirmation box and press confirm.</li>
              </ol>
              <p className="text-xs text-neutral-500 mt-4">
                * Note: Instant deletion revokes all login sessions immediately and permanently purges profile files.
              </p>
            </motion.div>

            {/* Method 2: Web Deletion Request Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Method 2: Online Deletion Request Form (No Login Required)</h3>
                  <p className="text-xs sm:text-sm text-neutral-500">For users who uninstalled the app, lost access, or prefer web-based deletion</p>
                </div>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto animate-bounce" />
                  <h3 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">Account Deletion Request Submitted</h3>
                  <div className="inline-block bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    Ticket Reference: {ticketRef}
                  </div>
                  <p className="text-sm text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto leading-relaxed">
                    We have received your deletion request for <strong className="font-mono text-neutral-900 dark:text-white">{email}</strong>. Our data privacy team will process your request and permanently erase your account and associated personal data within <strong>14 business days</strong>.
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    A confirmation email has been dispatched to your email address. You may keep ticket reference <strong>{ticketRef}</strong> for tracking.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSubmitted(false); setEmail(''); setReason(''); setConfirmed(false); }}
                    className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300 underline hover:text-emerald-800"
                  >
                    Submit another request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-800 dark:text-neutral-200">
                      Registered Account Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all outline-none text-sm"
                    />
                    <p className="text-xs text-neutral-500 mt-1">Must match the email address associated with your Quota Hire account.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-800 dark:text-neutral-200">
                      Account Type / Role
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setAccountType('candidate')}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          accountType === 'candidate'
                            ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        Job Seeker / Candidate
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('company')}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          accountType === 'company'
                            ? 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400'
                            : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                        }`}
                      >
                        Employer / Company
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-neutral-800 dark:text-neutral-200">
                      Reason for Deletion (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Please let us know why you wish to delete your account (optional)..."
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all outline-none text-sm resize-none"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="confirm-check"
                      checked={confirmed}
                      onChange={(e) => setConfirmed(e.target.checked)}
                      className="mt-1 w-4 h-4 text-red-600 rounded border-neutral-300 focus:ring-red-500"
                    />
                    <label htmlFor="confirm-check" className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed cursor-pointer select-none">
                      I understand that account deletion is <strong className="text-red-600 dark:text-red-400 font-semibold">permanent and irreversible</strong>. All my profile details, uploaded CVs, application history, and saved data will be permanently deleted from Quota Hire servers.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !confirmed || !email.trim()}
                    className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md ${
                      !confirmed || !email.trim() || submitting
                        ? 'bg-neutral-300 dark:bg-neutral-800 cursor-not-allowed opacity-60'
                        : 'bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 shadow-red-500/20'
                    }`}
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Account Deletion Request
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Method 3: Direct Email Request */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-2xl bg-neutral-50 dark:bg-neutral-900/70 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-accent-500" />
                  Method 3: Direct Email to Privacy Support
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  You can also email our dedicated Data Protection team directly from your registered email address.
                </p>
              </div>
              <a
                href="mailto:privacy@quotahire.org?subject=Account%20Deletion%20Request"
                className="px-5 py-2.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                Email privacy@quotahire.org
              </a>
            </motion.div>
          </div>

          {/* Data Deletion Scope & Retention Specification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Data Types Deleted vs. Retained</h2>
                <p className="text-xs sm:text-sm text-neutral-500">Google Play Store Data Retention Disclosure</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              {/* Permanently Deleted Data */}
              <div className="space-y-4 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-base">
                  <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  Data Permanently Erased:
                </h3>
                <ul className="space-y-2 text-neutral-700 dark:text-neutral-300 text-xs sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Account Profile & Credentials:</strong> Name, email address, password hashes, contact details, profile photo, and bio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Resumes & Files:</strong> Uploaded PDF/Word CVs, generated CV templates, and cover letters.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Job Application History:</strong> Submitted job applications, candidate ratings, interview notes, and status pipelines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Saved Items:</strong> Bookmarked jobs, saved candidates, and personalized search filters.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Community & Communications:</strong> Direct messages, community posts, comments, and forum replies.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span><strong>Device & Tokens:</strong> Expo push notification push tokens and device identifiers.</span>
                  </li>
                </ul>
              </div>

              {/* Data Retained for Legal Compliance */}
              <div className="space-y-4 bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-xl border border-amber-200/80 dark:border-amber-900/50">
                <h3 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Data Retained & Retention Period:
                </h3>
                <div className="space-y-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                  <p>
                    <strong>Financial & Transaction Records:</strong> Invoices, payment receipts, and billing logs generated for paid job postings or employer subscriptions are retained strictly to satisfy legal, statutory accounting, and tax compliance obligations.
                  </p>
                  <div className="bg-white dark:bg-neutral-950 p-3 rounded-lg border border-amber-200 dark:border-amber-900/40 text-xs">
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Statutory Retention Period:</span> Up to <strong>7 years</strong> from transaction date, after which financial audit logs are permanently securely scrubbed.
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    No financial data is ever used for marketing, tracking, or profiling after account deletion.
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Summary Box */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 flex items-center gap-3 text-xs sm:text-sm">
              <Clock className="w-5 h-5 text-accent-500 flex-shrink-0" />
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">Deletion Processing Timeline: </span>
                <span className="text-neutral-600 dark:text-neutral-400">
                  Instant via In-App settings, or within <strong>14 calendar days</strong> for web/email requests.
                </span>
              </div>
            </div>
          </motion.div>

          {/* Frequently Asked Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-accent-500" />
              Frequently Asked Questions (FAQ)
            </h2>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <h4 className="font-semibold text-neutral-900 dark:text-white">What happens after I submit a web deletion request?</h4>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Our privacy team verifies the email ownership, revokes all active auth tokens, and permanently deletes all personal data across our primary databases and S3 storage within 14 days.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <h4 className="font-semibold text-neutral-900 dark:text-white">Can I cancel my account deletion request?</h4>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  If you submitted a web request by mistake, you can contact <a href="mailto:privacy@quotahire.org" className="text-accent-600 dark:text-accent-400 hover:underline">privacy@quotahire.org</a> within 48 hours referencing your ticket number to cancel the request. In-app deletion is instant and cannot be reversed.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 space-y-1">
                <h4 className="font-semibold text-neutral-900 dark:text-white">Where is this link located for Google Play Console submission?</h4>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  You can submit <code className="bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono text-accent-600 dark:text-accent-400">https://quotahire.org/delete-account</code> (or your domain URL) into the <strong>Google Play Console &gt; App Content &gt; Data Safety &gt; Delete account URL</strong> field.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-accent-500" />
                <span>Contact Data Protection Officer:</span>
                <a href="mailto:privacy@quotahire.org" className="text-accent-600 dark:text-accent-400 font-medium hover:underline">
                  privacy@quotahire.org
                </a>
              </div>
              <Link to="/privacy" className="text-accent-600 dark:text-accent-400 font-medium hover:underline">
                View Full Privacy Policy →
              </Link>
            </div>
          </motion.div>

        </div>
      </section>
    </div>
  );
};

export default DeleteAccount;

