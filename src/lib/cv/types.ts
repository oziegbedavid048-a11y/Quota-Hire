// ── CV Engine Types ────────────────────────────────────────────────────────────

export type TemplateId = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export interface WorkEntry {
  role: string;
  company: string;
  period: string;
  duties: string; // raw text the user types — we'll convert to bullets
}

export interface CVData {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  profileImageUrl?: string;
  headline: string;
  summary: string;
  experience: WorkEntry[];
  skills: string[];
  education: string;
  achievement: string;
  targetRole: string;
  companyName: string;
  templateId: TemplateId;
  templateName: string;
}

export interface CoverLetterData {
  name: string;
  email: string;
  phone: string;
  location: string;
  date: string;
  companyName: string;
  jobTitle: string;
  paragraph1: string;
  paragraph2: string;
  paragraph3: string;
  paragraph4: string;
}
