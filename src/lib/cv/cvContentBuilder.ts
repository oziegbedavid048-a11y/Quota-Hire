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
        duties: 'Architected and implemented scalable web applications serving over 1M monthly active users.\nCollaborated with cross-functional teams to define, design, and ship new features.\nMentored junior developers and established comprehensive code quality standards.\nOptimized backend database queries, reducing response times by 30%.\nLed sprint planning and retrospectives within an Agile team of 8 engineers.'
      },
      {
        role: `Junior ${headline}`,
        company: 'Digital Systems Inc.',
        period: '2018 - 2021',
        duties: 'Developed responsive user interfaces using modern web frameworks.\nParticipated in daily stand-ups and sprint planning sessions.\nWrote comprehensive unit and integration tests to ensure code reliability.\nReducing bug backlog by 35% through systematic code reviews.'
      }
    ];
  } else if (t.includes('sales') || t.includes('account') || t.includes('revenue') || t.includes('customer')) {
    achievement = 'Consistently exceeded quarterly sales quotas by 120%, generating over $2.5M in new Annual Recurring Revenue (ARR) within the first year and winning the "Top Performer" award three consecutive quarters.';
    extraSkills = 'B2B Sales, CRM (Salesforce/HubSpot), Negotiation, Lead Generation, Client Relationship Management, Cold Calling, Territory Management';
    workEntries = [
      {
        role: headline,
        company: 'Enterprise Solutions Corp',
        period: '2020 - Present',
        duties: 'Managed the full sales cycle from initial prospecting to successful closing for enterprise-level clients.\nDeveloped strategic account plans to expand market share and penetrate new territories.\nConducted high-impact product demonstrations and presentations to C-level executives.\nNegotiated complex contracts resulting in long-term partnerships worth $3M+.\nMaintained CRM records meticulously, achieving 100% data accuracy for pipeline reporting.\nCollaborated with marketing to align campaigns with sales outreach strategies.\nTrained and mentored 3 junior sales associates, improving team performance by 25%.'
      },
      {
        role: 'Account Executive',
        company: 'Growth Dynamics',
        period: '2017 - 2020',
        duties: 'Maintained a robust pipeline of qualified leads through targeted outreach and referrals.\nExceeded monthly revenue targets consistently for 24 consecutive months.\nCollaborated with marketing to refine lead generation strategies and improve conversion rates.\nBuilt and maintained strong relationships with over 50 key accounts.\nAchieved a 95% customer satisfaction score through attentive and personalised service.'
      }
    ];
  } else if (t.includes('market') || t.includes('growth') || t.includes('brand')) {
    achievement = 'Spearheaded a multi-channel digital marketing campaign that increased inbound leads by 350%, lowered CPA by 25%, and boosted overall brand engagement by 40% year-over-year, contributing to $5M in additional revenue.';
    extraSkills = 'SEO/SEM, Content Strategy, Google Analytics, Social Media Management, Growth Hacking, Email Marketing, A/B Testing';
    workEntries = [
      {
        role: headline,
        company: 'Global Brands Agency',
        period: '2019 - Present',
        duties: 'Designed and executed comprehensive data-driven marketing strategies across all digital channels.\nAnalysed campaign performance data to continuously optimise ROI and reduce ad spend waste.\nManaged a cross-functional team of content creators, designers, and digital specialists.\nLaunched successful product marketing initiatives that drove record monthly sales figures.\nDeveloped and maintained brand guidelines ensuring consistent messaging across all touchpoints.\nOversee an annual marketing budget of £500K with full P&L accountability.'
      },
      {
        role: 'Marketing Specialist',
        company: 'Creative Media Ltd',
        period: '2016 - 2019',
        duties: 'Managed social media profiles and grew follower base by 200% organically within 18 months.\nCreated engaging blog posts and newsletters that improved customer retention by 30%.\nConducted market research to identify new consumer trends and competitive positioning opportunities.\nCoordinated product launches and events attended by 500+ industry professionals.'
      }
    ];
  } else if (t.includes('manager') || t.includes('director') || t.includes('lead') || t.includes('head')) {
    achievement = 'Successfully led a department of 25+ professionals, reducing operational costs by 20% while increasing overall productivity by 35% and improving employee retention by implementing Agile methodologies and a structured development programme.';
    extraSkills = 'Strategic Planning, Team Leadership, Budget Management, Process Optimisation, Change Management, Stakeholder Engagement';
    workEntries = [
      {
        role: headline,
        company: 'Corporate Enterprises',
        period: '2018 - Present',
        duties: 'Directed daily operations and strategic initiatives across multiple business units with full P&L responsibility.\nDeveloped, negotiated, and managed annual departmental budgets exceeding $5M.\nImplemented continuous improvement processes that reduced operational costs by 20%.\nFostered a culture of accountability and professional growth among 25+ team members.\nPresented quarterly performance reviews and strategic roadmaps to C-suite executives.\nLed major organisational transformation projects, delivering all key milestones on time and under budget.'
      },
      {
        role: 'Operations Manager',
        company: 'Apex Logistics',
        period: '2014 - 2018',
        duties: 'Streamlined supply chain workflows to reduce delivery delays by 15% within the first 6 months.\nHired, onboarded, and trained a diverse team of 12 operational staff.\nEnsured full compliance with industry regulations and health and safety standards.\nNegotiated supplier contracts saving the company £200K annually.'
      }
    ];
  } else {
    achievement = 'Consistently delivered high-quality results ahead of schedule, driving significant improvements in operational efficiency and stakeholder satisfaction. Recognised for exceptional problem-solving abilities and received the Employee of the Quarter award twice.';
    extraSkills = 'Project Management, Cross-functional Communication, Problem Solving, Adaptability, Client Relations, Data Analysis';
    workEntries = [
      {
        role: headline,
        company: 'Professional Services Inc.',
        period: '2020 - Present',
        duties: 'Managed complex projects from initiation to successful and timely completion within scope and budget.\nCollaborated with internal and external stakeholders to consistently meet and exceed organisational goals.\nIdentified process bottlenecks and implemented effective, sustainable solutions that improved efficiency by 25%.\nMaintained a high standard of quality assurance across all deliverables, achieving zero compliance breaches.\nProduced detailed progress reports and presented findings to senior leadership on a monthly basis.'
      },
      {
        role: 'Associate Consultant',
        company: 'Business Dynamics',
        period: '2017 - 2020',
        duties: 'Assisted in the development of strategic recommendations for 15+ key clients across diverse industries.\nConducted thorough data analysis to support business case presentations and board-level decisions.\nOrganised and facilitated client workshops and training sessions attended by 100+ participants.\nBuilt strong client relationships resulting in 90% contract renewal rate.'
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

  // Process work entries
  const experience: WorkEntry[] = wizard.workEntries
    .filter((e) => e.role.trim() || e.company.trim())
    .map((e) => ({ ...e }));

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
    // ── Extended fields ──────────────────────────────────────────────
    certifications: buildCertifications(wizard.headline || job.title),
    languages: buildLanguages(profile),
    interests: buildInterests(wizard.headline || job.title),
    strengths: buildStrengths(wizard.headline || job.title),
    references: 'Available upon request',
  };

  return { cvData, coverLetterData };
}
