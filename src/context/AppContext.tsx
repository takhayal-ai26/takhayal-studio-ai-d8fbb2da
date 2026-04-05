import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type NavPage = 'home' | 'canvas' | 'gallery' | 'templates' | 'credits' | 'settings';
export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5';
export type Quality = 'standard' | 'hd';
export type UserPlan = 'free' | 'pro';
export type CardState = 'queued' | 'generating' | 'completed' | 'failed';

export interface GenerationCard {
  id: string;
  image: GeneratedImage | null;
  state: CardState;
  prompt: string;
  startedAt: number;
  model: string;
  aspectRatio: string;
  resolution: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  template?: string;
  style?: string;
  aspectRatio: AspectRatio;
  quality: Quality;
  createdAt: Date;
  modelName?: string;
  modelId?: string;
  qualityTier?: string;
  endpointId?: string;
}

export interface StudioModel {
  id: string;
  model_name: string;
  endpoint_id: string;
  supported_ratios: string[];
  supported_quality_tiers: string[];
  credits_per_generation: number | null;
  input_type: string;
  is_default: boolean;
  best_for: string | null;
  best_for_ar: string | null;
}

export const TEMPLATE_PROMPTS: Record<string, string> = {
  'Ramadan': 'Warm cinematic Ramadan ad, golden lantern, crescent moon, deep purple and gold palette, soft volumetric lighting, premium studio quality',
  'Eid': 'Joyful Eid celebration, vibrant colors, happy family, festive decorations, bright warm atmosphere, commercial quality',
  'National Day': 'Kuwait National Day ad, flag elements, green red white colors, patriotic modern design, professional photography quality',
  'Sale/Offers': 'Eye-catching sale ad, bold typography, red and yellow colors, products featured, promotional commercial quality',
  'Product Shot': 'Professional product on clean white background, studio lighting, sharp details, 4K commercial quality',
  'Reels Cover': 'Trendy Instagram Reels cover, bold modern aesthetic, striking composition, 9:16 vertical, social media ready',
  'Restaurant': 'Appetizing restaurant ad, professional food photography, steam rising, warm colors, social media ready',
  'Fashion': 'High-end fashion ad, modern modest style, soft diffused lighting, clean background, editorial quality',
  'Real Estate': 'Luxury real estate ad, modern building, blue sky, professional architectural photography, premium feel',
  'Medical': 'Clean medical clinic ad, blue white colors, trustworthy atmosphere, modern healthcare aesthetic, professional',
};

export const STYLE_OPTIONS = [
  'Cinematic', 'Photorealistic', 'Illustration', '3D Render',
  'Minimal', 'Editorial', 'Product', 'Portrait',
];

// Map quality tier keys to credit costs (will be overridden by DB tier data)
const QUALITY_TIER_LABELS: Record<string, string> = {
  '1K': 'Standard (1K)',
  '2K': 'HD (2K)',
  '4K': 'Ultra (4K)',
};

interface AppState {
  isAuthenticated: boolean;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  activePage: NavPage;
  credits: number;
  plan: UserPlan;
  prompt: string;
  selectedTemplate: string | null;
  selectedStyle: string | null;
  aspectRatio: AspectRatio;
  quality: Quality;
  selectedQualityTier: string;
  enhancePrompt: boolean;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  currentImageIndex: number;
  gallery: GeneratedImage[];
  generationCards: GenerationCard[];
  setGenerationCards: React.Dispatch<React.SetStateAction<GenerationCard[]>>;
  lastGenerationMeta: { modelName: string; modelId: string; qualityTier: string; endpointId: string } | null;
  authModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  upgradeModalOpen: boolean;
  // Model-aware state
  availableModels: StudioModel[];
  selectedModelId: string | null;
  selectedModel: StudioModel | null;
  availableQualityTiers: string[];
  availableRatios: string[];
  tierCreditsMap: Record<string, number>;
  login: (email: string, name?: string) => void;
  logout: () => void;
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  openUpgradeModal: () => void;
  closeUpgradeModal: () => void;
  requireAuth: (action: () => void) => void;
  setActivePage: (page: NavPage) => void;
  setPrompt: (prompt: string) => void;
  setSelectedTemplate: (template: string | null) => void;
  setSelectedStyle: (style: string | null) => void;
  setAspectRatio: (ratio: AspectRatio) => void;
  setQuality: (quality: Quality) => void;
  setSelectedQualityTier: (tier: string) => void;
  setSelectedModelId: (id: string | null) => void;
  setEnhancePrompt: (enhance: boolean) => void;
  setCurrentImageIndex: (index: number) => void;
  generate: (opts?: { modelId?: string; qualityTier?: string; creditCost?: number }) => void;
  getCreditCost: () => number;
  getQualityTierLabel: (tier: string) => string;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const isAuthenticated = !!auth.user;
  const userName = auth.profile?.full_name || auth.user?.user_metadata?.full_name || auth.user?.email?.split('@')[0] || '';
  const userEmail = auth.profile?.email || auth.user?.email || '';
  const userAvatarUrl = auth.profile?.avatar_url || auth.user?.user_metadata?.avatar_url || null;
  const [activePage, setActivePage] = useState<NavPage>('canvas');
  const credits = auth.profile?.credits ?? 10;
  const plan: UserPlan = (auth.profile?.plan as UserPlan) || 'free';
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quality, setQuality] = useState<Quality>('standard');
  const [selectedQualityTier, setSelectedQualityTier] = useState<string>('1K');
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [generationCards, setGenerationCards] = useState<GenerationCard[]>([]);
  const [lastGenerationMeta, setLastGenerationMeta] = useState<{ modelName: string; modelId: string; qualityTier: string; endpointId: string } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('signup');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Model-aware state
  const [availableModels, setAvailableModels] = useState<StudioModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [tierCreditsMap, setTierCreditsMap] = useState<Record<string, number>>({});

  // Fetch active models on mount
  useEffect(() => {
    const fetchModels = async () => {
      const { data } = await supabase
        .from('models')
        .select('id, model_name, endpoint_id, supported_ratios, supported_quality_tiers, credits_per_generation, input_type, is_default')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('model_name');
      if (data) {
        const models: StudioModel[] = (data as any[]).map(m => ({
          ...m,
          supported_ratios: Array.isArray(m.supported_ratios) ? m.supported_ratios : [],
          supported_quality_tiers: Array.isArray(m.supported_quality_tiers) ? m.supported_quality_tiers : ['1K'],
        }));
        setAvailableModels(models);
        const defaultModel = models.find(m => m.is_default) || models[0];
        if (defaultModel && !selectedModelId) {
          setSelectedModelId(defaultModel.id);
        }
      }
    };
    fetchModels();
  }, []);

  const selectedModel = availableModels.find(m => m.id === selectedModelId) || null;
  const availableQualityTiers = selectedModel?.supported_quality_tiers || ['1K'];
  const availableRatios = selectedModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];

  // When model changes, reset quality tier if current tier is not supported
  useEffect(() => {
    if (selectedModel && !selectedModel.supported_quality_tiers.includes(selectedQualityTier)) {
      setSelectedQualityTier(selectedModel.supported_quality_tiers[0] || '1K');
    }
    // Also reset aspect ratio if not supported
    if (selectedModel && selectedModel.supported_ratios.length > 0 && !selectedModel.supported_ratios.includes(aspectRatio)) {
      const firstRatio = selectedModel.supported_ratios[0] as AspectRatio;
      if (['1:1', '9:16', '16:9', '4:5'].includes(firstRatio)) {
        setAspectRatio(firstRatio);
      }
    }
  }, [selectedModelId, selectedModel]);

  // Fetch tier credits when model changes — only available tiers
  useEffect(() => {
    if (!selectedModelId) return;
    const fetchTierCredits = async () => {
      const { data } = await supabase
        .from('model_pricing_tiers')
        .select('quality_level, credits_charged, is_available, is_active, resolution_label, actual_pixels')
        .eq('model_id', selectedModelId);
      if (data) {
        const map: Record<string, number> = {};
        for (const t of data as any[]) {
          if (t.quality_level && t.is_active && t.is_available !== false) {
            map[t.quality_level] = t.credits_charged;
          }
        }
        setTierCreditsMap(map);
      }
    };
    fetchTierCredits();
  }, [selectedModelId]);

  const login = useCallback((_email: string, _name?: string) => {
    // Legacy — real auth now handled by AuthContext
    setAuthModalOpen(false);
  }, []);

  const logout = useCallback(async () => {
    await auth.signOut();
  }, [auth]);

  const openAuthModal = useCallback((tab: 'login' | 'signup' = 'signup') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);
  const openUpgradeModal = useCallback(() => setUpgradeModalOpen(true), []);
  const closeUpgradeModal = useCallback(() => setUpgradeModalOpen(false), []);

  const requireAuth = useCallback((action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      setAuthModalTab('signup');
      setAuthModalOpen(true);
    }
  }, [isAuthenticated]);

  const getCreditCost = useCallback(() => {
    // Use tier-specific credits from DB, fallback to model default
    if (tierCreditsMap[selectedQualityTier] !== undefined) {
      return tierCreditsMap[selectedQualityTier];
    }
    return selectedModel?.credits_per_generation || 2;
  }, [selectedQualityTier, tierCreditsMap, selectedModel]);

  const getQualityTierLabel = useCallback((tier: string) => {
    return QUALITY_TIER_LABELS[tier] || tier;
  }, []);

  const generate = useCallback(async (opts?: { modelId?: string; qualityTier?: string; creditCost?: number }) => {
    if (!prompt.trim() || isGenerating) return;
    if (!isAuthenticated) {
      setAuthModalTab('signup');
      setAuthModalOpen(true);
      return;
    }
    const cost = opts?.creditCost ?? getCreditCost();
    if (credits < cost) {
      setUpgradeModalOpen(true);
      return;
    }

    // Capture model metadata at generation time (before async)
    const genModelId = opts?.modelId || selectedModelId || undefined;
    const genModel = availableModels.find(m => m.id === genModelId);
    const genQualityTier = opts?.qualityTier || selectedQualityTier;
    const genMeta = {
      modelName: genModel?.model_name || 'Unknown',
      modelId: genModelId || '',
      qualityTier: genQualityTier,
      endpointId: genModel?.endpoint_id || '',
    };
    setLastGenerationMeta(genMeta);

    setIsGenerating(true);
    // Credits will be deducted server-side; refresh profile after generation

    try {
      const fullPrompt = selectedTemplate
        ? `${TEMPLATE_PROMPTS[selectedTemplate] || ''}, ${prompt}`
        : prompt;
      const styledPrompt = selectedStyle
        ? `${fullPrompt}, ${selectedStyle} style`
        : fullPrompt;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: styledPrompt,
          aspect_ratio: aspectRatio,
          num_images: 1,
          model_id: opts?.modelId || selectedModelId || undefined,
          quality_tier: opts?.qualityTier || selectedQualityTier,
        },
      });

      if (error) throw error;

      const newImages: GeneratedImage[] = (data.images || []).map((img: { url: string }, i: number) => ({
        id: `${Date.now()}-${i}`,
        url: img.url,
        prompt,
        template: selectedTemplate || undefined,
        style: selectedStyle || undefined,
        aspectRatio,
        quality,
        createdAt: new Date(),
        modelName: genMeta.modelName,
        modelId: genMeta.modelId,
        qualityTier: genMeta.qualityTier,
        endpointId: genMeta.endpointId,
      }));

      setGeneratedImages(newImages);
      setCurrentImageIndex(0);
      setGallery(prev => [...newImages, ...prev]);
    } catch (err) {
      console.error('Generation failed:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, isAuthenticated, credits, quality, selectedTemplate, selectedStyle, aspectRatio, selectedModelId, selectedQualityTier, getCreditCost]);

  return (
    <AppContext.Provider value={{
      isAuthenticated, userName, userEmail, userAvatarUrl, activePage, credits, plan,
      prompt, selectedTemplate, selectedStyle, aspectRatio, quality,
      selectedQualityTier, enhancePrompt, isGenerating, generatedImages, currentImageIndex, gallery,
      generationCards, setGenerationCards, lastGenerationMeta,
      authModalOpen, authModalTab, upgradeModalOpen,
      availableModels, selectedModelId, selectedModel, availableQualityTiers, availableRatios, tierCreditsMap,
      login, logout, openAuthModal, closeAuthModal, openUpgradeModal, closeUpgradeModal, requireAuth,
      setActivePage, setPrompt, setSelectedTemplate,
      setSelectedStyle, setAspectRatio, setQuality, setSelectedQualityTier, setSelectedModelId,
      setEnhancePrompt,
      setCurrentImageIndex, generate, getCreditCost, getQualityTierLabel,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) {
    // During HMR the provider may momentarily unmount; reload to recover
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}