import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TOOLS } from '@/data/tools';

export interface BilingualField {
  en: string;
  ar: string;
}

export interface AdminTool {
  id: string;
  name: BilingualField;
  description: BilingualField;
  shortDesc: BilingualField;
  hero: {
    title: BilingualField;
    subtitle: BilingualField;
  };
  cta: {
    label: BilingualField;
  };
  creditCost: number;
  inputType: 'prompt' | 'upload' | 'mixed';
  active: boolean;
  featured: boolean;
  iconName: string;
  coverImage: string;
  route: string;
  // Future-ready
  provider?: string;
  apiEndpoint?: string;
  modelId?: string;
  // Analytics (mock)
  analytics: {
    visits: number;
    conversions: number;
    generations: number;
    revenue: string;
  };
}

interface AdminToolsState {
  tools: AdminTool[];
  addTool: (tool: AdminTool) => void;
  updateTool: (id: string, updates: Partial<AdminTool>) => void;
  deleteTool: (id: string) => void;
  toggleActive: (id: string) => void;
  toggleFeatured: (id: string) => void;
}

const iconMap: Record<string, string> = {
  generate: 'Sparkles',
  upscale: 'ArrowUpCircle',
  logo: 'Hexagon',
  'remove-bg': 'Scissors',
  enhance: 'Wand2',
};

const analyticsMap: Record<string, { visits: number; conversions: number; generations: number; revenue: string }> = {
  generate: { visits: 8420, conversions: 4812, generations: 4200, revenue: '$8,400' },
  upscale: { visits: 3210, conversions: 1890, generations: 1650, revenue: '$4,950' },
  logo: { visits: 2840, conversions: 1240, generations: 980, revenue: '$2,940' },
  'remove-bg': { visits: 5120, conversions: 3410, generations: 3100, revenue: '$3,100' },
  enhance: { visits: 2190, conversions: 1340, generations: 1180, revenue: '$2,360' },
};

const arNames: Record<string, string> = {
  generate: 'توليد صورة',
  upscale: 'تكبير الصورة',
  logo: 'إنشاء شعار',
  'remove-bg': 'إزالة الخلفية',
  enhance: 'تحسين الصورة',
};

const arDescs: Record<string, string> = {
  generate: 'أنشئ صورًا مذهلة من النصوص باستخدام نماذج ذكاء اصطناعي متقدمة',
  upscale: 'زد دقة صورتك حتى 4 أضعاف مع الحفاظ على كل التفاصيل',
  logo: 'صمم شعارات حديثة ونظيفة بالذكاء الاصطناعي في ثوانٍ',
  'remove-bg': 'أزل خلفية الصورة فورًا بنقرة واحدة',
  enhance: 'حسّن الجودة وزد الوضوح وأصلح الألوان تلقائيًا',
};

const arShort: Record<string, string> = {
  generate: 'أنشئ صورًا من النص',
  upscale: 'زد الدقة فورًا',
  logo: 'صمم شعارات حديثة',
  'remove-bg': 'أزل الخلفية بنقرة',
  enhance: 'حسّن الجودة والتفاصيل',
};

const initialTools: AdminTool[] = TOOLS.map(t => ({
  id: t.id,
  name: { en: t.name, ar: arNames[t.id] || '' },
  description: { en: t.description, ar: arDescs[t.id] || '' },
  shortDesc: { en: t.shortDesc, ar: arShort[t.id] || '' },
  hero: {
    title: { en: t.heroTagline, ar: '' },
    subtitle: { en: t.description, ar: arDescs[t.id] || '' },
  },
  cta: {
    label: { en: 'Generate', ar: 'إنشاء' },
  },
  creditCost: t.creditCost,
  inputType: t.inputType,
  active: true,
  featured: true,
  iconName: iconMap[t.id] || 'Sparkles',
  coverImage: t.image,
  route: t.route,
  analytics: analyticsMap[t.id] || { visits: 0, conversions: 0, generations: 0, revenue: '$0' },
}));

export const useAdminToolsStore = create<AdminToolsState>()(
  persist(
    (set) => ({
      tools: initialTools,
      addTool: (tool) => set((s) => ({ tools: [...s.tools, tool] })),
      updateTool: (id, updates) =>
        set((s) => ({
          tools: s.tools.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTool: (id) => set((s) => ({ tools: s.tools.filter((t) => t.id !== id) })),
      toggleActive: (id) =>
        set((s) => ({
          tools: s.tools.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
        })),
      toggleFeatured: (id) =>
        set((s) => ({
          tools: s.tools.map((t) => (t.id === id ? { ...t, featured: !t.featured } : t)),
        })),
    }),
    { name: 'takhayal-admin-tools' }
  )
);
