/**
 * Field-scoped CV suggestions.
 *
 * These are completions offered beside the field the user is currently typing
 * in, matched to the target role they entered. They are a curated vocabulary,
 * not generated text, so nothing here invents an employer, a date, or an
 * achievement: the lists hold skills, competencies, certifications and
 * phrasing that a person picks because it is already true of them.
 *
 * Adding a role family means adding one entry to ROLE_FAMILIES with the
 * keywords that identify it, plus its vocabulary in VOCAB below.
 */

export type SuggestFieldKind =
  | 'headline'
  | 'skills'
  | 'strengths'
  | 'certifications'
  | 'languages'
  | 'education'
  | 'summary'
  | 'duties'
  | 'digitalSkills'
  | 'competencies'
  | 'hobbies';

export type RoleFamily =
  | 'sales'
  | 'engineering'
  | 'product'
  | 'marketing'
  | 'finance'
  | 'hr'
  | 'design'
  | 'support'
  | 'operations'
  | 'general';

/** Keywords that identify a family, matched against the target role text. */
const ROLE_FAMILIES: Array<{ family: RoleFamily; keywords: string[] }> = [
  { family: 'sales', keywords: ['sales', 'account executive', 'sdr', 'bdr', 'business development', 'account manager', 'quota', 'revenue', 'commercial', 'partnerships'] },
  { family: 'engineering', keywords: ['engineer', 'developer', 'software', 'backend', 'frontend', 'full stack', 'fullstack', 'devops', 'data', 'programmer', 'architect', 'qa', 'tester'] },
  { family: 'product', keywords: ['product', 'project manager', 'programme', 'program manager', 'scrum', 'delivery', 'business analyst'] },
  { family: 'marketing', keywords: ['marketing', 'brand', 'content', 'seo', 'social media', 'growth', 'communications', 'copywriter'] },
  { family: 'finance', keywords: ['finance', 'account', 'audit', 'tax', 'bookkeep', 'treasur', 'financial', 'controller'] },
  { family: 'hr', keywords: ['hr', 'human resource', 'recruit', 'talent', 'people operations'] },
  { family: 'design', keywords: ['design', 'ux', 'ui', 'graphic', 'creative', 'illustrat', 'motion'] },
  { family: 'support', keywords: ['support', 'customer success', 'customer service', 'help desk', 'service desk', 'client relations'] },
  { family: 'operations', keywords: ['operations', 'logistics', 'supply chain', 'procurement', 'warehouse', 'admin', 'office manager', 'coordinator'] },
];

/** Decide which vocabulary applies to whatever the user typed as their role. */
export function detectRoleFamily(role: string | undefined | null): RoleFamily {
  const text = (role || '').toLowerCase().trim();
  if (!text) return 'general';
  for (const { family, keywords } of ROLE_FAMILIES) {
    if (keywords.some((k) => text.includes(k))) return family;
  }
  return 'general';
}

type Vocab = Partial<Record<SuggestFieldKind, string[]>>;

/** Offered for every role, after the role-specific entries. */
const COMMON: Vocab = {
  languages: [
    'English (Native)', 'English (Fluent)', 'English (Professional)',
    'French (Conversational)', 'Spanish (Conversational)', 'Arabic (Conversational)',
    'Portuguese (Basic)', 'German (Basic)', 'Yoruba (Native)', 'Igbo (Native)',
    'Hausa (Native)', 'Swahili (Conversational)', 'Mandarin (Basic)',
  ],
  education: [
    'B.Sc.', 'B.A.', 'B.Eng.', 'HND', 'OND', 'M.Sc.', 'MBA', 'Ph.D.',
    'Diploma', 'Professional Certificate',
  ],
  hobbies: [
    'Reading', 'Volunteering', 'Football', 'Running', 'Photography', 'Chess',
    'Public speaking', 'Mentoring', 'Travel', 'Cooking', 'Music',
  ],
  strengths: [
    'Communication', 'Problem solving', 'Teamwork', 'Adaptability',
    'Time management', 'Attention to detail', 'Leadership', 'Critical thinking',
    'Collaboration', 'Initiative',
  ],
  competencies: [
    'Clear written and verbal communication',
    'Comfortable presenting to senior stakeholders',
    'Works well across teams and time zones',
    'Plans and prioritises independently',
    'Coaches and mentors junior colleagues',
  ],
  digitalSkills: [
    'Microsoft Office', 'Google Workspace', 'Excel', 'PowerPoint', 'Slack',
    'Zoom', 'Notion', 'Trello', 'Asana', 'Canva',
  ],
};

const VOCAB: Record<RoleFamily, Vocab> = {
  sales: {
    headline: ['Account Executive', 'Senior Account Executive', 'Sales Development Representative', 'Business Development Manager', 'Account Manager', 'Regional Sales Manager', 'Enterprise Account Executive', 'Inside Sales Representative'],
    skills: ['Salesforce', 'HubSpot', 'Pipedrive', 'Outreach', 'Salesloft', 'Gong', 'ZoomInfo', 'Apollo', 'LinkedIn Sales Navigator', 'Cold calling', 'Prospecting', 'Lead generation', 'Pipeline management', 'Negotiation', 'Account management', 'Forecasting', 'Upselling', 'Territory management', 'CRM management'],
    strengths: ['Quota attainment', 'Relationship building', 'Objection handling', 'Consultative selling', 'Resilience', 'Negotiation', 'Commercial awareness', 'Closing'],
    certifications: ['MEDDIC', 'SPIN Selling', 'Challenger Sale', 'Sandler Training', 'Salesforce Certified Administrator', 'HubSpot Sales Software Certification'],
    summary: ['Sales professional with a track record of consistently meeting quota.', 'Experienced in building pipeline from first outreach through to close.', 'Focused on long-term client relationships and repeat revenue.'],
    duties: ['Built and managed a pipeline of qualified opportunities.', 'Ran discovery calls and product demonstrations for prospective clients.', 'Negotiated commercial terms through to signature.', 'Maintained accurate CRM records and weekly forecasts.', 'Grew existing accounts through upsell and cross-sell.'],
  },
  engineering: {
    headline: ['Software Engineer', 'Senior Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Developer', 'DevOps Engineer', 'Data Engineer', 'QA Engineer'],
    skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'Git', 'REST APIs', 'CI/CD', 'Automated testing', 'Linux'],
    strengths: ['Problem solving', 'Code review', 'System design', 'Debugging', 'Technical documentation', 'Pair programming'],
    certifications: ['AWS Certified Solutions Architect', 'AWS Certified Developer', 'Google Cloud Associate Engineer', 'Certified Kubernetes Administrator', 'Microsoft Azure Fundamentals'],
    summary: ['Software engineer focused on maintainable, well-tested code.', 'Comfortable across the stack and used to shipping in small teams.', 'Interested in reliability and developer experience.'],
    duties: ['Designed and shipped features across the stack.', 'Wrote automated tests and took part in code review.', 'Investigated and resolved production issues.', 'Worked with product and design to scope requirements.'],
    digitalSkills: ['Git', 'Docker', 'VS Code', 'Jira', 'Postman', 'Figma'],
  },
  product: {
    headline: ['Product Manager', 'Senior Product Manager', 'Project Manager', 'Programme Manager', 'Business Analyst', 'Delivery Manager', 'Scrum Master'],
    skills: ['Roadmapping', 'Stakeholder management', 'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'User research', 'Requirements gathering', 'Backlog grooming', 'Risk management'],
    strengths: ['Prioritisation', 'Stakeholder communication', 'Analytical thinking', 'Facilitation', 'Decision making'],
    certifications: ['PMP', 'PRINCE2', 'Certified Scrum Master', 'PSM I', 'Agile Practitioner'],
    summary: ['Product manager who works closely with engineering and design.', 'Experienced in taking work from discovery through to delivery.', 'Comfortable balancing competing stakeholder priorities.'],
    duties: ['Defined and maintained the product roadmap.', 'Ran discovery with users and turned findings into requirements.', 'Facilitated ceremonies and kept delivery on track.', 'Reported progress and risks to stakeholders.'],
  },
  marketing: {
    headline: ['Marketing Executive', 'Marketing Manager', 'Content Marketing Manager', 'Digital Marketing Specialist', 'Growth Marketer', 'Brand Manager', 'Social Media Manager'],
    skills: ['SEO', 'Google Analytics', 'Google Ads', 'Meta Ads', 'Email marketing', 'Content strategy', 'Copywriting', 'Mailchimp', 'HubSpot', 'Canva', 'Social media management', 'Campaign management'],
    strengths: ['Creativity', 'Data-driven decision making', 'Storytelling', 'Brand awareness', 'Campaign planning'],
    certifications: ['Google Analytics Certification', 'Google Ads Certification', 'HubSpot Content Marketing', 'Meta Blueprint'],
    summary: ['Marketer comfortable across content, campaigns and analytics.', 'Focused on measurable growth rather than vanity metrics.'],
    duties: ['Planned and ran multi-channel campaigns.', 'Produced content for web, email and social.', 'Tracked performance and reported on results.'],
  },
  finance: {
    headline: ['Accountant', 'Financial Analyst', 'Finance Manager', 'Audit Associate', 'Bookkeeper', 'Management Accountant'],
    skills: ['Excel', 'QuickBooks', 'Sage', 'SAP', 'Xero', 'Financial reporting', 'Reconciliation', 'Budgeting', 'Forecasting', 'Accounts payable', 'Accounts receivable', 'Tax preparation', 'Variance analysis'],
    strengths: ['Accuracy', 'Analytical thinking', 'Attention to detail', 'Integrity', 'Deadline management'],
    certifications: ['ACCA', 'ICAN', 'CPA', 'CIMA', 'CFA Level I'],
    summary: ['Finance professional with a focus on accuracy and clear reporting.', 'Experienced in month-end close and management reporting.'],
    duties: ['Prepared monthly management accounts and reconciliations.', 'Supported budgeting and forecasting cycles.', 'Liaised with auditors and resolved queries.'],
  },
  hr: {
    headline: ['HR Officer', 'HR Manager', 'Talent Acquisition Specialist', 'Recruiter', 'People Operations Manager', 'HR Business Partner'],
    skills: ['Recruitment', 'Onboarding', 'Employee relations', 'HRIS', 'Payroll', 'Performance management', 'Policy development', 'Interviewing', 'Workday', 'BambooHR'],
    strengths: ['Discretion', 'Empathy', 'Conflict resolution', 'Coaching', 'Stakeholder management'],
    certifications: ['CIPD Level 3', 'CIPD Level 5', 'SHRM-CP', 'CIPM'],
    summary: ['HR professional supporting managers across the employee lifecycle.', 'Experienced in recruitment and employee relations.'],
    duties: ['Managed end-to-end recruitment for multiple roles.', 'Advised managers on policy and employee relations matters.', 'Ran onboarding and induction for new starters.'],
  },
  design: {
    headline: ['Product Designer', 'UX Designer', 'UI Designer', 'Graphic Designer', 'Visual Designer', 'UX Researcher'],
    skills: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Sketch', 'Prototyping', 'Wireframing', 'User research', 'Design systems', 'Accessibility', 'Typography'],
    strengths: ['Visual craft', 'User empathy', 'Attention to detail', 'Giving and taking critique', 'Systems thinking'],
    certifications: ['Google UX Design Certificate', 'Nielsen Norman UX Certification', 'Adobe Certified Professional'],
    summary: ['Designer who works from research through to polished interface.', 'Comfortable contributing to and maintaining a design system.'],
    duties: ['Produced wireframes, prototypes and final designs.', 'Ran usability sessions and fed the findings back into the work.', 'Maintained and extended the design system.'],
    digitalSkills: ['Figma', 'Adobe Creative Suite', 'Miro', 'Notion'],
  },
  support: {
    headline: ['Customer Support Specialist', 'Customer Success Manager', 'Client Relations Officer', 'Technical Support Engineer', 'Service Desk Analyst'],
    skills: ['Zendesk', 'Intercom', 'Freshdesk', 'Jira Service Management', 'Ticket triage', 'Troubleshooting', 'Onboarding', 'Account retention', 'SLA management', 'Live chat support'],
    strengths: ['Patience', 'Clear communication', 'Empathy', 'De-escalation', 'Product knowledge'],
    certifications: ['ITIL Foundation', 'HubSpot Service Hub', 'Zendesk Support Administrator'],
    summary: ['Support professional focused on resolving issues first time.', 'Experienced in retaining accounts through proactive contact.'],
    duties: ['Resolved customer queries across chat, email and phone.', 'Escalated and tracked issues through to resolution.', 'Onboarded new customers and ran check-in calls.'],
  },
  operations: {
    headline: ['Operations Officer', 'Operations Manager', 'Logistics Coordinator', 'Supply Chain Analyst', 'Office Manager', 'Administrative Officer'],
    skills: ['Inventory management', 'Procurement', 'Vendor management', 'Scheduling', 'Process improvement', 'Excel', 'ERP systems', 'Logistics coordination', 'Reporting'],
    strengths: ['Organisation', 'Prioritisation', 'Problem solving', 'Reliability', 'Process discipline'],
    certifications: ['Lean Six Sigma Yellow Belt', 'Lean Six Sigma Green Belt', 'CIPS Level 4'],
    summary: ['Operations professional focused on smooth, repeatable processes.', 'Experienced in coordinating suppliers and internal teams.'],
    duties: ['Coordinated day-to-day operations and supplier relationships.', 'Identified and implemented process improvements.', 'Produced regular operational reports.'],
  },
  general: {
    headline: ['Administrative Assistant', 'Operations Assistant', 'Customer Service Representative', 'Graduate Trainee', 'Intern'],
    skills: ['Microsoft Office', 'Excel', 'Data entry', 'Scheduling', 'Record keeping', 'Customer service', 'Report writing', 'Research'],
    summary: ['Motivated professional looking to contribute and keep learning.', 'Reliable and comfortable working independently or in a team.'],
    duties: ['Supported the team with day-to-day tasks.', 'Kept records accurate and up to date.', 'Communicated with colleagues and external contacts.'],
  },
};

/** Fields whose value is a comma-separated list rather than free prose. */
export const LIST_FIELDS: SuggestFieldKind[] = [
  'skills', 'strengths', 'certifications', 'languages', 'digitalSkills', 'hobbies',
];

/**
 * Suggestions for one field, for one role, filtered by what has been typed.
 *
 * `typed` is the fragment the user is currently working on. For a
 * comma-separated field that is the text after the last comma, so entries
 * already in the list are never re-suggested and never overwritten.
 */
export function getSuggestions(
  field: SuggestFieldKind,
  role: string | undefined | null,
  typed: string,
  alreadyChosen: string[] = [],
  limit = 6,
): string[] {
  const family = detectRoleFamily(role);
  const pool = [
    ...(VOCAB[family][field] ?? []),
    ...(family !== 'general' ? VOCAB.general[field] ?? [] : []),
    ...(COMMON[field] ?? []),
  ];

  const seen = new Set(alreadyChosen.map((c) => c.trim().toLowerCase()).filter(Boolean));
  const fragment = typed.trim().toLowerCase();

  const unique: string[] = [];
  for (const item of pool) {
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }

  if (!fragment) return unique.slice(0, limit);

  // Prefix matches first: they are what someone half-way through a word wants.
  const starts = unique.filter((i) => i.toLowerCase().startsWith(fragment));
  const contains = unique.filter(
    (i) => !i.toLowerCase().startsWith(fragment) && i.toLowerCase().includes(fragment),
  );
  return [...starts, ...contains].slice(0, limit);
}

/**
 * Split the current value into the committed entries and the fragment still
 * being typed. For prose fields the whole value is the fragment.
 */
export function splitListValue(
  value: string,
  isList: boolean,
): { chosen: string[]; fragment: string } {
  if (!isList) return { chosen: [], fragment: value };
  const parts = value.split(',');
  const fragment = parts[parts.length - 1] ?? '';
  const chosen = parts.slice(0, -1).map((p) => p.trim()).filter(Boolean);
  return { chosen, fragment };
}

/** Apply a chosen suggestion to a field value, respecting list semantics. */
export function applySuggestion(
  value: string,
  suggestion: string,
  isList: boolean,
): string {
  if (!isList) return suggestion;
  const parts = value.split(',');
  parts[parts.length - 1] = ` ${suggestion}`;
  const joined = parts.join(',').replace(/^\s*,\s*/, '').trim();
  // Leave a trailing separator so the next entry can be typed straight away.
  return `${joined}, `;
}
