import { TemplateId } from './types';
import { Job } from '../../types';

// ── Keyword map: template → keywords that match it ────────────────────────────

const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  T1: [
    'sales', 'customer', 'representative', 'support', 'service',
    'retail', 'client', 'account', 'advisor', 'agent', 'inside sales',
    'outbound', 'inbound', 'cold calling', 'crm', 'quota',
  ],
  T2: [
    'manager', 'director', 'executive', 'business development',
    'vp', 'vice president', 'head of', 'senior', 'lead', 'managing',
    'enterprise', 'strategic', 'commercial', 'revenue', 'growth',
  ],
  T3: [
    'operations', 'quality', 'control', 'logistics', 'coordinator',
    'associate', 'rep', 'field', 'technician', 'inspector', 'compliance',
    'warehouse', 'supply chain', 'production', 'manufacturing',
  ],
  T4: [
    'finance', 'billing', 'accounting', 'receivable', 'payable',
    'payroll', 'bookkeeping', 'financial', 'ar ', 'ap ', 'auditor',
    'accountant', 'budget', 'tax', 'reconciliation', 'invoice',
  ],
  T5: [
    'specialist', 'consultant', 'analyst', 'procurement', 'hr',
    'human resources', 'recruiter', 'talent', 'project', 'programme',
    'administrator', 'officer', 'coordinator', 'researcher', 'planner',
  ],
};

// ── Score a single template against the job text ─────────────────────────────

function scoreTemplate(keywords: string[], jobText: string): number {
  let score = 0;
  for (const kw of keywords) {
    if (jobText.includes(kw)) score += 1;
  }
  return score;
}

// ── Public: pick the best template for a job ─────────────────────────────────

export function selectTemplate(job: Job): { templateId: TemplateId; templateName: string } {
  const jobText = [
    job.title,
    job.description,
    ...(job.requirements || []),
  ]
    .join(' ')
    .toLowerCase();

  const TEMPLATE_NAMES: Record<TemplateId, string> = {
    T1: 'Classic Split',
    T2: 'Executive Dark',
    T3: 'Vivid Sidebar',
    T4: 'Inverse Green',
    T5: 'Corporate Banner',
  };

  let bestId: TemplateId = 'T1';
  let bestScore = -1;

  for (const [id, keywords] of Object.entries(TEMPLATE_KEYWORDS) as [TemplateId, string[]][]) {
    const score = scoreTemplate(keywords, jobText);
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  return { templateId: bestId, templateName: TEMPLATE_NAMES[bestId] };
}
