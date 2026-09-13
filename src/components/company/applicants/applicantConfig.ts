/**
 * Shared definitions for reviewing applicants, carried over from
 * mobile/src/components/company-applicants.tsx so the website and the app
 * describe a candidate's progress in exactly the same words and colours.
 */

import { Eye, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';

export type ApplicationStatus =
  | 'pending'
  | 'under_review'
  | 'interview'
  | 'decision'
  | 'accepted'
  | 'rejected';

/** Status badge styling. Class names map to the app's Palette values. */
export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; pill: string; text: string; dot: string }> = {
  pending:      { label: 'Applied',          pill: 'bg-slate-100',  text: 'text-slate-700',   dot: 'bg-slate-400' },
  under_review: { label: 'Under Review',     pill: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  interview:    { label: 'Interview',        pill: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  decision:     { label: 'Decision Pending', pill: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500' },
  accepted:     { label: 'Accepted',         pill: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  rejected:     { label: 'Rejected',         pill: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
};

export const statusOf = (status?: string) =>
  STATUS_CONFIG[(status as ApplicationStatus) || 'pending'] || STATUS_CONFIG.pending;

/** The five evaluation steps a company can move a candidate to. */
export const EVALUATION_ACTIONS: Array<{
  status: Exclude<ApplicationStatus, 'pending'>;
  label: string;
  shortLabel: string;
  Icon: typeof Eye;
  color: string;
  activeBg: string;
  activeBorder: string;
}> = [
  { status: 'under_review', label: 'Mark as Under Review',     shortLabel: 'Under Review',     Icon: Eye,          color: '#d97706', activeBg: '#fef3c7', activeBorder: '#f59e0b' },
  { status: 'interview',    label: 'Mark for Interview',       shortLabel: 'Interview',        Icon: Calendar,     color: '#7c3aed', activeBg: '#f3e8ff', activeBorder: '#a855f7' },
  { status: 'decision',     label: 'Mark as Decision Pending', shortLabel: 'Decision Pending', Icon: Clock,        color: '#2563eb', activeBg: '#eff6ff', activeBorder: '#3b82f6' },
  { status: 'accepted',     label: 'Accept Application',       shortLabel: 'Accepted',         Icon: CheckCircle2, color: '#059669', activeBg: '#ecfdf5', activeBorder: '#10b981' },
  { status: 'rejected',     label: 'Reject Application',       shortLabel: 'Rejected',         Icon: XCircle,      color: '#dc2626', activeBg: '#fef2f2', activeBorder: '#ef4444' },
];

/**
 * Whether a role is on the Promoted plan. Only promoted roles give the company
 * a candidate's contact details, CV and the evaluation pipeline; on agency
 * packages Quotahire handles that contact. The server enforces the same rule
 * by masking the contact fields, so this only decides what to draw.
 */
export const isPromotedPackage = (pkg?: string | null) =>
  Boolean(pkg && String(pkg).toLowerCase().includes('promoted'));

/**
 * Strips contact details out of free text for non-promoted roles, so an
 * applicant cannot route around the agency package by writing their phone
 * number into their bio or cover letter.
 */
export const cleanText = (text?: string | null) => {
  if (!text) return text || '';
  let cleaned = text;
  cleaned = cleaned.replace(/^(Email|Address|Location|LinkedIn|Phone|Contact|Mobile|Website|Portfolio)[\s:]*.*$/gmi, '');
  cleaned = cleaned.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');
  cleaned = cleaned.replace(/(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi, '');
  cleaned = cleaned.replace(/(?:(?:\+?\d{1,3}[-.\s]?\(?\d{2,4}\)?)|(?:\(\d{2,4}\)))[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g, '');
  cleaned = cleaned.replace(/\b\d{1,5}\s+[a-zA-Z0-9\s.,-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Way|Plaza|Plz|Square|Sq|Close|Crescent|Estate)\b/gi, '');
  cleaned = cleaned.replace(/\b(?:P\.?O\.?\s*Box|Post\s*Office\s*Box)\s*\d+\b/gi, '');
  return cleaned.trim();
};

export const experienceYears = (c: any): number => {
  const raw = c?.experience_years ?? c?.experienceYears ?? c?.employee_profile?.experience_years ?? c?.employee_profile?.experienceYears;
  const n = Number(raw);
  return Number.isNaN(n) ? 0 : Math.max(0, n);
};

export const experienceText = (c: any): string => {
  const yrs = experienceYears(c);
  if (yrs <= 0) return 'No Experience Listed';
  if (yrs === 1) return '1 Year Experience';
  return `${yrs} Years Experience`;
};
