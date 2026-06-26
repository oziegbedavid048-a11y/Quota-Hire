import { TemplateId } from './types';
import { Job } from '../../types';

// ── Keyword map: template → keywords that match it ────────────────────────────

const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  T3:  ['retail', 'store', 'shop', 'merchandise', 'consumer', 'product sales', 'personal sales', 'upselling', 'cross-selling', 'brand ambassador', 'promoter'],
  T7:  ['associate', 'sales associate', 'customer sales', 'consumer sales', 'product specialist', 'brand specialist'],
  T14: ['academic', 'professor', 'teacher', 'research', 'education', 'tutor', 'lecturer', 'instructor'],
  P1:  ['retail', 'sales'],
  P2:  ['specialist', 'hr'],
  P3:  ['associate', 'field'],
  P4:  ['finance', 'auditor'],
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
    T14: 'Steel Blue Banner',
    P1:  'Traditional Formal',
    P2:  'Corporate Clean',
    P3:  'Minimalist Classic',
    P4:  'Modern Plain',
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
