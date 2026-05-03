import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, ChevronRight, X, Cpu, Maximize, Image as ImageIcon, Wand2, Zap } from 'lucide-react';
import { useApp, TEMPLATE_PROMPTS, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { useModels, ModelRecord } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { CREDIT_VALUE_USD } from '@/lib/pricing-engine';
import { ModelDropdown } from './dropdowns/ModelDropdown';
import { SizeDropdown } from './dropdowns/SizeDropdown';
import { ResolutionDropdown } from './dropdowns/ResolutionDropdown';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { BackToImageTools } from '@/components/tools/BackToImageTools';
import { GenerateButton, imageSizeError, isOversizedImage } from '@/lib/ux';
import { localizePath } from '@/lib/localized-routes';
import { toast } from 'sonner';

const CREDIT_VALUE = CREDIT_VALUE_USD;
type OpenDropdown = 'model' | 'size' | 'resolution' | null;

export function CreationPanel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { prompt, setPrompt, selectedTemplate, setSelectedTemplate, aspectRatio, setAspectRatio, quality, setQuality, isGenerating, credits, getCreditCost, isAuthenticated, openAuthModal, openUpgradeModal, selectedModelId: contextModelId, setSelectedModelId: setContextModelId } = useApp();
  const { submitJob } = useGenerationJobs();
  const [localGenerating, setLocalGenerating] = useState(false);
  const { t, lang: language } = useLanguage();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality, getCostForModelQuality, allTiers } = usePricingTiers();

  // Use AppContext's selectedModelId to sync with model detail page navigation
  const [localModelId, setLocalModelId] = useState<string>('');
  const selectedModelId = localModelId || contextModelId || '';
  const setSelectedModelId = useCallback((id: string) => {
    setLocalModelId(id);
    setContextModelId(id);
  }, [setContextModelId]);

  const [selectedResolution, setSelectedResolution] = useState<string>('1K');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
  const [uploadedImages, setUploadedImages] = useState<{ preview: string; url: string | null }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const modelRowRef = useRef<HTMLButtonElement>(null);
  const sizeRowRef = useRef<HTMLButtonElement>(null);
  const resRowRef = useRef<HTMLButtonElement>(null);

  const currentModel = activeModels.find(m => m.id === selectedModelId) || defaultModel || activeModels[0];
  const supportsImageInput = currentModel?.supports_image_input ?? false;
  const maxImages = currentModel?.max_image_inputs ?? 1;

  const modelQualityTiers = (() => {
    if (!currentModel) return ['1K'];
    const activePricingTiers = (allTiers[currentModel.id] || [])
      .filter((t: any) => t.is_active && t.is_available !== false && t.quality_level)
      .map((t: any) => t.quality_level as string);
    if (activePricingTiers.length > 0) return activePricingTiers;
    const dbTiers = currentModel.supported_quality_tiers || ['1K'];
    return dbTiers;
  })();

  const cost = (() => {
    if (!currentModel) return getCreditCost();
    const tierCredits = getCreditsForModelQuality(currentModel.id, selectedResolution);
    if (tierCredits !== null) return tierCredits;
    return getCreditsForModel(currentModel.id);
  })();

  // Sync from context when navigating from model detail page
  useEffect(() => {
    if (contextModelId && activeModels.some(m => m.id === contextModelId)) {
      setLocalModelId(contextModelId);
    }
  }, [contextModelId, activeModels, setSelectedModelId]);

  useEffect(() => {
    const modelId = searchParams.get('modelId');
    if (modelId && activeModels.some(m => m.id === modelId)) setSelectedModelId(modelId);
  }, [activeModels, searchParams, setSelectedModelId]);

  useEffect(() => {
    const imageUrl = searchParams.get('imageUrl');
    if (!imageUrl || uploadedImages.some(img => img.url === imageUrl)) return;
    setUploadedImages([{ preview: imageUrl, url: imageUrl }]);
  }, [searchParams, uploadedImages]);

  useEffect(() => {
    if (defaultModel && !selectedModelId) setSelectedModelId(defaultModel.id);
    else if (activeModels.length > 0 && !selectedModelId) setSelectedModelId(activeModels[0].id);
  }, [defaultModel, activeModels, selectedModelId, setSelectedModelId]);

  useEffect(() => {
    if (currentModel && !modelQualityTiers.includes(selectedResolution))
      setSelectedResolution(modelQualityTiers[0] || '1K');
  }, [currentModel, selectedResolution, modelQualityTiers]);

  const availableRatios = currentModel?.supported_ratios || ['1:1', '16:9', '9:16', '4:5'];

  useEffect(() => {
    if (currentModel && !currentModel.supported_ratios.includes(aspectRatio)) {
      const defaultR = currentModel.default_ratio as AspectRatio || '1:1' as AspectRatio;
      setAspectRatio(defaultR);
    }
  }, [currentModel, aspectRatio, setAspectRatio]);

  // Clear uploaded images when switching to a model that doesn't support it
  useEffect(() => {
    if (!supportsImageInput && uploadedImages.length > 0) {
      setUploadedImages([]);
    }
  }, [supportsImageInput, uploadedImages.length]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (isOversizedImage(file)) {
      toast.error(imageSizeError(language === 'ar'));
      return;
    }
    if (uploadedImages.length >= maxImages) return;

    const preview = URL.createObjectURL(file);
    const newEntry = { preview, url: null as string | null };
    setUploadedImages(prev => [...prev, newEntry]);

    if (!user) {
      setUploadedImages(prev => prev.map(img => img.preview === preview ? { ...img, url: preview } : img));
      return;
    }

    setIsUploading(true);

    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/input-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('tool-files')
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);
      setUploadedImages(prev => prev.map(img => img.preview === preview ? { ...img, url: urlData.publicUrl } : img));
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadedImages(prev => prev.filter(img => img.preview !== preview));
    } finally {
      setIsUploading(false);
    }
  }, [user, uploadedImages.length, maxImages, language]);

  const removeImage = useCallback((index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const clearAllImages = useCallback(() => {
    setUploadedImages([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const pendingUploads = uploadedImages.some(img => !img.url);
  const canGenerate = prompt.trim().length > 0 && !isGenerating && !localGenerating && !!currentModel && !isUploading && !pendingUploads;
  const toggleDropdown = (key: OpenDropdown) => setOpenDropdown(prev => prev === key ? null : key);

  useEffect(() => { const handler = (e: MouseEvent) => { if (openDropdown && panelRef.current && !panelRef.current.contains(e.target as Node)) { const target = e.target as HTMLElement; if (target.closest('[data-dropdown-portal]')) return; setOpenDropdown(null); } }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [openDropdown]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    if (!isAuthenticated) { openAuthModal('signup'); return; }
    if (credits < cost) { openUpgradeModal(); return; }

    setLocalGenerating(true);
    const fullPrompt = selectedTemplate
      ? `${TEMPLATE_PROMPTS[selectedTemplate] || ''}, ${prompt}`
      : prompt;

    const imageUrls = uploadedImages.filter(img => img.url).map(img => img.url!);

    // Safety: if user attached refs but none resolved to URLs, block instead of silently falling back.
    if (uploadedImages.length > 0 && imageUrls.length === 0) {
      setLocalGenerating(false);
      console.error('[studio] Aborting: uploaded references have no resolved URLs.');
      return;
    }

    const jobId = await submitJob({
      prompt: fullPrompt,
      ratio: aspectRatio,
      qualityTier: selectedResolution,
      modelId: currentModel?.id || null,
      creditCost: cost,
      sourceTag: 'studio',
      imageUrl: imageUrls.length === 1 ? imageUrls[0] : undefined,
      imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
    });

    if (!jobId) {
      setLocalGenerating(false);
      return;
    }

    sessionStorage.setItem('takhayal:studio:recentJobId', jobId);
    window.dispatchEvent(new CustomEvent('takhayal:studio:recent-job', { detail: { jobId } }));
    setLocalGenerating(false);

    if (window.matchMedia('(max-width: 767px)').matches) {
      navigate(`${localizePath('/gallery', language)}?highlight=${encodeURIComponent(jobId)}`);
    }
  }, [canGenerate, isAuthenticated, credits, cost, prompt, selectedTemplate, aspectRatio, selectedResolution, currentModel, submitJob, openAuthModal, openUpgradeModal, uploadedImages, navigate, language]);

  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDropdown(null); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [handleGenerate]);

  const handleResolution = (r: string) => { setSelectedResolution(r); setQuality(r === '1K' ? 'standard' : 'hd'); setOpenDropdown(null); };

  const getAnchorRect = (ref: React.RefObject<HTMLElement>): DOMRect | null => {
    return ref.current?.getBoundingClientRect() ?? null;
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  return (
    <aside ref={panelRef} className="w-full md:w-[380px] xl:w-[420px] flex flex-col bg-background flex-shrink-0 overflow-visible relative z-30">
      <div className="md:flex-1 overflow-visible md:overflow-y-auto overflow-x-visible px-4 pt-4 pb-4 md:p-4 space-y-2 scrollbar-thin">
        {/* Back to Image Tools — keeps Generate Image consistent with all other tool pages */}
        <BackToImageTools className="mb-2" />
        {/* Prompt */}
        <div className="rounded-2xl bg-card/50 p-4 border border-border/30 hover:border-border/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 size={12} className="text-primary" />
              </div>
              <label htmlFor="studio-prompt" className="typo-label-strong text-[14px]">{t.studio.prompt}</label>
            </div>
            <div className="flex items-center gap-1.5">
              {prompt.length > 0 && (
                <button
                  onClick={() => { setPrompt(''); setSelectedTemplate(null); }}
                  className="min-h-11 min-w-11 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/[0.06] transition-all"
                  aria-label={language === 'ar' ? 'مسح الوصف' : 'Clear prompt'}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
          <textarea
            id="studio-prompt"
            value={prompt}
            onChange={e => setPrompt(e.target.value.slice(0, 500))}
            placeholder={t.studio.describeCreate}
            className="w-full min-h-[120px] bg-foreground/[0.03] border border-border/20 rounded-xl p-3.5 text-[15px] font-medium text-foreground placeholder:text-foreground/40 focus:border-primary/30 focus:bg-foreground/[0.04] focus:outline-none focus:ring-2 focus:ring-primary/10 resize-none leading-relaxed transition-all"
          />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[12px] font-medium text-foreground/50 tabular-nums">{prompt.length}/500</span>
            {prompt.length > 0 && (
              <span className="text-[11px] text-primary/70 flex items-center gap-1">
                <Zap size={8} />{t.studio.ready}
              </span>
            )}
          </div>
        </div>

        {/* Upload — only show when model supports image input */}
        {supportsImageInput && (
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              aria-label={language === 'ar' ? 'رفع صور مرجعية' : 'Upload reference images'}
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={maxImages > 1}
              className="hidden"
              onChange={e => {
                const files = Array.from(e.target.files || []);
                files.forEach(f => handleFileUpload(f));
                e.currentTarget.value = '';
              }}
            />
            {uploadedImages.length > 0 ? (
              <div className="space-y-2">
                <div className={`grid gap-2 ${uploadedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative rounded-xl overflow-hidden border border-primary/20 bg-card/50">
                      <img src={img.preview} alt={`Reference ${i + 1}`} className="w-full h-24 object-cover" />
                      {!img.url && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 min-h-11 min-w-11 rounded-md bg-background/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={language === 'ar' ? `إزالة الصورة ${i + 1}` : `Remove image ${i + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-muted-foreground">
                    {uploadedImages.length}/{maxImages} {language === 'ar' ? 'صور' : 'images'}
                  </span>
                  {uploadedImages.length < maxImages && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-11 rounded-lg px-3 text-[12px] text-primary/70 hover:text-primary font-medium transition-colors"
                    >
                      + {language === 'ar' ? 'إضافة المزيد' : 'Add more'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-2xl bg-foreground/[0.03] border border-dashed border-border/30 p-4 flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground/80 hover:border-primary/20 hover:bg-primary/[0.02] transition-all duration-300 group"
                aria-label={language === 'ar' ? 'رفع صور مرجعية' : 'Upload reference images'}
              >
                <div className="w-9 h-9 rounded-xl bg-foreground/[0.04] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Upload size={16} className="group-hover:text-primary/70 transition-colors" />
                </div>
                <span className="text-[13px] font-medium">{t.studio.uploadImages}</span>
                <span className="text-[11px] text-muted-foreground/60">
                  {maxImages > 1
                    ? `${language === 'ar' ? `حتى ${maxImages} صور` : `Up to ${maxImages} images`} · JPG / PNG`
                    : 'JPG / PNG up to 10MB'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Model / Size / Resolution selectors */}
        {[
          { ref: modelRowRef, key: 'model' as OpenDropdown, icon: <Cpu size={14} />, label: t.studio.model, value: currentModel?.model_name || 'Select' },
          { ref: sizeRowRef, key: 'size' as OpenDropdown, icon: <Maximize size={14} />, label: t.studio.size, value: aspectRatio },
          { ref: resRowRef, key: 'resolution' as OpenDropdown, icon: <ImageIcon size={14} />, label: t.studio.resolution, value: selectedResolution },
        ].map(item => (
          <button
            key={item.key}
            ref={item.ref}
            onClick={() => toggleDropdown(item.key)}
            aria-expanded={openDropdown === item.key}
            aria-haspopup="listbox"
            className={`w-full flex items-center justify-between h-[46px] px-3.5 rounded-xl bg-card/40 border transition-all duration-200 ${
              openDropdown === item.key ? 'border-primary/30 bg-card/60' : 'border-border/20 hover:border-border/30'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-foreground/60">{item.icon}</span>
              <span className="text-[12px] text-foreground/60 uppercase tracking-[0.5px] font-semibold">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[14px] font-semibold text-foreground">{item.value}</span>
              <ChevronRight size={13} className={`text-muted-foreground transition-transform duration-200 ${openDropdown === item.key ? 'rotate-90' : ''}`} />
            </div>
          </button>
        ))}

        {/* Generate button */}
        <div className="pt-2">
          <GenerateButton
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={isGenerating || localGenerating}
            loadingLabel={t.studio.generating}
            credits={cost}
            className="h-[52px]"
          >
            {uploadedImages.length > 0 ? (language === 'ar' ? 'تعديل الصورة' : 'Edit Image') : t.toolPage.generate}
          </GenerateButton>
        </div>
      </div>

      {openDropdown === 'model' && (
        <ModelDropdown
          models={activeModels}
          selectedModelId={selectedModelId}
          allTiers={allTiers}
          language={language}
          anchorRect={getAnchorRect(modelRowRef)}
          onSelect={(id) => { setSelectedModelId(id); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === 'size' && (
        <SizeDropdown
          availableRatios={availableRatios}
          selectedRatio={aspectRatio}
          modelName={currentModel?.model_name}
          anchorRect={getAnchorRect(sizeRowRef)}
          onSelect={(r) => { setAspectRatio(r as AspectRatio); setOpenDropdown(null); }}
          onClose={() => setOpenDropdown(null)}
        />
      )}
      {openDropdown === 'resolution' && (
        <ResolutionDropdown
          tiers={modelQualityTiers}
          allTiers={allTiers}
          currentModelId={currentModel?.id || ''}
          currentModelName={currentModel?.model_name || ''}
          selectedResolution={selectedResolution}
          anchorRect={getAnchorRect(resRowRef)}
          onSelect={handleResolution}
          onClose={() => setOpenDropdown(null)}
          getCreditsForModelQuality={getCreditsForModelQuality}
        />
      )}
    </aside>
  );
}
