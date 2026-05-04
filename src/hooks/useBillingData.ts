import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──
export interface PricingPlan {
  id: string;
  slug: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price: number;
  price_monthly_usd: number;
  price_annual_usd: number;
  price_annual_monthly_equivalent: number;
  annual_discount_percent: number;
  credits_monthly: number;
  currency: string;
  billing_period: string;
  included_credits: number;
  badge_en: string;
  badge_ar: string;
  cta_label_en: string;
  cta_label_ar: string;
  cta_action: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
  is_default: boolean;
  visible_logged_out: boolean;
  visible_logged_in: boolean;
  features: Array<{en: string; ar: string}>;
  plan_features?: PlanFeature[];
}

export interface PlanFeature {
  id: string;
  plan_id: string;
  text_en: string;
  text_ar: string;
  sort_order: number;
  active: boolean;
}

export interface CreditPackage {
  id: string;
  name_en: string;
  name_ar: string;
  credits: number;
  price: number;
  currency: string;
  badge_en: string;
  badge_ar: string;
  description_en: string;
  description_ar: string;
  cta_label_en: string;
  cta_label_ar: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
  bonus_credits: number;
  is_popular: boolean;
}

export interface PricingFaq {
  id: string;
  question_en: string;
  question_ar: string;
  answer_en: string;
  answer_ar: string;
  sort_order: number;
  active: boolean;
}

export interface CreditExplanation {
  id: string;
  title_en: string;
  title_ar: string;
  subtitle_en: string;
  subtitle_ar: string;
  icon: string;
  sort_order: number;
  active: boolean;
}

export interface PricingPageContent {
  id: string;
  section_key: string;
  field_key: string;
  value_en: string;
  value_ar: string;
  sort_order: number;
  active: boolean;
  metadata_json: any;
}

// ── Fetchers ──
const fetchPlans = async (): Promise<PricingPlan[]> => {
  const { data: plans, error } = await supabase
    .from('pricing_plans' as any)
    .select('*')
    .order('sort_order');
  if (error) throw error;
  
  return ((plans as any[]) || []).map((p: any) => ({
    ...p,
    features: p.features || [],
  }));
};

const fetchPackages = async (): Promise<CreditPackage[]> => {
  const { data, error } = await supabase.from('credit_packages' as any).select('*').order('sort_order');
  if (error) throw error;
  return (data as any[]) || [];
};

const fetchFaqs = async (): Promise<PricingFaq[]> => {
  const { data, error } = await supabase.from('pricing_faqs' as any).select('*').order('sort_order');
  if (error) throw error;
  return (data as any[]) || [];
};

const fetchExplanations = async (): Promise<CreditExplanation[]> => {
  const { data, error } = await supabase.from('credit_usage_explanations' as any).select('*').order('sort_order');
  if (error) throw error;
  return (data as any[]) || [];
};

const fetchPageContent = async (): Promise<PricingPageContent[]> => {
  const { data, error } = await supabase.from('pricing_page_content' as any).select('*').order('sort_order');
  if (error) throw error;
  return (data as any[]) || [];
};

// ── Hooks ──
export function usePricingPlans() {
  return useQuery({ queryKey: ['pricing-plans'], queryFn: fetchPlans });
}
export function useCreditPackages() {
  return useQuery({ queryKey: ['credit-packages'], queryFn: fetchPackages });
}
export function usePricingFaqs() {
  return useQuery({ queryKey: ['pricing-faqs'], queryFn: fetchFaqs });
}
export function useCreditExplanations() {
  return useQuery({ queryKey: ['credit-explanations'], queryFn: fetchExplanations });
}
export function usePricingPageContent() {
  return useQuery({ queryKey: ['pricing-page-content'], queryFn: fetchPageContent });
}

// ── Mutations ──
export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ plan }: { plan: Partial<PricingPlan>; features?: any[] }) => {
      const { id, plan_features, ...rest } = plan as any;
      rest.updated_at = new Date().toISOString();
      
      let planId = id;
      if (id) {
        const { error } = await supabase.from('pricing_plans' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('pricing_plans' as any).insert(rest).select().single();
        if (error) throw error;
        planId = (data as any).id;
      }
      return planId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-plans'] });
      qc.invalidateQueries({ queryKey: ['pricing-plans-preview'] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing_plans' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pricing-plans'] });
      qc.invalidateQueries({ queryKey: ['pricing-plans-preview'] });
    },
  });
}

export function useSavePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pkg: Partial<CreditPackage>) => {
      const { id, ...rest } = pkg as any;
      rest.updated_at = new Date().toISOString();
      if (id) {
        const { error } = await supabase.from('credit_packages' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('credit_packages' as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit-packages'] }),
  });
}

export function useDeletePackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_packages' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit-packages'] }),
  });
}

export function useSaveFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (faq: Partial<PricingFaq>) => {
      const { id, ...rest } = faq as any;
      rest.updated_at = new Date().toISOString();
      if (id) {
        const { error } = await supabase.from('pricing_faqs' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pricing_faqs' as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-faqs'] }),
  });
}

export function useDeleteFaq() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('pricing_faqs' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-faqs'] }),
  });
}

export function useSaveExplanation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<CreditExplanation>) => {
      const { id, ...rest } = item as any;
      rest.updated_at = new Date().toISOString();
      if (id) {
        const { error } = await supabase.from('credit_usage_explanations' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('credit_usage_explanations' as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit-explanations'] }),
  });
}

export function useDeleteExplanation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('credit_usage_explanations' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['credit-explanations'] }),
  });
}

export function useSavePageContent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<PricingPageContent>) => {
      const { id, ...rest } = item as any;
      rest.updated_at = new Date().toISOString();
      if (id) {
        const { error } = await supabase.from('pricing_page_content' as any).update(rest).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pricing_page_content' as any).insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pricing-page-content'] }),
  });
}
