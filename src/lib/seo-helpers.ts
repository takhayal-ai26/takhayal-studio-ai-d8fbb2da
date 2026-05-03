const UUID_PREFIX_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function slugifySegment(value: string) {
  const normalized = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  return normalized || 'item';
}

export function buildTemplatePath(id: string, title: string) {
  return `/templates/${id}-${slugifySegment(title)}`;
}

export function extractTemplateId(templateKey?: string | null) {
  if (!templateKey) return null;
  return String(templateKey).match(UUID_PREFIX_RE)?.[0] ?? null;
}

export function toDateOnly(value?: string | null) {
  if (!value) return undefined;
  return value.split('T')[0];
}
