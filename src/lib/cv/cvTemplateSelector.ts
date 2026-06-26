import { TemplateId } from './types';
import { Job } from '../../types';

// ── Keyword map: template → keywords that match it ────────────────────────────

const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  T3:  ['retail', 'store', 'shop', 'merchandise', 'consumer', 'product sales', 'personal sales', 'upselling', 'cross-selling', 'brand ambassador', 'promoter'],
  T7:  ['associate', 'sales associate', 'customer sales', 'consumer sales', 'product specialist', 'brand specialist'],
  T9:  ['specialist', 'consultant', 'analyst', 'procurement', 'hr', 'human resources', 'recruiter', 'talent', 'project', 'programme', 'administrator', 'officer', 'coordinator'],
  T10: ['operations', 'quality', 'control', 'logistics', 'coordinator', 'rep', 'field', 'technician', 'inspector', 'compliance', 'warehouse', 'supply chain', 'production', 'manufacturing'],
  T11: ['finance', 'billing', 'accounting', 'receivable', 'payable', 'payroll', 'bookkeeping', 'financial', 'auditor', 'accountant', 'budget', 'tax', 'reconciliation', 'invoice'],
  T12: ['legal', 'lawyer', 'paralegal', 'attorney', 'counsel', 'contract', 'compliance officer'],
  T13: ['software', 'developer', 'engineer', 'programmer', 'tech', 'it', 'data', 'analytics', 'systems'],
  T14: ['academic', 'professor', 'teacher', 'research', 'education', 'tutor', 'lecturer', 'instructor'],
  P1:  ['retail', 'sales'],
  P2:  ['specialist', 'hr'],
  P3:  ['associate', 'field'],
  P4:  ['finance', 'auditor'],
  P5:  ['legal', 'attorney'],
  P6:  ['engineer', 'tech'],
  P7:  ['academic', 'education'],
  P8:  ['manager', 'executive'],
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
    T3:  'Crimson Banner',
    T7:  'Dark Green Pro',
    T9:  'Indigo Sidebar',
    T10: 'Executive Panel',
    T11: 'Burgundy Side',
    T12: 'Forest Green Photo',
    T13: 'Golden Yellow',
    T14: 'Steel Blue Banner',
    P1:  'Traditional Formal',
    P2:  'Corporate Clean',
    P3:  'Minimalist Classic',
    P4:  'Modern Plain',
    P5:  'Elegant Text',
    P6:  'Executive Text',
    P7:  'Simple Clean',
    P8:  'Standard Professional',
  };

  let bestId: TemplateId = 'T7';
  let bestScore = -1;

  for (const [id, keywords] of Object.entries(TEMPLATE_KEYWORDS) as [TemplateId, string[]][]) {
    const score = scoreTemplate(keywords, jobText);
    if (score > bestScore) {
      bestScore = score;
      bestId = id as TemplateId;
    }
  }

  return { templateId: bestId, templateName: TEMPLATE_NAMES[bestId] };
}
