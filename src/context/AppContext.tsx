import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type NavPage = 'home' | 'canvas' | 'gallery' | 'templates' | 'credits' | 'settings';
export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5';
export type Quality = 'standard' | 'hd';
export type UserPlan = 'free' | 'pro';
export type CardState = 'processing' | 'rendering' | 'completed';

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

interface AppState {
  isAuthenticated: boolean;
  userName: string;
  userEmail: string;
  activePage: NavPage;
  credits: number;
  plan: UserPlan;
  prompt: string;
  selectedTemplate: string | null;
  selectedStyle: string | null;
  aspectRatio: AspectRatio;
  quality: Quality;
  enhancePrompt: boolean;
  isGenerating: boolean;
  generatedImages: GeneratedImage[];
  currentImageIndex: number;
  gallery: GeneratedImage[];
  generationCards: GenerationCard[];
  setGenerationCards: React.Dispatch<React.SetStateAction<GenerationCard[]>>;
  authModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  upgradeModalOpen: boolean;
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
  setEnhancePrompt: (enhance: boolean) => void;
  setCurrentImageIndex: (index: number) => void;
  generate: (opts?: { modelId?: string; qualityTier?: string; creditCost?: number }) => void;
  getCreditCost: () => number;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [activePage, setActivePage] = useState<NavPage>('canvas');
  const [credits, setCredits] = useState(10);
  const [plan, setPlan] = useState<UserPlan>('free');
  const [prompt, setPrompt] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [quality, setQuality] = useState<Quality>('standard');
  const [enhancePrompt, setEnhancePrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [generationCards, setGenerationCards] = useState<GenerationCard[]>([]);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('signup');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const login = useCallback((email: string, name?: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserName(name || email.split('@')[0]);
    setCredits(20);
    setAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserName('');
    setUserEmail('');
    setPlan('free');
  }, []);

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
    return quality === 'hd' ? 4 : 2;
  }, [quality]);

  // Ratio-to-size mapping now handled server-side by generate-image edge function

  const generate = useCallback(async (opts?: { modelId?: string; qualityTier?: string; creditCost?: number }) => {
    if (!prompt.trim() || isGenerating) return;
    if (!isAuthenticated) {
      setAuthModalTab('signup');
      setAuthModalOpen(true);
      return;
    }
    const cost = opts?.creditCost ?? (quality === 'hd' ? 4 : 2);
    if (credits < cost) {
      setUpgradeModalOpen(true);
      return;
    }

    setIsGenerating(true);
    setCredits(prev => prev - cost);

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
          model_id: opts?.modelId || undefined,
          quality_tier: opts?.qualityTier || undefined,
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
      }));

      setGeneratedImages(newImages);
      setCurrentImageIndex(0);
      setGallery(prev => [...newImages, ...prev]);
    } catch (err) {
      console.error('Generation failed:', err);
      setCredits(prev => prev + cost);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, isGenerating, isAuthenticated, credits, quality, selectedTemplate, selectedStyle, aspectRatio]);

  return (
    <AppContext.Provider value={{
      isAuthenticated, userName, userEmail, activePage, credits, plan,
      prompt, selectedTemplate, selectedStyle, aspectRatio, quality,
      enhancePrompt, isGenerating, generatedImages, currentImageIndex, gallery,
      generationCards, setGenerationCards,
      authModalOpen, authModalTab, upgradeModalOpen,
      login, logout, openAuthModal, closeAuthModal, openUpgradeModal, closeUpgradeModal, requireAuth,
      setActivePage, setPrompt, setSelectedTemplate,
      setSelectedStyle, setAspectRatio, setQuality, setEnhancePrompt,
      setCurrentImageIndex, generate, getCreditCost,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
