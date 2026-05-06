import { useCallback, useState } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { TEMPLATE_PROMPTS } from '@/context/AppContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { localizePath } from '@/lib/localized-routes';
import { isGenerationJobInProgress } from './creationPanelState';
import type { ReferenceImageUpload } from './useReferenceImageUploads';

export type StudioGenerationBlockReason =
  | 'empty_prompt'
  | 'busy'
  | 'missing_model'
  | 'uploading'
  | 'pending_uploads'
  | 'auth_required'
  | 'insufficient_credits'
  | null;

type StudioGenerationGuardInput = {
  prompt: string;
  isGenerationBusy: boolean;
  hasModel: boolean;
  isUploading: boolean;
  hasPendingUploads: boolean;
  isAuthenticated: boolean;
  credits: number;
  cost: number;
};

type UseStudioGenerationSubmitOptions = {
  prompt: string;
  selectedTemplate: string | null;
  aspectRatio: string;
  selectedResolution: string;
  modelId: string | null | undefined;
  cost: number;
  uploadedImages: ReferenceImageUpload[];
  isUploading: boolean;
  pendingUploads: boolean;
  isGenerating: boolean;
  credits: number;
  isAuthenticated: boolean;
  openAuthModal: (tab?: 'login' | 'signup') => void;
  openUpgradeModal: () => void;
  navigate: NavigateFunction;
  language: string;
};

export function getStudioGenerationBlockReason({
  prompt,
  isGenerationBusy,
  hasModel,
  isUploading,
  hasPendingUploads,
  isAuthenticated,
  credits,
  cost,
}: StudioGenerationGuardInput): StudioGenerationBlockReason {
  if (prompt.trim().length === 0) return 'empty_prompt';
  if (isGenerationBusy) return 'busy';
  if (!hasModel) return 'missing_model';
  if (isUploading) return 'uploading';
  if (hasPendingUploads) return 'pending_uploads';
  if (!isAuthenticated) return 'auth_required';
  if (credits < cost) return 'insufficient_credits';
  return null;
}

export function canClickStudioGenerate(reason: StudioGenerationBlockReason) {
  return reason === null || reason === 'auth_required' || reason === 'insufficient_credits';
}

export function buildStudioGenerationPrompt(prompt: string, selectedTemplate: string | null) {
  return selectedTemplate
    ? `${TEMPLATE_PROMPTS[selectedTemplate] || ''}, ${prompt}`
    : prompt;
}

export function getResolvedReferenceImageUrls(uploadedImages: ReferenceImageUpload[]) {
  return uploadedImages.filter(img => img.url).map(img => img.url!);
}

export function useStudioGenerationSubmit({
  prompt,
  selectedTemplate,
  aspectRatio,
  selectedResolution,
  modelId,
  cost,
  uploadedImages,
  isUploading,
  pendingUploads,
  isGenerating,
  credits,
  isAuthenticated,
  openAuthModal,
  openUpgradeModal,
  navigate,
  language,
}: UseStudioGenerationSubmitOptions) {
  const { jobs, submitJob } = useGenerationJobs();
  const [localGenerating, setLocalGenerating] = useState(false);
  const [activeGenerationJobId, setActiveGenerationJobId] = useState<string | null>(null);

  const activeGenerationInProgress = isGenerationJobInProgress(jobs, activeGenerationJobId);
  const isGenerationBusy = isGenerating || localGenerating || activeGenerationInProgress;
  const blockReason = getStudioGenerationBlockReason({
    prompt,
    isGenerationBusy,
    hasModel: !!modelId,
    isUploading,
    hasPendingUploads: pendingUploads,
    isAuthenticated,
    credits,
    cost,
  });
  const canGenerate = canClickStudioGenerate(blockReason);

  const handleGenerate = useCallback(async () => {
    const currentBlockReason = getStudioGenerationBlockReason({
      prompt,
      isGenerationBusy,
      hasModel: !!modelId,
      isUploading,
      hasPendingUploads: pendingUploads,
      isAuthenticated,
      credits,
      cost,
    });

    if (!canClickStudioGenerate(currentBlockReason)) return;
    if (currentBlockReason === 'auth_required') { openAuthModal('signup'); return; }
    if (currentBlockReason === 'insufficient_credits') { openUpgradeModal(); return; }

    const imageUrls = getResolvedReferenceImageUrls(uploadedImages);

    // Safety: if user attached refs but none resolved to URLs, block instead of silently falling back.
    if (uploadedImages.length > 0 && imageUrls.length === 0) {
      console.error('[studio] Aborting: uploaded references have no resolved URLs.');
      return;
    }

    setLocalGenerating(true);

    try {
      const fullPrompt = buildStudioGenerationPrompt(prompt, selectedTemplate);
      const jobId = await submitJob({
        prompt: fullPrompt,
        ratio: aspectRatio,
        qualityTier: selectedResolution,
        modelId: modelId || null,
        creditCost: cost,
        sourceTag: 'studio',
        imageUrl: imageUrls.length === 1 ? imageUrls[0] : undefined,
        imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
      });

      if (!jobId) return;

      setActiveGenerationJobId(jobId);
      sessionStorage.setItem('takhayal:studio:recentJobId', jobId);
      window.dispatchEvent(new CustomEvent('takhayal:studio:recent-job', {
        detail: {
          jobId,
          prompt: fullPrompt,
          ratio: aspectRatio,
          resolution: selectedResolution,
          qualityTier: selectedResolution,
          modelId: modelId || null,
          creditCost: cost,
        },
      }));

      if (window.matchMedia('(max-width: 767px)').matches) {
        navigate(`${localizePath('/gallery', language)}?highlight=${encodeURIComponent(jobId)}`);
      }
    } finally {
      setLocalGenerating(false);
    }
  }, [
    prompt,
    isGenerationBusy,
    modelId,
    isUploading,
    pendingUploads,
    isAuthenticated,
    credits,
    cost,
    openAuthModal,
    openUpgradeModal,
    uploadedImages,
    selectedTemplate,
    submitJob,
    aspectRatio,
    selectedResolution,
    navigate,
    language,
  ]);

  return {
    canGenerate,
    isGenerationBusy,
    handleGenerate,
  };
}
