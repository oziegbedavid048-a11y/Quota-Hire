// ── CV Engine Types ────────────────────────────────────────────────────────────

export type TemplateId =
  | 'T1' | 'T2' | 'T3' | 'T4' | 'T5'
  | 'T6' | 'T7' | 'T8' | 'T9' | 'T10'
  | 'T11' | 'T12' | 'T13' | 'T14' | 'T15'
  | 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7' | 'P8';

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
  passportUrl?: string;
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
  // ── Extended fields ───────────────────────────────────────────
  certifications?: string[];   // e.g. ["Certified Sales Professional, 2022"]
  languages?: string[];        // e.g. ["English (Native)", "French (Conversational)"]
  interests?: string[];        // e.g. ["Photography", "Running", "Home Brewing"]
  strengths?: string[];        // e.g. ["Willingness", "Patience", "Adaptability"]
  references?: string;         // "Available upon request"
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
