import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Upload, ChevronDown, X, Cpu, Maximize, Image as ImageIcon, Wand2, Zap } from 'lucide-react';
import { useApp, AspectRatio } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { usePricing } from '@/hooks/usePricing';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { ModelDropdown } from './dropdowns/ModelDropdown';
import { SizeDropdown } from './dropdowns/SizeDropdown';
import { ResolutionDropdown } from './dropdowns/ResolutionDropdown';
import { useAuth } from '@/context/AuthContext';
import { BackToImageTools } from '@/components/tools/BackToImageTools';
import { GenerateButton } from '@/lib/ux';
import { useReferenceImageUploads } from './useReferenceImageUploads';
import { useStudioGenerationSubmit } from './useStudioGenerationSubmit';
import { cn } from '@/lib/utils';

type OpenDropdown = 'model' | 'size' | 'resolution' | null;

export function CreationPanel({ tabsControl }: { tabsControl?: ReactNode }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { prompt, setPrompt, selectedTemplate, setSelectedTemplate, aspectRatio, setAspectRatio, setQuality, isGenerating, credits, getCreditCost, isAuthenticated, openAuthModal, openUpgradeModal, selectedModelId: contextModelId, setSelectedModelId: setContextModelId } = useApp();
  const { t, lang: language } = useLanguage();
  const { activeModels, defaultModel } = useModels();
  const { getCreditsForModel } = usePricing();
  const { getCreditsForModelQuality, allTiers } = usePricingTiers();

  // Use AppContext's selectedModelId to sync with model detail page navigation
  const [localModelId, setLocalModelId] = useState<string>('');
  const selectedModelId = localModelId || contextModelId || '';
  const setSelectedModelId = useCallback((id: string) => {
    setLocalModelId(id);
    setContextModelId(id);
  }, [setContextModelId]);

  const [selectedResolution, setSelectedResolution] = useState<string>('1K');
  const [openDropdown, setOpenDropdown] = useState<OpenDropdown>(null);
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

  const {
    uploadedImages,
    isUploading,
    pendingUploads,
    fileInputRef,
    handleFileUpload,
    removeImage,
    handleDrop,
  } = useReferenceImageUploads({
    userId: user?.id,
    language,
    maxImages,
    supportsImageInput,
    initialImageUrl: searchParams.get('imageUrl'),
  });

  const {
    canGenerate,
    isGenerationBusy,
    handleGenerate,
  } = useStudioGenerationSubmit({
    prompt,
    selectedTemplate,
    aspectRatio,
    selectedResolution,
    modelId: currentModel?.id,
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
  });

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

  const toggleDropdown = (key: OpenDropdown) => setOpenDropdown(prev => prev === key ? null : key);

  useEffect(() => { const handler = (e: MouseEvent) => { if (openDropdown && panelRef.current && !panelRef.current.contains(e.target as Node)) { const target = e.target as HTMLElement; if (target.closest('[data-dropdown-portal]')) return; setOpenDropdown(null); } }; document.addEventListener('mousedown', handler); return () => document.removeEventListener('mousedown', handler); }, [openDropdown]);

  useEffect(() => { const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenDropdown(null); if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleGenerate(); } }; window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler); }, [handleGenerate]);

  const handleResolution = (r: string) => { setSelectedResolution(r); setQuality(r === '1K' ? 'standard' : 'hd'); setOpenDropdown(null); };

  const getAnchorRect = (ref: React.RefObject<HTMLElement>): DOMRect | null => {
    return ref.current?.getBoundingClientRect() ?? null;
  };

  return (
    <aside
      ref={panelRef}
      className={cn(
        'image-creation-panel relative z-30 flex h-full w-[360px] flex-shrink-0 flex-col overflow-visible rounded-[26px]',
        'xl:w-[390px] 2xl:w-[410px]'
      )}
    >
      <div className="flex-1 space-y-2.5 overflow-y-auto overflow-x-visible px-4 pb-3 pt-3.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:px-5 xl:pb-4">
        <BackToImageTools className="mb-0 text-neutral-600 dark:text-white/58" />

        <div className="space-y-2.5 text-start">
          <div>
            <h1 className="text-[25px] font-black leading-none tracking-tight">
              {language === 'ar' ? 'إنشاء صورة' : 'Create Image'}
            </h1>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted-foreground">
              {language === 'ar' ? 'حوّل الوصف إلى صورة جاهزة للإنتاج.' : 'Turn a prompt into a production-ready image.'}
            </p>
          </div>
          {tabsControl}
        </div>

        {/* Prompt */}
        <div className="image-control-surface rounded-2xl p-3 transition-colors">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wand2 size={12} className="text-primary" />
              </div>
              <label htmlFor="studio-prompt" className="text-[13px] font-bold">{t.studio.prompt}</label>
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
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            onChange={e => setPrompt(e.target.value.slice(0, 1000))}
            placeholder={t.studio.describeCreate}
            className="image-prompt-input w-full min-h-[104px] resize-none rounded-[16px] p-3 text-start text-[14px] font-medium leading-relaxed transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 xl:min-h-[116px]"
          />
          <div className="flex items-center justify-between mt-1.5 px-0.5">
            <span className="text-[12px] font-medium text-muted-foreground tabular-nums" dir="ltr">{prompt.length}/1000</span>
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
                const files = Array.from(e.target.files || []).slice(0, Math.max(0, maxImages - uploadedImages.length));
                files.forEach(f => handleFileUpload(f));
                e.currentTarget.value = '';
              }}
            />
            {uploadedImages.length > 0 ? (
              <div className="space-y-2">
                <div className="flex max-w-full gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative h-16 w-16 flex-none overflow-hidden rounded-xl border border-primary/20 bg-card/50">
                      <img src={img.preview} alt={`Reference ${i + 1}`} className="h-full w-full object-cover" />
                      {!img.url && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        </div>
                      )}
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute end-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-md bg-background/80 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
                        aria-label={language === 'ar' ? `إزالة الصورة ${i + 1}` : `Remove image ${i + 1}`}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {uploadedImages.length < maxImages && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-16 w-16 flex-none rounded-xl border border-dashed border-border/30 bg-foreground/[0.03] text-muted-foreground transition-all hover:border-primary/20 hover:bg-primary/[0.03] hover:text-primary"
                      aria-label={language === 'ar' ? 'إضافة صورة مرجعية' : 'Add reference image'}
                    >
                      <Upload size={16} className="mx-auto" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] text-muted-foreground">
                    {uploadedImages.length}/{maxImages} {language === 'ar' ? 'صور' : 'images'}
                  </span>
                  <span className="text-[11px] text-muted-foreground/60">
                    {language === 'ar' ? 'JPG / PNG حتى 10MB' : 'JPG / PNG up to 10MB'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="image-upload-surface group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl p-3.5 text-muted-foreground transition-all duration-300 hover:text-foreground/80 active:scale-[0.985] lg:min-h-[96px]"
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
            className={`image-control-row w-full flex items-center justify-between gap-3 h-[44px] px-3.5 rounded-2xl transition-all duration-200 active:scale-[0.985] ${
              openDropdown === item.key ? 'is-open' : ''
            }`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="truncate text-start text-[11px] font-bold uppercase tracking-[0.5px] text-muted-foreground">{item.label}</span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-end text-[13px] font-bold" dir={item.key === 'model' ? 'ltr' : undefined}>{item.value}</span>
              <ChevronDown size={13} className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${openDropdown === item.key ? 'rotate-180' : ''}`} />
            </div>
          </button>
        ))}
      </div>

      {/* Generate button */}
      <div className="image-generate-footer flex-shrink-0 px-4 py-3.5 backdrop-blur xl:px-5">
        <GenerateButton
          onClick={handleGenerate}
          disabled={!canGenerate}
          loading={isGenerationBusy}
          loadingLabel={t.studio.generating}
          credits={cost}
          className="h-[52px] rounded-[18px] bg-[#FF3B1F] text-[15px] text-white shadow-[0_18px_42px_-18px_rgba(255,59,31,0.75)] hover:bg-[#FF4A2B] focus-visible:ring-[#FF3B1F]/35"
        >
          {uploadedImages.length > 0 ? (language === 'ar' ? 'تعديل الصورة' : 'Edit Image') : t.toolPage.generate}
        </GenerateButton>
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
