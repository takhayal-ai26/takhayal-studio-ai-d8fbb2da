import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SeoLandingPageConfig } from '@/data/seoLandingPages';

export interface ContentBlock {
  id: string;
  key: string;
  location: string;
  type: string;
  title_en: string;
  title_ar: string;
  body_en: string;
  body_ar: string;
  media_url: string;
  cta_label_en: string;
  cta_label_ar: string;
  cta_url: string;
  visible: boolean;
  status: 'draft' | 'active' | 'scheduled' | 'archived';
  start_at: string | null;
  end_at: string | null;
  sort_order: number;
  metadata_json: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export type ContentBlockInput = Omit<ContentBlock, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};

export interface SeoLandingPageRecord {
  id: string;
  slug: string;
  title: SeoLandingPageConfig['title'];
  description: SeoLandingPageConfig['description'];
  eyebrow: SeoLandingPageConfig['eyebrow'];
  h1: SeoLandingPageConfig['h1'];
  direct_answer: SeoLandingPageConfig['directAnswer'];
  table_headings: SeoLandingPageConfig['tableHeadings'];
  table_rows: SeoLandingPageConfig['tableRows'];
  use_cases: SeoLandingPageConfig['useCases'];
  limitations: SeoLandingPageConfig['limitations'];
  faqs: SeoLandingPageConfig['faqs'];
  active: boolean;
  date_modified: string;
  created_at?: string;
  updated_at?: string;
}

export function seoRecordToConfig(record: SeoLandingPageRecord): SeoLandingPageConfig {
  return {
    slug: record.slug as SeoLandingPageConfig['slug'],
    title: record.title,
    description: record.description,
    eyebrow: record.eyebrow,
    h1: record.h1,
    directAnswer: record.direct_answer,
    tableHeadings: record.table_headings,
    tableRows: record.table_rows,
    useCases: record.use_cases,
    limitations: record.limitations,
    faqs: record.faqs,
  };
}

export function seoConfigToRecordInput(config: SeoLandingPageConfig, active = true, dateModified?: string) {
  return {
    slug: config.slug,
    title: config.title,
    description: config.description,
    eyebrow: config.eyebrow,
    h1: config.h1,
    direct_answer: config.directAnswer,
    table_headings: config.tableHeadings,
    table_rows: config.tableRows,
    use_cases: config.useCases,
    limitations: config.limitations,
    faqs: config.faqs,
    active,
    date_modified: dateModified || new Date().toISOString().slice(0, 10),
  };
}

async function fetchContentBlocks(location?: string): Promise<ContentBlock[]> {
  let query = supabase
    .from('content_blocks' as any)
    .select('*')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false });

  if (location) query = query.eq('location', location);

  const { data, error } = await query;
  if (error) throw error;
  return ((data as ContentBlock[]) || []).map((block) => ({
    ...block,
    metadata_json: block.metadata_json || {},
  }));
}

async function fetchPublishedContentBlocks(location?: string): Promise<ContentBlock[]> {
  let query = supabase
    .from('content_blocks' as any)
    .select('*')
    .eq('visible', true)
    .eq('status', 'active')
    .order('sort_order', { ascending: true });

  if (location) query = query.eq('location', location);

  const { data, error } = await query;
  if (error) throw error;

  const now = Date.now();
  return ((data as ContentBlock[]) || [])
    .filter((block) => (!block.start_at || Date.parse(block.start_at) <= now) && (!block.end_at || Date.parse(block.end_at) >= now))
    .map((block) => ({ ...block, metadata_json: block.metadata_json || {} }));
}

async function fetchSeoLandingPages(): Promise<SeoLandingPageRecord[]> {
  const { data, error } = await supabase
    .from('seo_landing_pages' as any)
    .select('*')
    .order('slug');
  if (error) throw error;
  return (data as SeoLandingPageRecord[]) || [];
}

async function fetchSeoLandingPage(slug: string): Promise<SeoLandingPageRecord | null> {
  const { data, error } = await supabase
    .from('seo_landing_pages' as any)
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .maybeSingle();
  if (error) throw error;
  return (data as SeoLandingPageRecord | null) || null;
}

export function useContentBlocks(location?: string) {
  return useQuery({
    queryKey: ['content-blocks', location || 'all'],
    queryFn: () => fetchContentBlocks(location),
  });
}

export function usePublishedContentBlocks(location?: string) {
  return useQuery({
    queryKey: ['content-blocks-public', location || 'all'],
    queryFn: () => fetchPublishedContentBlocks(location),
    staleTime: 60_000,
  });
}

export function useSaveContentBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (block: Partial<ContentBlockInput>) => {
      const { id, ...rest } = block as any;
      const payload = {
        ...rest,
        metadata_json: rest.metadata_json || {},
        updated_at: new Date().toISOString(),
      };

      if (id) {
        const { error } = await supabase.from('content_blocks' as any).update(payload).eq('id', id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase.from('content_blocks' as any).insert(payload).select('id').single();
      if (error) throw error;
      return (data as { id?: string } | null)?.id || payload.key;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['content-blocks-public'] });
    },
  });
}

export function useDeleteContentBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('content_blocks' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-blocks'] });
      queryClient.invalidateQueries({ queryKey: ['content-blocks-public'] });
    },
  });
}

export function useSeoLandingPages() {
  return useQuery({
    queryKey: ['seo-landing-pages'],
    queryFn: fetchSeoLandingPages,
  });
}

export function useSeoLandingPage(slug: string | null) {
  return useQuery({
    queryKey: ['seo-landing-page', slug],
    queryFn: () => (slug ? fetchSeoLandingPage(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useSaveSeoLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<SeoLandingPageRecord> & { slug: string }) => {
      const { id, ...rest } = record as any;
      delete rest.created_at;
      delete rest.updated_at;
      const payload = { ...rest, updated_at: new Date().toISOString() };

      if (id) {
        const { error } = await supabase.from('seo_landing_pages' as any).update(payload).eq('id', id);
        if (error) throw error;
        return id;
      }

      const { data, error } = await supabase
        .from('seo_landing_pages' as any)
        .upsert(payload, { onConflict: 'slug' })
        .select('id')
        .single();
      if (error) throw error;
      return (data as { id?: string } | null)?.id || payload.slug;
    },
    onSuccess: (_id, record) => {
      queryClient.invalidateQueries({ queryKey: ['seo-landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['seo-landing-page', record.slug] });
    },
  });
}

export function useDeleteSeoLandingPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('seo_landing_pages' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seo-landing-pages'] });
      queryClient.invalidateQueries({ queryKey: ['seo-landing-page'] });
    },
  });
}
