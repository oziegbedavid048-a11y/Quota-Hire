import { CVData, CoverLetterData, WorkEntry, TemplateId } from './types';
import { EmployeeProfile, Job } from '../../types';

// ── Action verbs to prefix bullet points ──────────────────────────────────────
const ACTION_VERBS = [
  'Achieved', 'Delivered', 'Led', 'Managed', 'Built', 'Developed',
  'Drove', 'Exceeded', 'Generated', 'Increased', 'Implemented',
  'Executed', 'Coordinated', 'Established', 'Streamlined',
];

function randomVerb(index: number): string {
  return ACTION_VERBS[index % ACTION_VERBS.length];
}

// ── Convert raw duties text → 3–5 bullet strings ─────────────────────────────
export function dutiesToBullets(duties: string): string[] {
  if (!duties.trim()) return [];
  // Split on newlines or periods followed by space/capital
  const raw = duties
    .split(/\n|(?<=\.)\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
  return raw.slice(0, 5).map((s, i) => {
    // If it already starts with a capital verb, keep it; else prefix one
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
  return 'professional services';
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
      ? `${headline} with ${years}+ years of experience in ${domain}.`
      : `${headline} with a strong background in ${domain}.`;

  return `${experiencePhrase} ${skillPhrase} Eager to bring proven expertise to ${companyName} and contribute to exceptional outcomes.`;
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
    : `Throughout my career, I have developed strong expertise in ${domain}${topSkills ? `, particularly in ${topSkills}` : ''}. I thrive in fast-paced environments and am committed to delivering high-quality results.`;

  const p3 = achievement
    ? `One achievement I am particularly proud of: ${achievement} I am confident in bringing this same level of commitment and performance to ${companyName}.`
    : `I am committed to continuous improvement and professional excellence. I believe in building strong relationships and delivering consistent value to every stakeholder I work with.`;

  const p4 = `I would welcome the opportunity to discuss how my background aligns with the goals of ${companyName}. Thank you for your time and consideration. I look forward to the possibility of contributing to your team.`;

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

// ── AI Suggestion Generator (Frontend mock based on domain) ───────────────
export function generateAIAssistedSuggestions(headline: string, profile: EmployeeProfile): Partial<WizardAnswers> {
  const t = headline.toLowerCase();
  let achievement = '';
  let extraSkills = '';
  let workEntries: WorkEntry[] = [];

  if (t.includes('software') || t.includes('developer') || t.includes('engineer') || t.includes('tech')) {
    achievement = 'Led the refactoring of a legacy monolithic application into scalable microservices, improving system performance by 40%, reducing deployment time by 50%, and driving a 15% increase in user retention.';
    extraSkills = 'React, Node.js, TypeScript, Cloud Architecture, CI/CD, Agile/Scrum, System Design';
    workEntries = [
      {
        role: headline,
        company: 'Innovative Tech Solutions',
        period: '2021 - Present',
        duties: 'Architected and implemented scalable web applications serving over 1M monthly active users.\nCollaborated with cross-functional teams to define, design, and ship new features.\nMentored junior developers and established comprehensive code quality standards.\nOptimized backend database queries, reducing response times by 30%.'
      },
      {
        role: `Junior ${headline}`,
        company: 'Digital Systems Inc.',
        period: '2018 - 2021',
        duties: 'Developed responsive user interfaces using modern web frameworks.\nParticipated in daily stand-ups and sprint planning sessions.\nWrote comprehensive unit and integration tests to ensure code reliability.'
      }
    ];
  } else if (t.includes('sales') || t.includes('account') || t.includes('revenue')) {
    achievement = 'Consistently exceeded quarterly sales quotas by 120%, generating over $2.5M in new Annual Recurring Revenue (ARR) within the first year and winning the "Top Performer" award.';
    extraSkills = 'B2B Sales, CRM (Salesforce/HubSpot), Negotiation, Lead Generation, Client Relationship Management';
    workEntries = [
      {
        role: headline,
        company: 'Enterprise Solutions Corp',
        period: '2020 - Present',
        duties: 'Managed the full sales cycle from initial prospecting to successful closing for enterprise-level clients.\nDeveloped strategic account plans to expand market share and penetrate new territories.\nConducted high-impact product demonstrations and presentations to C-level executives.\nNegotiated complex contracts resulting in long-term partnerships.'
      },
      {
        role: 'Account Executive',
        company: 'Growth Dynamics',
        period: '2017 - 2020',
        duties: 'Maintained a robust pipeline of qualified leads through targeted outreach.\nExceeded monthly revenue targets consistently for 24 consecutive months.\nCollaborated with marketing to refine lead generation strategies.'
      }
    ];
  } else if (t.includes('market') || t.includes('growth') || t.includes('brand')) {
    achievement = 'Spearheaded a multi-channel digital marketing campaign that increased inbound leads by 350%, lowered CPA by 25%, and boosted overall brand engagement by 40% year-over-year.';
    extraSkills = 'SEO/SEM, Content Strategy, Google Analytics, Social Media Management, Growth Hacking, Email Marketing';
    workEntries = [
      {
        role: headline,
        company: 'Global Brands Agency',
        period: '2019 - Present',
        duties: 'Designed and executed comprehensive data-driven marketing strategies.\nAnalyzed campaign performance data to continuously optimize ROI and spend.\nManaged a cross-functional team of content creators, designers, and digital specialists.\nLaunched successful product marketing initiatives that drove record sales.'
      },
      {
        role: 'Marketing Specialist',
        company: 'Creative Media Ltd',
        period: '2016 - 2019',
        duties: 'Managed social media profiles and grew follower base by 200% organically.\nCreated engaging blog posts and newsletters that improved customer retention.\nConducted market research to identify new consumer trends.'
      }
    ];
  } else if (t.includes('manager') || t.includes('director') || t.includes('lead') || t.includes('head')) {
    achievement = 'Successfully led a department of 25+ professionals, reducing operational costs by 20% while increasing overall productivity and employee retention by implementing agile methodologies.';
    extraSkills = 'Strategic Planning, Team Leadership, Budget Management, Process Optimization, Change Management';
    workEntries = [
      {
        role: headline,
        company: 'Corporate Enterprises',
        period: '2018 - Present',
        duties: 'Directed daily operations and strategic initiatives across multiple business units.\nDeveloped, negotiated, and managed annual departmental budgets exceeding $5M.\nImplemented continuous improvement processes across the organization.\nFostered a culture of accountability and professional growth among team members.'
      },
      {
        role: 'Operations Manager',
        company: 'Apex Logistics',
        period: '2014 - 2018',
        duties: 'Streamlined supply chain workflows to reduce delivery delays by 15%.\nHired and trained a diverse team of operational staff.\nEnsured full compliance with industry regulations and health standards.'
      }
    ];
  } else {
    achievement = 'Consistently delivered high-quality results ahead of schedule, driving significant improvements in operational efficiency and stakeholder satisfaction. Recognized for exceptional problem-solving abilities.';
    extraSkills = 'Project Management, Cross-functional Communication, Problem Solving, Adaptability, Client Relations';
    workEntries = [
      {
        role: headline,
        company: 'Professional Services Inc.',
        period: '2020 - Present',
        duties: 'Managed complex projects from initiation to successful and timely completion.\nCollaborated with internal and external stakeholders to meet organizational goals.\nIdentified process bottlenecks and implemented effective, sustainable solutions.\nMaintained a high standard of quality assurance across all deliverables.'
      },
      {
        role: 'Associate Consultant',
        company: 'Business Dynamics',
        period: '2017 - 2020',
        duties: 'Assisted in the development of strategic recommendations for key clients.\nConducted thorough data analysis to support business case presentations.\nOrganized and facilitated client workshops and training sessions.'
      }
    ];
  }

  return { achievement, extraSkills, workEntries };
}

// ── Main export: build all CV data ───────────────────────────────────────────

export interface WizardAnswers {
  headline: string;
  achievement: string;
  extraSkills: string;
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

  // Process work entries: convert raw duties to bullet arrays
  const experience: WorkEntry[] = wizard.workEntries
    .filter((e) => e.role.trim() || e.company.trim())
    .map((e) => ({
      ...e,
      // dutiesToBullets is exported so templates can call it directly
    }));

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
    skills: allSkills.slice(0, 12),
    education: profile.education || '',
    achievement: wizard.achievement,
    targetRole: job.title,
    companyName: job.companyName || '',
    templateId,
    templateName,
  };

  return { cvData, coverLetterData };
}
