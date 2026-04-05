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
  // Guided image tool fields
  tool_mode: string;
  selected_model_id: string | null;
  default_prompt_en: string;
  default_prompt_ar: string;
  cta_label_en: string;
  cta_label_ar: string;
  upload_label_en: string;
  upload_label_ar: string;
  upload_helper_en: string;
  upload_helper_ar: string;
  requires_upload: boolean;
  auto_run: boolean;
  prompt_hidden: boolean;
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
  toolMode: string;
  selectedModelId: string | null;
  defaultPromptEn: string;
  defaultPromptAr: string;
  ctaLabel: string;
  uploadLabel: string;
  uploadHelper: string;
  requiresUpload: boolean;
  autoRun: boolean;
  promptHidden: boolean;
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

  const mapToolView = (t: ToolRecord): ToolView => ({
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
    toolMode: t.tool_mode || 'standard',
    selectedModelId: t.selected_model_id,
    defaultPromptEn: t.default_prompt_en || '',
    defaultPromptAr: t.default_prompt_ar || '',
    ctaLabel: isAr && t.cta_label_ar ? t.cta_label_ar : t.cta_label_en,
    uploadLabel: isAr && t.upload_label_ar ? t.upload_label_ar : t.upload_label_en,
    uploadHelper: isAr && t.upload_helper_ar ? t.upload_helper_ar : t.upload_helper_en,
    requiresUpload: t.requires_upload ?? false,
    autoRun: t.auto_run ?? false,
    promptHidden: t.prompt_hidden ?? false,
  });

  const tools: ToolView[] = rawTools.filter(t => t.active).map(mapToolView);
  const allTools = rawTools.map(mapToolView);

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
