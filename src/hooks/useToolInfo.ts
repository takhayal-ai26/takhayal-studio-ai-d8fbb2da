/**
 * Utility for detecting and resolving tool-generated gallery items.
 * tool_id format: "tool:slug" (e.g. "tool:upscale", "tool:remove-bg")
 */

export interface ToolInfo {
  slug: string;
  route: string;
  nameEn: string;
  nameAr: string;
  actionEn: string;
  actionAr: string;
}

const TOOL_MAP: Record<string, ToolInfo> = {
  upscale: {
    slug: 'upscale',
    route: '/tools/upscale',
    nameEn: 'Upscale',
    nameAr: 'تكبير الصورة',
    actionEn: 'Processed with Upscale',
    actionAr: 'تمت المعالجة بأداة التكبير',
  },
  'remove-bg': {
    slug: 'remove-bg',
    route: '/tools/remove-bg',
    nameEn: 'Remove Background',
    nameAr: 'إزالة الخلفية',
    actionEn: 'Processed with Remove Background',
    actionAr: 'تمت المعالجة بأداة إزالة الخلفية',
  },
  enhance: {
    slug: 'enhance',
    route: '/tools/enhance',
    nameEn: 'Enhance',
    nameAr: 'تحسين الصورة',
    actionEn: 'Processed with Enhance',
    actionAr: 'تمت المعالجة بأداة التحسين',
  },
  logo: {
    slug: 'logo',
    route: '/tools/logo',
    nameEn: 'Logo',
    nameAr: 'تصميم شعار',
    actionEn: 'Generated with Logo Tool',
    actionAr: 'تم الإنشاء بأداة الشعار',
  },
  generate: {
    slug: 'generate',
    route: '/tools/generate',
    nameEn: 'Generate',
    nameAr: 'توليد',
    actionEn: 'Generated with AI',
    actionAr: 'تم التوليد بالذكاء الاصطناعي',
  },
};

export function isToolJob(toolId: string | null): boolean {
  if (!toolId) return false;
  // tool:upscale, tool:remove-bg, etc. But NOT "generate" tools or template:xxx
  return toolId.startsWith('tool:') && getToolSlug(toolId) !== 'generate';
}

function getToolSlug(toolId: string): string {
  return toolId.replace('tool:', '');
}

export function getToolInfo(toolId: string | null): ToolInfo | null {
  if (!toolId || !toolId.startsWith('tool:')) return null;
  const slug = getToolSlug(toolId);
  return TOOL_MAP[slug] || null;
}

export function getToolName(toolId: string | null, isAr: boolean): string {
  const info = getToolInfo(toolId);
  if (!info) return '';
  return isAr ? info.nameAr : info.nameEn;
}

export function getToolAction(toolId: string | null, isAr: boolean): string {
  const info = getToolInfo(toolId);
  if (!info) return '';
  return isAr ? info.actionAr : info.actionEn;
}

export function getToolRoute(toolId: string | null): string | null {
  const info = getToolInfo(toolId);
  return info?.route || null;
}
