/** Escape user-controlled strings before interpolating into WebView / Print HTML. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeForHtml(value: unknown): unknown {
  if (value == null) return value;
  if (typeof value === 'string') return escapeHtml(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(sanitizeForHtml);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      out[key] = sanitizeForHtml(nested);
    }
    return out;
  }
  return '';
}

export function safeHttpUrl(url: unknown): string {
  const raw = String(url ?? '').trim();
  if (/^https?:\/\//i.test(raw)) return escapeHtml(raw);
  return '';
}
