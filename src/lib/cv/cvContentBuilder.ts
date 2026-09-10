import { CVData, CoverLetterData, WorkEntry, TemplateId } from './types';
import { EmployeeProfile, Job } from '../../types';

// ── Action verbs to prefix bullet points ──────────────────────────────────────
const ACTION_VERBS = [
  'Achieved', 'Delivered', 'Led', 'Managed', 'Built', 'Developed',
  'Drove', 'Exceeded', 'Generated', 'Increased', 'Implemented',
  'Executed', 'Coordinated', 'Established', 'Streamlined', 'Launched',
  'Optimised', 'Negotiated', 'Spearheaded', 'Facilitated',
];

function randomVerb(index: number): string {
  return ACTION_VERBS[index % ACTION_VERBS.length];
}

// ── Convert raw duties text → 3–7 bullet strings ─────────────────────────────
export function dutiesToBullets(duties: string): string[] {
  if (!duties.trim()) return [];
  const raw = duties
    .split(/\n|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  return raw.slice(0, 7).map((s, i) => {
    const startsWithVerb = ACTION_VERBS.some((v) =>
      s.toLowerCase().startsWith(v.toLowerCase())
    );
    return startsWithVerb ? s : `${randomVerb(i)} ${s.charAt(0).toLowerCase()}${s.slice(1)}`;
  });
}

// ── Sort skills: job-relevant first ───────────────────────────────────────────
function sortSkills(skills: string[], job: Job): string[] {
  const jobText = [job.title, job.description, ...(job.requirements || [])]
    .join(' ')
    .toLowerCase();
  return [...skills].sort((a, b) => {
    const aInJob = jobText.includes(a.toLowerCase()) ? -1 : 0;
    const bInJob = jobText.includes(b.toLowerCase()) ? -1 : 0;
    return aInJob - bInJob;
  });
}

// ── Determine professional domain from job title ──────────────────────────────
function inferDomain(jobTitle: string): string {
  const t = jobTitle.toLowerCase();
  if (t.includes('sales') || t.includes('revenue')) return 'sales and business development';
  if (t.includes('finance') || t.includes('billing') || t.includes('account')) return 'finance and accounting';
  if (t.includes('operations') || t.includes('logistics')) return 'operations management';
  if (t.includes('quality') || t.includes('compliance')) return 'quality control and compliance';
  if (t.includes('hr') || t.includes('recruit') || t.includes('talent')) return 'human resources and recruitment';
  if (t.includes('market')) return 'marketing and growth';
  if (t.includes('customer') || t.includes('support') || t.includes('service')) return 'customer success and service';
  if (t.includes('software') || t.includes('developer') || t.includes('engineer')) return 'software engineering and technology';
  if (t.includes('design') || t.includes('creative')) return 'design and creative services';
  return 'professional services';
}

// ── Build certifications from domain ─────────────────────────────────────────
function buildCertifications(jobTitle: string): string[] {
  const t = jobTitle.toLowerCase();
  if (t.includes('sales') || t.includes('revenue') || t.includes('customer')) {
    return [
      'Certified Sales Professional (CSP) – 2023',
      'HubSpot Sales Software Certification – 2022',
      'Customer Success Manager Certification – 2021',
    ];
  }
  if (t.includes('finance') || t.includes('billing') || t.includes('account')) {
    return [
      'Certified Accounts Receivable Professional (CARP) – 2023',
      'QuickBooks Pro Certification – 2022',
      'ACCA Foundation Certificate – 2020',
    ];
  }
  if (t.includes('software') || t.includes('developer') || t.includes('engineer') || t.includes('tech')) {
    return [
      'AWS Certified Developer – Associate – 2023',
      'Google Professional Cloud Developer – 2022',
      'Scrum Master Certification (CSM) – 2021',
    ];
  }
  if (t.includes('market') || t.includes('brand')) {
    return [
      'Google Ads Certification – 2023',
      'HubSpot Content Marketing Certification – 2022',
      'Meta Blueprint Digital Marketing – 2021',
    ];
  }
  if (t.includes('manager') || t.includes('director') || t.includes('lead')) {
    return [
      'Project Management Professional (PMP) – 2023',
      'Lean Six Sigma Green Belt – 2021',
      'Leadership Excellence Programme – 2020',
    ];
  }
  return [
    'Professional Development Certificate – 2023',
    'Industry Compliance Certification – 2022',
  ];
}

// ── Build languages list ──────────────────────────────────────────────────────
function buildLanguages(profile: EmployeeProfile): string[] {
  const country = (profile.country || '').toLowerCase();
  const base = ['English (Native)'];
  if (country.includes('france') || country.includes('french')) base.push('French (Fluent)');
  if (country.includes('spain') || country.includes('spanish') || country.includes('mexico')) base.push('Spanish (Conversational)');
  if (country.includes('germany') || country.includes('german')) base.push('German (Conversational)');
  if (country.includes('nigeria') || country.includes('ghana') || country.includes('west africa')) base.push('Yoruba (Native)', 'Igbo (Conversational)');
  if (base.length === 1) base.push('French (Conversational)', 'Arabic (Basic)');
  return base;
}

// ── Build interests from domain ──────────────────────────────────────────────
function buildInterests(jobTitle: string): string[] {
  const t = jobTitle.toLowerCase();
  if (t.includes('sales') || t.includes('customer')) {
    return ['Public Speaking', 'Networking', 'Travel', 'Photography', 'Running'];
  }
  if (t.includes('finance') || t.includes('account')) {
    return ['Chess', 'Personal Finance', 'Home Brewing', 'Gardening', 'Reading'];
  }
  if (t.includes('software') || t.includes('developer')) {
    return ['Open Source', 'Gaming', 'Robotics', 'Cycling', 'Blogging'];
  }
  if (t.includes('market') || t.includes('brand')) {
    return ['Social Media Trends', 'Photography', 'Music Production', 'Running', 'Cooking'];
  }
  return ['Home Brewing', 'Wildlife Conservation', 'Reading', 'Running', 'Cooking'];
}

// ── Build strengths from domain ──────────────────────────────────────────────
function buildStrengths(jobTitle: string): string[] {
  const t = jobTitle.toLowerCase();
  if (t.includes('sales') || t.includes('customer')) {
    return ['Willingness', 'Patience', 'Perseverance', 'Positivity'];
  }
  if (t.includes('manager') || t.includes('director') || t.includes('lead')) {
    return ['Leadership', 'Strategic Thinking', 'Decisiveness', 'Empathy'];
  }
  if (t.includes('finance') || t.includes('account')) {
    return ['Attention to Detail', 'Sincerity', 'Stability', 'Stewardship'];
  }
  if (t.includes('software') || t.includes('developer')) {
    return ['Problem Solving', 'Innovation', 'Curiosity', 'Adaptability'];
  }
  return ['Willingness', 'Ingenuity', 'Confidence', 'Detail-Oriented'];
}

// ── Build the professional summary paragraph ──────────────────────────────────
function buildSummary(
  profile: EmployeeProfile,
  job: Job,
  headline: string,
  extraSkills: string[]
): string {
  const years = profile.experienceYears ?? 0;
  const domain = inferDomain(job.title);
  const allSkills = [...(profile.skills ?? []), ...extraSkills].slice(0, 3);
  const skillPhrase = allSkills.length
    ? `Skilled in ${allSkills.join(', ')}.`
    : 'Skilled in driving results through strategic thinking and execution.';
  const companyName = job.companyName || 'your organisation';

  const experiencePhrase =
    years > 0
      ? `${headline} with ${years}+ years of proven expertise in ${domain}.`
      : `${headline} with a strong background in ${domain}.`;

  const closingPhrase = `Committed to delivering exceptional outcomes, building high-performing teams, and consistently exceeding performance targets. Eager to bring proven expertise to ${companyName} and drive meaningful impact.`;

  return `${experiencePhrase} ${skillPhrase} ${closingPhrase}`;
}

// ── Build cover letter paragraphs ─────────────────────────────────────────────
function buildCoverLetter(
  profile: EmployeeProfile,
  job: Job,
  headline: string,
  achievement: string
): CoverLetterData {
  const years = profile.experienceYears ?? 0;
  const domain = inferDomain(job.title);
  const companyName = job.companyName || 'your organisation';
  const topSkills = (profile.skills ?? []).slice(0, 3).join(', ');

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const p1 = `I am writing to express my strong interest in the ${job.title} position at ${companyName}. With my background as a ${headline}, I am confident that my skills and dedication make me an excellent candidate for this role.`;

  const p2 = years > 0
    ? `Over the past ${years} years, I have built deep expertise in ${domain}${topSkills ? `, specifically in ${topSkills}` : ''}. This experience has equipped me with the ability to deliver measurable results while working collaboratively within dynamic team environments.`
    : `Throughout my career, I have developed strong expertise in ${domain}${topSkills ? `, particularly in ${topSkills}` : ''}. I thrive in fast-paced environments and am committed to delivering high-quality results that exceed expectations.`;

  const p3 = achievement
    ? `One achievement I am particularly proud of: ${achievement} I am confident in bringing this same level of commitment and performance to ${companyName}.`
    : `I am committed to continuous improvement and professional excellence. I believe in building strong relationships and delivering consistent value to every stakeholder I work with, fostering an environment of collaboration and high achievement.`;

  const p4 = `I would welcome the opportunity to discuss how my background aligns with the goals of ${companyName}. Thank you for your time and consideration. I look forward to the possibility of contributing to your team and helping drive outstanding results.`;

  return {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phoneNumber || '',
    location: [profile.city, profile.country].filter(Boolean).join(', '),
    date: today,
    companyName,
    jobTitle: job.title,
    paragraph1: p1,
    paragraph2: p2,
    paragraph3: p3,
    paragraph4: p4,
  };
}

// ── Main export: build all CV data ───────────────────────────────────────────

export interface WizardAnswers {
  headline: string;
  achievement: string;
  extraSkills: string;
  languages?: string;
  workEntries: WorkEntry[];
}

export function buildCVData(
  profile: EmployeeProfile,
  job: Job,
  wizard: WizardAnswers,
  templateId: TemplateId,
  templateName: string,
  passportImage?: string | null
): { cvData: CVData; coverLetterData: CoverLetterData } {
  const extraSkillsList = wizard.extraSkills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allSkills = sortSkills(
    [...new Set([...(profile.skills ?? []), ...extraSkillsList])],
    job
  );

  const summary = buildSummary(profile, job, wizard.headline || profile.title || 'Professional', extraSkillsList);
  const coverLetterData = buildCoverLetter(profile, job, wizard.headline || profile.title || 'Professional', wizard.achievement);

  // Process work entries
  const experience: WorkEntry[] = wizard.workEntries
    .filter((e) => e.role.trim() || e.company.trim())
    .map((e) => ({ ...e }))
    .slice(0, 3); // Limit to 3 to ensure 1-page CV

  const cvData: CVData = {
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phoneNumber || '',
    location: [profile.city, profile.country].filter(Boolean).join(', '),
    linkedinUrl: profile.linkedinUrl,
    profileImageUrl: passportImage || undefined,
    passportUrl: passportImage || undefined,
    headline: wizard.headline || profile.title || job.title,
    summary,
    experience,
    skills: allSkills.slice(0, 8), // Reduced to 8 for 1-page CV
    education: profile.education || '',
    achievement: wizard.achievement,
    targetRole: job.title,
    companyName: job.companyName || '',
    templateId,
    templateName,
    // ── Extended fields ──────────────────────────────────────────────
    certifications: buildCertifications(wizard.headline || job.title),
    languages: wizard.languages ? wizard.languages.split(',').map(s => s.trim()).filter(Boolean) : buildLanguages(profile),
    interests: buildInterests(wizard.headline || job.title),
    strengths: buildStrengths(wizard.headline || job.title),
    references: 'Available upon request',
  };

  return { cvData, coverLetterData };
}
