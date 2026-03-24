import { useAdminTemplatesStore, AdminTemplate } from '@/stores/adminTemplatesStore';
import { useLanguage } from '@/i18n/LanguageContext';

export interface FrontendTemplate {
  name: string;
  prompt: string;
  image: string;
  description: string;
  tags: string[];
  category: string;
  featured: boolean;
  seasonal: boolean;
}

export function useTemplates() {
  const { templates: adminTemplates } = useAdminTemplatesStore();
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  const templates: FrontendTemplate[] = adminTemplates
    .filter(t => t.active)
    .map(t => ({
      name: isAr && t.title.ar ? t.title.ar : t.title.en,
      prompt: isAr && t.fullPrompt.ar ? t.fullPrompt.ar : t.fullPrompt.en,
      image: t.thumbnail || `https://picsum.photos/seed/tpl-${t.id}/600/400`,
      description: isAr && t.shortDescription.ar ? t.shortDescription.ar : t.shortDescription.en,
      tags: t.tags,
      category: t.category,
      featured: t.featured,
      seasonal: t.seasonal,
    }));

  const categories = ['All', ...Array.from(new Set(adminTemplates.filter(t => t.active).map(t => t.category)))];

  return { templates, categories };
}
