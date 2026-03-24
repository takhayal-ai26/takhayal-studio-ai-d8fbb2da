import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BilingualField {
  en: string;
  ar: string;
}

export interface AdminTemplate {
  id: string;
  title: BilingualField;
  shortDescription: BilingualField;
  fullPrompt: BilingualField;
  ctaLabel: BilingualField;
  category: string;
  tags: string[];
  toolId: string;
  toolType: string;
  thumbnail: string;
  previewImages: string[];
  recommendedModel: string;
  recommendedAspectRatio: string;
  creditCost: number;
  featured: boolean;
  seasonal: boolean;
  active: boolean;
  slug: string;
  sortOrder: number;
  notes: string;
  // Visibility
  featuredOnHome: boolean;
  visibleInCategory: boolean;
  visibleInToolPage: boolean;
  startDate: string;
  endDate: string;
  // Analytics (mock)
  analytics: {
    views: number;
    uses: number;
    useRate: string;
    lastUsed: string;
    revenue: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface AdminTemplatesState {
  templates: AdminTemplate[];
  addTemplate: (t: AdminTemplate) => void;
  updateTemplate: (id: string, updates: Partial<AdminTemplate>) => void;
  deleteTemplate: (id: string) => void;
  duplicateTemplate: (id: string) => void;
  toggleFeatured: (id: string) => void;
  toggleSeasonal: (id: string) => void;
  toggleActive: (id: string) => void;
}

const CATEGORIES = ['Ads', 'Seasonal', 'Fashion', 'Food', 'Product', 'Logo', 'Social', 'Lifestyle', 'Real Estate'];

const seed: AdminTemplate[] = [
  {
    id: '1', title: { en: 'Luxury Perfume Ad', ar: 'إعلان عطر فاخر' },
    shortDescription: { en: 'Dramatic studio perfume visual', ar: 'صورة عطر بإضاءة استوديو درامية' },
    fullPrompt: { en: 'Luxury perfume bottle, dramatic studio lighting, dark background, reflective surface, high-end product photography', ar: 'زجاجة عطر فاخرة، إضاءة استوديو درامية، خلفية داكنة، سطح عاكس، تصوير منتجات راقي' },
    ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Ads', tags: ['perfume', 'luxury', 'product'], toolId: 'generate', toolType: 'prompt',
    thumbnail: 'https://picsum.photos/seed/tpl1/400/400', previewImages: [],
    recommendedModel: 'SDXL', recommendedAspectRatio: '1:1', creditCost: 2,
    featured: true, seasonal: false, active: true, slug: 'luxury-perfume-ad', sortOrder: 1, notes: '',
    featuredOnHome: true, visibleInCategory: true, visibleInToolPage: true, startDate: '', endDate: '',
    analytics: { views: 2840, uses: 1420, useRate: '50%', lastUsed: '2026-03-24', revenue: '$2,840' },
    createdAt: '2026-01-15', updatedAt: '2026-03-20',
  },
  {
    id: '2', title: { en: 'Ramadan Lantern Scene', ar: 'مشهد فوانيس رمضان' },
    shortDescription: { en: 'Golden lanterns with warm glow', ar: 'فوانيس ذهبية بإضاءة دافئة' },
    fullPrompt: { en: 'Golden Ramadan lanterns, warm ambient glow, bokeh lights, spiritual atmosphere, festive decorations', ar: 'فوانيس رمضان ذهبية، إضاءة دافئة، أضواء بوكيه، أجواء روحانية، زينة احتفالية' },
    ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Seasonal', tags: ['ramadan', 'lantern', 'festive'], toolId: 'generate', toolType: 'prompt',
    thumbnail: 'https://picsum.photos/seed/tpl2/400/400', previewImages: [],
    recommendedModel: 'SDXL', recommendedAspectRatio: '9:16', creditCost: 2,
    featured: true, seasonal: true, active: true, slug: 'ramadan-lantern-scene', sortOrder: 2, notes: '',
    featuredOnHome: true, visibleInCategory: true, visibleInToolPage: false, startDate: '', endDate: '',
    analytics: { views: 4210, uses: 2680, useRate: '64%', lastUsed: '2026-03-24', revenue: '$5,360' },
    createdAt: '2026-02-01', updatedAt: '2026-03-22',
  },
  {
    id: '3', title: { en: 'Fashion Editorial', ar: 'تصوير أزياء تحريري' },
    shortDescription: { en: 'High-end fashion editorial look', ar: 'إطلالة أزياء تحريرية راقية' },
    fullPrompt: { en: 'High-end fashion editorial, soft diffused light, elegant pose, minimalist background, luxury feel', ar: 'تصوير أزياء راقي، إضاءة ناعمة، وضعية أنيقة، خلفية بسيطة، طابع فاخر' },
    ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Fashion', tags: ['fashion', 'editorial', 'elegant'], toolId: 'generate', toolType: 'prompt',
    thumbnail: 'https://picsum.photos/seed/tpl3/400/400', previewImages: [],
    recommendedModel: 'SDXL', recommendedAspectRatio: '4:5', creditCost: 2,
    featured: false, seasonal: false, active: true, slug: 'fashion-editorial', sortOrder: 3, notes: '',
    featuredOnHome: false, visibleInCategory: true, visibleInToolPage: true, startDate: '', endDate: '',
    analytics: { views: 1890, uses: 920, useRate: '49%', lastUsed: '2026-03-23', revenue: '$1,840' },
    createdAt: '2026-01-20', updatedAt: '2026-03-18',
  },
  {
    id: '4', title: { en: 'Modern Restaurant', ar: 'مطعم عصري' },
    shortDescription: { en: 'Appetizing food shot', ar: 'صورة طعام شهية' },
    fullPrompt: { en: 'Modern restaurant, appetizing food shot, warm colors, shallow depth of field, gourmet plating', ar: 'مطعم عصري، صورة طعام شهية، ألوان دافئة، عمق مجال ضيق، تقديم طعام ذواقي' },
    ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Food', tags: ['food', 'restaurant', 'gourmet'], toolId: 'generate', toolType: 'prompt',
    thumbnail: 'https://picsum.photos/seed/tpl4/400/400', previewImages: [],
    recommendedModel: 'SDXL', recommendedAspectRatio: '1:1', creditCost: 2,
    featured: false, seasonal: false, active: true, slug: 'modern-restaurant', sortOrder: 4, notes: '',
    featuredOnHome: false, visibleInCategory: true, visibleInToolPage: false, startDate: '', endDate: '',
    analytics: { views: 1560, uses: 780, useRate: '50%', lastUsed: '2026-03-22', revenue: '$1,560' },
    createdAt: '2026-01-25', updatedAt: '2026-03-15',
  },
  {
    id: '5', title: { en: 'Tech Product Float', ar: 'منتج تقني عائم' },
    shortDescription: { en: '3D floating product render', ar: 'عرض ثلاثي الأبعاد لمنتج عائم' },
    fullPrompt: { en: 'Tech product floating on gradient, 3D render, clean minimal background, soft shadows, premium feel', ar: 'منتج تقني عائم على تدرج لوني، عرض ثلاثي الأبعاد، خلفية نظيفة، ظلال ناعمة، طابع فاخر' },
    ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Product', tags: ['tech', 'product', '3d'], toolId: 'generate', toolType: 'prompt',
    thumbnail: 'https://picsum.photos/seed/tpl5/400/400', previewImages: [],
    recommendedModel: 'SDXL', recommendedAspectRatio: '1:1', creditCost: 2,
    featured: true, seasonal: false, active: true, slug: 'tech-product-float', sortOrder: 5, notes: '',
    featuredOnHome: true, visibleInCategory: true, visibleInToolPage: true, startDate: '', endDate: '',
    analytics: { views: 2100, uses: 1050, useRate: '50%', lastUsed: '2026-03-24', revenue: '$2,100' },
    createdAt: '2026-02-10', updatedAt: '2026-03-21',
  },
  {
    id: '6', title: { en: 'Arabic Calligraphy Logo', ar: 'شعار خط عربي' },
    shortDescription: { en: 'Modern Arabic calligraphy logo', ar: 'شعار خط عربي عصري' },
    fullPrompt: { en: 'Arabic calligraphy logo, modern twist, clean background, elegant strokes, brand identity', ar: 'شعار خط عربي، لمسة عصرية، خلفية نظيفة، خطوط أنيقة، هوية بصرية' },
    ctaLabel: { en: 'Use Template', ar: 'استخدم القالب' },
    category: 'Logo', tags: ['arabic', 'calligraphy', 'logo', 'branding'], toolId: 'logo', toolType: 'prompt',
    thumbnail: 'https://picsum.photos/seed/tpl6/400/400', previewImages: [],
    recommendedModel: 'SDXL', recommendedAspectRatio: '1:1', creditCost: 3,
    featured: false, seasonal: false, active: true, slug: 'arabic-calligraphy-logo', sortOrder: 6, notes: '',
    featuredOnHome: false, visibleInCategory: true, visibleInToolPage: true, startDate: '', endDate: '',
    analytics: { views: 3200, uses: 1800, useRate: '56%', lastUsed: '2026-03-24', revenue: '$5,400' },
    createdAt: '2026-02-15', updatedAt: '2026-03-23',
  },
];

export const useAdminTemplatesStore = create<AdminTemplatesState>()(
  persist(
    (set, get) => ({
      templates: seed,
      addTemplate: (t) => set((s) => ({ templates: [...s.templates, t] })),
      updateTemplate: (id, updates) =>
        set((s) => ({
          templates: s.templates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : t
          ),
        })),
      deleteTemplate: (id) => set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
      duplicateTemplate: (id) => {
        const original = get().templates.find((t) => t.id === id);
        if (!original) return;
        const dup: AdminTemplate = {
          ...original,
          id: crypto.randomUUID().slice(0, 8),
          title: { en: `${original.title.en} (Copy)`, ar: original.title.ar ? `${original.title.ar} (نسخة)` : '' },
          slug: `${original.slug}-copy`,
          featured: false,
          analytics: { views: 0, uses: 0, useRate: '0%', lastUsed: '', revenue: '$0' },
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        };
        set((s) => ({ templates: [...s.templates, dup] }));
      },
      toggleFeatured: (id) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, featured: !t.featured } : t)) })),
      toggleSeasonal: (id) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, seasonal: !t.seasonal } : t)) })),
      toggleActive: (id) =>
        set((s) => ({ templates: s.templates.map((t) => (t.id === id ? { ...t, active: !t.active } : t)) })),
    }),
    { name: 'takhayal-admin-templates' }
  )
);

export { CATEGORIES };
