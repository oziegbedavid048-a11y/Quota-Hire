import { TemplateId } from './types';
import { Job } from '../../types';

// ── Keyword map: template → keywords that match it ────────────────────────────

const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  T1:  ['sales', 'customer', 'representative', 'support', 'service', 'retail', 'client', 'account', 'advisor', 'agent', 'inside sales', 'outbound', 'inbound', 'cold calling', 'crm', 'quota'],
  T2:  ['manager', 'director', 'executive', 'business development', 'vp', 'vice president', 'head of', 'senior', 'lead', 'managing', 'enterprise', 'strategic', 'commercial', 'revenue', 'growth'],
  T3:  ['retail', 'store', 'shop', 'merchandise', 'consumer', 'product sales', 'personal sales', 'upselling', 'cross-selling', 'brand ambassador', 'promoter'],
  T4:  ['district', 'regional', 'territory', 'area manager', 'multi-site', 'national', 'zone', 'field operations', 'regional director'],
  T5:  ['sales representative', 'junior sales', 'inside sales', 'telemarketing', 'appointment', 'cold call', 'leads', 'pipeline'],
  T6:  ['customer service', 'customer support', 'helpdesk', 'call center', 'client services', 'complaint resolution', 'customer relations'],
  T7:  ['associate', 'sales associate', 'customer sales', 'consumer sales', 'product specialist', 'brand specialist'],
  T8:  ['consumer marketing', 'field sales', 'marketing', 'brand', 'digital marketing', 'social media', 'content', 'media', 'creative', 'design'],
  T9:  ['specialist', 'consultant', 'analyst', 'procurement', 'hr', 'human resources', 'recruiter', 'talent', 'project', 'programme', 'administrator', 'officer', 'coordinator'],
  T10: ['operations', 'quality', 'control', 'logistics', 'coordinator', 'rep', 'field', 'technician', 'inspector', 'compliance', 'warehouse', 'supply chain', 'production', 'manufacturing'],
  T11: ['finance', 'billing', 'accounting', 'receivable', 'payable', 'payroll', 'bookkeeping', 'financial', 'auditor', 'accountant', 'budget', 'tax', 'reconciliation', 'invoice'],
  T12: ['legal', 'lawyer', 'paralegal', 'attorney', 'counsel', 'contract', 'compliance officer'],
  T13: ['software', 'developer', 'engineer', 'programmer', 'tech', 'it', 'data', 'analytics', 'systems'],
  T14: ['academic', 'professor', 'teacher', 'research', 'education', 'tutor', 'lecturer', 'instructor'],
  T15: ['brand', 'communications', 'pr', 'public relations', 'writer', 'editor', 'content creator', 'copywriter'],
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
    T1:  'Classic Split',
    T2:  'Executive Pro',
    T3:  'Crimson Banner',
    T4:  'Navy Achievement',
    T5:  'Sky Blue Sidebar',
    T6:  'Warm Minimal',
    T7:  'Dark Green Pro',
    T8:  'Gold Sidebar',
    T9:  'Indigo Sidebar',
    T10: 'Executive Panel',
    T11: 'Burgundy Side',
    T12: 'Forest Green Photo',
    T13: 'Golden Yellow',
    T14: 'Steel Blue Banner',
    T15: 'Charcoal Chevron',
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
