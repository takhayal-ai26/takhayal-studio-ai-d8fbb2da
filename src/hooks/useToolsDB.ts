import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/i18n/LanguageContext';
import { Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers, type LucideIcon } from 'lucide-react';

const iconLookup: Record<string, LucideIcon> = {
  Sparkles, ArrowUpCircle, Hexagon, Scissors, Wand2, Image, Palette, Layers,
};

export interface ToolRecord {
  id: string;
  slug: string;
  route: string;
  input_type: string;
  icon_name: string;
  active: boolean;
  featured: boolean;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  short_desc_en: string;
  short_desc_ar: string;
  hero_title_en: string;
  hero_title_ar: string;
  hero_subtitle_en: string;
  hero_subtitle_ar: string;
  cover_image_url: string;
  provider_name: string;
  provider_endpoint: string;
  default_credit_cost: number;
  internal_provider_cost_estimate: number;
  result_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ToolView {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDesc: string;
  heroTitle: string;
  heroSubtitle: string;
  image: string;
  route: string;
  icon: LucideIcon;
  inputType: 'prompt' | 'upload' | 'mixed';
  creditCost: number;
  providerEndpoint: string;
  providerName: string;
  internalCost: number;
  active: boolean;
  featured: boolean;
}

export function useToolsDB() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const queryClient = useQueryClient();

  const { data: rawTools = [], isLoading } = useQuery({
    queryKey: ['tools-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as ToolRecord[];
    },
  });

  const tools: ToolView[] = rawTools
    .filter(t => t.active)
    .map(t => ({
      id: t.id,
      slug: t.slug,
      name: isAr && t.title_ar ? t.title_ar : t.title_en,
      description: isAr && t.description_ar ? t.description_ar : t.description_en,
      shortDesc: isAr && t.short_desc_ar ? t.short_desc_ar : t.short_desc_en,
      heroTitle: isAr && t.hero_title_ar ? t.hero_title_ar : t.hero_title_en,
      heroSubtitle: isAr && t.hero_subtitle_ar ? t.hero_subtitle_ar : t.hero_subtitle_en,
      image: t.cover_image_url,
      route: t.route,
      icon: iconLookup[t.icon_name] || Sparkles,
      inputType: t.input_type as 'prompt' | 'upload' | 'mixed',
      creditCost: t.default_credit_cost,
      providerEndpoint: t.provider_endpoint,
      providerName: t.provider_name,
      internalCost: Number(t.internal_provider_cost_estimate),
      active: t.active,
      featured: t.featured,
    }));

  const allTools = rawTools.map(t => ({
    id: t.id,
    slug: t.slug,
    name: isAr && t.title_ar ? t.title_ar : t.title_en,
    description: isAr && t.description_ar ? t.description_ar : t.description_en,
    shortDesc: isAr && t.short_desc_ar ? t.short_desc_ar : t.short_desc_en,
    heroTitle: isAr && t.hero_title_ar ? t.hero_title_ar : t.hero_title_en,
    heroSubtitle: isAr && t.hero_subtitle_ar ? t.hero_subtitle_ar : t.hero_subtitle_en,
    image: t.cover_image_url,
    route: t.route,
    icon: iconLookup[t.icon_name] || Sparkles,
    inputType: t.input_type as 'prompt' | 'upload' | 'mixed',
    creditCost: t.default_credit_cost,
    providerEndpoint: t.provider_endpoint,
    providerName: t.provider_name,
    internalCost: Number(t.internal_provider_cost_estimate),
    active: t.active,
    featured: t.featured,
  }));

  const featuredTools = tools.filter(t => t.featured);

  const updateTool = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ToolRecord> }) => {
      const { error } = await supabase.from('tools').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools-db'] }),
  });

  const addTool = useMutation({
    mutationFn: async (tool: Partial<ToolRecord>) => {
      const { error } = await supabase.from('tools').insert(tool as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools-db'] }),
  });

  const deleteTool = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tools').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools-db'] }),
  });

  return { tools, allTools, featuredTools, rawTools, isLoading, updateTool, addTool, deleteTool, refetch: () => queryClient.invalidateQueries({ queryKey: ['tools-db'] }) };
}
