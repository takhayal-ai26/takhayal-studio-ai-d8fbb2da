import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Coins, Play, Film, Clock, MonitorSmartphone, ChevronRight, Image, Sparkles, Pencil, Search, Check, Info, LayoutGrid, List, Download, Diamond, ImageIcon } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/* ─── Types ─── */
interface VideoModel {
  id: string;
  model_name: string;
  endpoint_id: string;
  supported_ratios: string[];
  supported_durations: string[];
  supported_qualities: string[];
  text_to_video_endpoint: string | null;
  image_to_video_endpoint: string | null;
  supports_image_to_video: boolean;
  is_default: boolean;
  speed: string | null;
  best_for: string | null;
  best_for_ar: string | null;
  cost_per_run: number | null;
  preview_image_url: string;
}

interface VideoTier {
  id: string;
  model_id: string;
  quality_level: string;
  duration: string;
  credits_charged: number;
  cost_per_run: number;
  is_available: boolean;
  is_default: boolean;
  tier_label: string;
}

/* ─── Component ─── */
export default function Video() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { credits, isAuthenticated, openAuthModal, openUpgradeModal } = useApp();
  const { lang } = useLanguage();
  const { models } = useModels();
  const { submitVideoJob } = useGenerationJobs();
  const isMobile = useIsMobile();
  const isAr = lang === 'ar';

  const videoModels = useMemo(() =>
    models.filter((m: any) => m.media_type === 'video' && m.is_active).map((m: any): VideoModel => ({
      id: m.id, model_name: m.model_name, endpoint_id: m.endpoint_id,
      supported_ratios: Array.isArray(m.supported_ratios) ? m.supported_ratios : [],
      supported_durations: Array.isArray(m.supported_durations) ? m.supported_durations : [],
      supported_qualities: Array.isArray(m.supported_qualities) ? m.supported_qualities : [],
      text_to_video_endpoint: m.text_to_video_endpoint || null,
      image_to_video_endpoint: m.image_to_video_endpoint || null,
      supports_image_to_video: m.supports_image_to_video || false,
      is_default: m.is_default, speed: m.speed, best_for: m.best_for,
      best_for_ar: m.best_for_ar, cost_per_run: m.cost_per_run ? Number(m.cost_per_run) : null,
      preview_image_url: m.preview_image_url || '',
    }))
  , [models]);

  const [selectedModelId, setSelectedModelId] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState('16:9');
  const [selectedDuration, setSelectedDuration] = useState('5s');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [uploadedImage, setUploadedImage] = useState<{ preview: string; url: string | null } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tiers, setTiers] = useState<VideoTier[]>([]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [mobileCreateOpen, setMobileCreateOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-select default model
  useEffect(() => {
    if (videoModels.length > 0 && !selectedModelId) {
      const def = videoModels.find(m => m.is_default) || videoModels[0];
      setSelectedModelId(def.id);
    }
  }, [videoModels, selectedModelId]);

  const currentModel = videoModels.find(m => m.id === selectedModelId) || videoModels[0];

  // Fetch pricing tiers
  useEffect(() => {
    if (!currentModel) return;
    supabase.from('model_pricing_tiers').select('*')
      .eq('model_id', currentModel.id).eq('is_available', true).eq('is_active', true)
      .then(({ data }) => {
        if (data) setTiers(data.map((d: any) => ({
          id: d.id, model_id: d.model_id, quality_level: d.quality_level || '',
          duration: d.duration || '', credits_charged: d.credits_charged,
          cost_per_run: Number(d.cost_per_run), is_available: d.is_available,
          is_default: d.is_default, tier_label: d.tier_label,
        })));
      });
  }, [currentModel?.id]);

  // Auto-select valid options when model changes
  useEffect(() => {
    if (!currentModel) return;
    if (!currentModel.supported_ratios.includes(selectedRatio))
      setSelectedRatio(currentModel.supported_ratios[0] || '16:9');
    if (!currentModel.supported_durations.includes(selectedDuration))
      setSelectedDuration(currentModel.supported_durations[0] || '5s');
    if (!currentModel.supported_qualities.includes(selectedQuality))
      setSelectedQuality(currentModel.supported_qualities[0] || '720p');
    if (!currentModel.supports_image_to_video) setUploadedImage(null);
  }, [currentModel]);

  const matchedTier = useMemo(() =>
    tiers.find(t => t.quality_level === selectedQuality && t.duration === selectedDuration) ||
    tiers.find(t => t.is_default) || tiers[0]
  , [tiers, selectedQuality, selectedDuration]);

  const creditCost = matchedTier?.credits_charged ?? 10;

  // Upload handler
  const handleUpload = useCallback(async (file: File) => {
    if (!user) return;
    setIsUploading(true);
    const preview = URL.createObjectURL(file);
    setUploadedImage({ preview, url: null });
    const path = `${user.id}/video-input-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('tool-files').upload(path, file);
    if (error) {
      toast.error(isAr ? 'فشل رفع الصورة' : 'Upload failed');
      setUploadedImage(null);
    } else {
      const { data: { publicUrl } } = supabase.storage.from('tool-files').getPublicUrl(path);
      setUploadedImage({ preview, url: publicUrl });
    }
    setIsUploading(false);
  }, [user, isAr]);

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) handleUpload(file);
  }, [handleUpload]);

  // Generate
  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error(isAr ? 'يرجى إدخال وصف' : 'Please enter a prompt'); return; }
    if (!isAuthenticated) { openAuthModal('signup'); return; }
    if (credits < creditCost) { openUpgradeModal(); return; }
    if (!currentModel) return;
    setIsGenerating(true);
    try {
      const jobId = await submitVideoJob({
        prompt: prompt.trim(), ratio: selectedRatio, quality: selectedQuality,
        duration: selectedDuration, modelId: currentModel.id, creditCost,
        imageUrl: uploadedImage?.url || undefined,
      });
      if (jobId) { setMobileCreateOpen(false); navigate(`/gallery?highlight=${jobId}`); }
    } catch {
      toast.error(isAr ? 'فشل في بدء التوليد' : 'Failed to start generation');
    }
    setIsGenerating(false);
  };

  /* ─── Empty state ─── */
  if (videoModels.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="text-center">
          <Film size={48} className="mx-auto text-muted-foreground/20 mb-4" />
          <h2 className="text-lg font-bold text-foreground">{isAr ? 'قريباً' : 'Coming Soon'}</h2>
          <p className="text-sm text-muted-foreground mt-1">{isAr ? 'نعمل على تجهيز توليد الفيديو' : 'Video generation is being prepared'}</p>
        </div>
      </div>
    );
  }

  const filteredModels = videoModels.filter(m =>
    !modelSearch || m.model_name.toLowerCase().includes(modelSearch.toLowerCase())
  );

  const durationRange = currentModel ? (
    currentModel.supported_durations.length > 1
      ? `${currentModel.supported_durations[0]}–${currentModel.supported_durations[currentModel.supported_durations.length - 1]}`
      : currentModel.supported_durations[0] || ''
  ) : '';

  const maxQuality = currentModel?.supported_qualities[currentModel.supported_qualities.length - 1] || '';

  /* ─── Selector Pill with Popover ─── */
  const SelectorPill = ({ icon: Icon, value, options, onSelect }: {
    icon: React.ElementType; value: string; options: string[]; onSelect: (v: string) => void;
  }) => (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700/80 border border-zinc-700/40 transition-all text-[13px] font-semibold text-foreground dark:text-white">
          <Icon size={14} className="text-muted-foreground" />
          {value}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1.5 rounded-xl border border-zinc-700/40 bg-zinc-900/95 backdrop-blur-xl" align="start" sideOffset={6}>
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={cn(
              "w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-colors",
              opt === value
                ? "bg-zinc-800 text-[#F03E1B]"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-foreground"
            )}
          >
            {opt}
            {opt === value && <Check size={14} className="text-[#F03E1B]" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );

  /* ─── Creation Panel Content (shared between desktop left panel & mobile sheet) ─── */
  const CreationControls = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-5 p-5">
        {/* 1. Model Selector Card — entire card clickable */}
        <div>
          <button
            onClick={() => setShowModelPicker(true)}
            className="w-full rounded-xl overflow-hidden relative group cursor-pointer transition-all hover:brightness-110"
            style={{ boxShadow: 'none' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 0 1px rgba(240,62,27,0.4)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            {/* Thumbnail area */}
            <div className="aspect-video relative overflow-hidden">
              {currentModel?.preview_image_url ? (
                <img src={currentModel.preview_image_url} alt={currentModel.model_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                  <span className="text-[#F03E1B] font-bold text-lg">{currentModel?.model_name}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-[14px] font-bold text-white">{currentModel?.model_name}</p>
              </div>
            </div>
          </button>
        </div>

        {/* 2. Start frame + End frame */}
        {currentModel?.supports_image_to_video && (
          <div className="grid grid-cols-2 gap-3">
            {/* Start frame */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-6 gap-2 transition-all",
                isDragging ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card hover:bg-accent/30",
                uploadedImage && "border-0 p-0"
              )}
            >
              {uploadedImage ? (
                <>
                  <img src={uploadedImage.preview} alt="" className="w-full h-full object-cover rounded-xl aspect-[4/3]" />
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadedImage(null); }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white"
                  >
                    <X size={10} />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-[10px] text-muted-foreground/50 font-medium absolute top-2 left-0 right-0 text-center">
                    {isAr ? 'اختياري' : 'Optional'}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                    <Image size={16} className="text-muted-foreground/40" />
                  </div>
                  <span className="text-[12px] text-muted-foreground/60 font-medium">
                    {isAr ? 'إطار البداية' : 'Start frame'}
                  </span>
                </>
              )}
            </div>
            {/* End frame (placeholder for future) */}
            <div className="rounded-xl border-2 border-dashed border-border/50 bg-card flex flex-col items-center justify-center py-6 gap-2 opacity-50 cursor-not-allowed">
              <span className="text-[10px] text-muted-foreground/50 font-medium absolute-ish">
                {isAr ? 'اختياري' : 'Optional'}
              </span>
              <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
                <Image size={16} className="text-muted-foreground/40" />
              </div>
              <span className="text-[12px] text-muted-foreground/60 font-medium">
                {isAr ? 'إطار النهاية' : 'End frame'}
              </span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
          </div>
        )}

        {!currentModel?.supports_image_to_video && (
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
        )}

        {/* 3. Prompt area */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={isAr ? 'صف الفيديو الذي تريده، مثل "امرأة تمشي في مدينة مضاءة بالنيون"...' : 'Describe your video, like "A woman walking through a neon-lit city". Add elements using @'}
            rows={4}
            className="w-full bg-transparent p-4 text-[14px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* 4. Model info row */}
        <button
          onClick={() => setShowModelPicker(true)}
          className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-card border border-border/50 hover:bg-accent/30 transition-colors"
        >
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'النموذج' : 'Model'}</p>
            <p className="text-[14px] font-bold text-foreground mt-0.5">{currentModel?.model_name}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* 5. Settings row — 3 pill selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <SelectorPill
            icon={Clock}
            value={selectedDuration}
            options={currentModel?.supported_durations || []}
            onSelect={setSelectedDuration}
          />
          <SelectorPill
            icon={MonitorSmartphone}
            value={selectedRatio}
            options={currentModel?.supported_ratios || []}
            onSelect={setSelectedRatio}
          />
          <SelectorPill
            icon={Diamond}
            value={selectedQuality}
            options={currentModel?.supported_qualities || []}
            onSelect={setSelectedQuality}
          />
        </div>
      </div>

      {/* 6. Generate button — sticky at bottom */}
      <div className="p-5 pt-3 border-t border-border/30">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || isUploading}
          className="w-full h-13 rounded-xl bg-primary text-primary-foreground text-[15px] font-bold flex items-center justify-center gap-2.5 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              {isAr ? 'توليد' : 'Generate'}
              <span className="flex items-center gap-1 text-[13px] font-semibold">
                ✦ {creditCost}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  /* ─── Empty State for Center ─── */
  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl w-full mb-10">
        {[
          { step: '01', icon: Film, title: isAr ? 'اختر النموذج' : 'Choose your model', desc: isAr ? 'اختر محرك الفيديو المناسب' : 'Select the right video engine' },
          { step: '02', icon: Sparkles, title: isAr ? 'صف رؤيتك' : 'Describe your vision', desc: isAr ? 'اكتب وصفاً للفيديو الذي تريده' : 'Write a prompt for your video' },
          { step: '03', icon: Download, title: isAr ? 'أنشئ وحمّل' : 'Generate & download', desc: isAr ? 'شاهد النتيجة وحمّلها' : 'Watch your result and save it' },
        ].map(({ step, icon: Icon, title, desc }) => (
          <div key={step} className="rounded-xl bg-card/50 backdrop-blur border border-border/30 p-5 text-center">
            <p className="text-2xl font-black text-primary/25 mb-3">{step}</p>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Icon size={18} className="text-primary/60" />
            </div>
            <p className="text-[13px] font-bold text-foreground mb-1">{title}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-muted-foreground/40">
        {isAr ? 'الفيديوهات التي تنشئها ستظهر هنا' : 'Your generated videos will appear here'}
      </p>
    </div>
  );

  /* ─── Right Panel (metadata) ─── */
  const RightPanel = () => (
    <div className="flex flex-col items-center justify-center h-full px-5">
      <p className="text-[13px] text-muted-foreground/40 text-center">
        {isAr ? 'اختر فيديو لمشاهدة التفاصيل' : 'Select a video to see details'}
      </p>
    </div>
  );

  /* ════════════════════════════════════════════ */
  /* ─── MOBILE LAYOUT ─── */
  /* ════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        {/* Center content */}
        <div className="flex-1 overflow-y-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
            <div className="flex items-center gap-1">
              <button className="px-3 py-1.5 rounded-lg text-[13px] font-semibold bg-accent text-foreground">
                {isAr ? 'السجل' : 'History'}
              </button>
              <button className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
                {isAr ? 'كيف يعمل' : 'How it works'}
              </button>
            </div>
          </div>
          <EmptyState />
        </div>

        {/* Floating create button */}
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <button
            onClick={() => setMobileCreateOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-[14px] shadow-2xl shadow-primary/30 active:scale-95 transition-transform"
          >
            <Play size={16} className="fill-current" />
            {isAr ? 'إنشاء فيديو' : 'Create Video'}
          </button>
        </div>

        {/* Mobile creation sheet */}
        <Sheet open={mobileCreateOpen} onOpenChange={setMobileCreateOpen}>
          <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 border-t border-border/30">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mt-3 mb-1" />
            <CreationControls />
          </SheetContent>
        </Sheet>

        {/* Model Picker Sheet */}
        <ModelPickerSheet
          open={showModelPicker}
          onOpenChange={setShowModelPicker}
          models={filteredModels}
          selectedModelId={selectedModelId}
          onSelect={(id) => { setSelectedModelId(id); setShowModelPicker(false); }}
          search={modelSearch}
          onSearchChange={setModelSearch}
          isAr={isAr}
        />
      </div>
    );
  }

  /* ════════════════════════════════════════════ */
  /* ─── DESKTOP LAYOUT ─── */
  /* ════════════════════════════════════════════ */
  return (
    <div className="flex-1 flex" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      {/* LEFT PANEL */}
      <aside className="w-[280px] flex-shrink-0 border-e border-border/30 bg-background/95 backdrop-blur-xl h-[calc(100vh-3.5rem-var(--banner-h,0px))] sticky top-[calc(3.5rem+var(--banner-h,0px))] overflow-hidden flex flex-col">
        <CreationControls />
      </aside>

      {/* CENTER PANEL */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
          <div className="flex items-center gap-1">
            <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold bg-accent text-foreground">
              {isAr ? 'السجل' : 'History'}
            </button>
            <button className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              {isAr ? 'كيف يعمل' : 'How it works'}
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
              <LayoutGrid size={15} className="text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-accent transition-colors">
              <List size={15} className="text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <EmptyState />
        </div>
      </main>

      {/* RIGHT PANEL */}
      <aside className="w-[260px] flex-shrink-0 border-s border-border/30 bg-background/95 backdrop-blur-xl h-[calc(100vh-3.5rem-var(--banner-h,0px))] sticky top-[calc(3.5rem+var(--banner-h,0px))]">
        <RightPanel />
      </aside>

      {/* Model Picker Sheet */}
      <ModelPickerSheet
        open={showModelPicker}
        onOpenChange={setShowModelPicker}
        models={filteredModels}
        selectedModelId={selectedModelId}
        onSelect={(id) => { setSelectedModelId(id); setShowModelPicker(false); }}
        search={modelSearch}
        onSearchChange={setModelSearch}
        isAr={isAr}
      />
    </div>
  );
}

/* ─── Model Picker Sheet ─── */
function ModelPickerSheet({ open, onOpenChange, models, selectedModelId, onSelect, search, onSearchChange, isAr }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  models: VideoModel[];
  selectedModelId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  isAr: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] max-w-full p-0 border-s border-border/30 bg-popover/95 backdrop-blur-xl">
        {/* Search */}
        <div className="p-4 border-b border-border/30">
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-card border border-border/50">
            <Search size={15} className="text-muted-foreground/50 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              placeholder={isAr ? 'بحث...' : 'Search...'}
              className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Featured models */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={11} /> {isAr ? 'نماذج مميزة' : 'Featured models'}
          </p>
        </div>

        <div className="overflow-y-auto flex-1 px-3 pb-6 space-y-1">
          {models.map(model => {
            const isSelected = model.id === selectedModelId;
            const maxQ = model.supported_qualities[model.supported_qualities.length - 1] || '';
            const durRange = model.supported_durations.length > 1
              ? `${model.supported_durations[0]}–${model.supported_durations[model.supported_durations.length - 1]}`
              : model.supported_durations[0] || '';

            return (
              <button
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={cn(
                  "w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all text-start",
                  isSelected
                    ? "bg-accent"
                    : "hover:bg-accent/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  isSelected ? "bg-primary/15" : "bg-muted/50"
                )}>
                  <Film size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-foreground truncate">{model.model_name}</span>
                    {model.supports_image_to_video && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[hsl(75,80%,50%)] text-black font-bold flex-shrink-0">I2V</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {maxQ && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Diamond size={9} /> {maxQ}
                      </span>
                    )}
                    {durRange && (
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock size={9} /> {durRange}
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <Check size={16} className="text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
