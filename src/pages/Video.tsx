import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Play, Film, Clock, MonitorSmartphone, ChevronRight, Image, Sparkles, Search, Check, Download, Diamond, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { useAuth } from '@/context/AuthContext';
import { useGenerationJobs } from '@/hooks/useGenerationJobs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
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
  const [activeTab, setActiveTab] = useState<'how' | 'history'>('how');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelRowRef = useRef<HTMLButtonElement>(null);

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

  /* ─── Drop-up Selector Pill ─── */
  const SelectorPill = ({ icon: Icon, label, value, options, onSelect }: {
    icon: React.ElementType; label: string; value: string; options: string[]; onSelect: (v: string) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all",
            "bg-card hover:bg-accent/60 text-foreground",
            open && "ring-1 ring-primary/40"
          )}
        >
          <Icon size={13} className="text-muted-foreground" />
          {value}
          <ChevronDown size={12} className={cn("text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute bottom-full left-0 mb-2 w-40 rounded-xl bg-popover/98 backdrop-blur-xl shadow-xl shadow-black/10 dark:shadow-black/40 p-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onSelect(opt); setOpen(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                  opt === value
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/80 hover:bg-accent/60"
                )}
              >
                {opt}
                {opt === value && <Check size={13} className="text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  /* ─── Creation Panel Content (shared between desktop left panel & mobile sheet) ─── */
  const CreationControls = () => (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-4 p-5">
        {/* 1. Model Selector Card — entire card clickable */}
        <div>
          <button
            onClick={() => setShowModelPicker(true)}
            className={cn(
              "w-full rounded-xl overflow-hidden relative group cursor-pointer transition-all",
              "ring-1 ring-transparent hover:ring-primary/40"
            )}
          >
            <div className="aspect-video relative overflow-hidden">
              {currentModel?.preview_image_url ? (
                <img src={currentModel.preview_image_url} alt={currentModel.model_name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-card flex items-center justify-center">
                  <Film size={28} className="text-primary/40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <p className="text-[14px] font-bold text-white drop-shadow-sm">{currentModel?.model_name}</p>
                <span className="text-[10px] font-semibold text-white/70 bg-white/10 backdrop-blur-sm rounded-md px-2 py-0.5">
                  {isAr ? 'تغيير' : 'Change'}
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* 2. Start frame + End frame */}
        {currentModel?.supports_image_to_video && (
          <div className="grid grid-cols-2 gap-3">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center py-6 gap-2 transition-all",
                isDragging ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card hover:bg-accent/40",
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
                  <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
                    <Image size={16} className="text-muted-foreground/40" />
                  </div>
                  <span className="text-[12px] text-muted-foreground/60 font-medium">
                    {isAr ? 'إطار البداية' : 'Start frame'}
                  </span>
                </>
              )}
            </div>
            <div className="rounded-xl border-2 border-dashed border-border/40 bg-card flex flex-col items-center justify-center py-6 gap-2 opacity-40 cursor-not-allowed">
              <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
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
        <div className="rounded-xl bg-card overflow-hidden focus-within:ring-1 focus-within:ring-primary/30 transition-shadow">
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={isAr ? 'صف الفيديو الذي تريده، مثل "امرأة تمشي في مدينة مضاءة بالنيون"...' : 'Describe your video, like "A woman walking through a neon-lit city"...'}
            rows={4}
            className="w-full bg-transparent p-4 text-[14px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* 4. Model info row */}
        <button
          ref={modelRowRef}
          onClick={() => setShowModelPicker(true)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card hover:bg-accent/40 transition-colors group"
        >
          <div>
            <p className="text-[11px] text-muted-foreground font-medium">{isAr ? 'النموذج' : 'Model'}</p>
            <p className="text-[14px] font-bold text-foreground mt-0.5">{currentModel?.model_name}</p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>

        {/* 5. Settings row — 3 drop-up pill selectors */}
        <div className="flex items-center gap-2 flex-wrap">
          <SelectorPill
            icon={Clock}
            label={isAr ? 'المدة' : 'Duration'}
            value={selectedDuration}
            options={currentModel?.supported_durations || []}
            onSelect={setSelectedDuration}
          />
          <SelectorPill
            icon={MonitorSmartphone}
            label={isAr ? 'النسبة' : 'Ratio'}
            value={selectedRatio}
            options={currentModel?.supported_ratios || []}
            onSelect={setSelectedRatio}
          />
          <SelectorPill
            icon={Diamond}
            label={isAr ? 'الجودة' : 'Quality'}
            value={selectedQuality}
            options={currentModel?.supported_qualities || []}
            onSelect={setSelectedQuality}
          />
        </div>
      </div>

      {/* 6. Generate button — sticky at bottom */}
      <div className="p-5 pt-4">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || isUploading}
          className={cn(
            "w-full h-[52px] rounded-xl text-[16px] font-bold flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]",
            (!prompt.trim() || isUploading)
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20 hover:shadow-primary/30"
          )}
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
          ) : (
            <>
              {isAr ? 'توليد' : 'Generate'}
              <span className="flex items-center gap-1 text-[13px] font-semibold opacity-90">
                ✦ {creditCost}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  /* ─── How It Works State ─── */
  const HowItWorksState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl w-full mb-10">
        {[
          { step: '01', icon: Film, title: isAr ? 'اختر النموذج' : 'Choose your model', desc: isAr ? 'اختر محرك الفيديو المناسب' : 'Select the right video engine' },
          { step: '02', icon: Sparkles, title: isAr ? 'صف رؤيتك' : 'Describe your vision', desc: isAr ? 'اكتب وصفاً للفيديو الذي تريده' : 'Write a prompt for your video' },
          { step: '03', icon: Download, title: isAr ? 'أنشئ وحمّل' : 'Generate & download', desc: isAr ? 'شاهد النتيجة وحمّلها' : 'Watch your result and save it' },
        ].map(({ step, icon: Icon, title, desc }) => (
          <div
            key={step}
            className="relative rounded-2xl bg-card/80 backdrop-blur p-8 text-center transition-all group overflow-hidden hover:shadow-lg hover:shadow-primary/5"
          >
            <p className="absolute top-3 left-4 text-5xl font-black text-primary/10 select-none">{step}</p>
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 mt-4">
              <Icon size={22} className="text-primary" />
            </div>
            <p className="text-[14px] font-bold text-foreground mb-1.5">{title}</p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-muted-foreground/60">
        {isAr ? 'الفيديوهات التي تنشئها ستظهر هنا' : 'Your generated videos will appear here'}
      </p>
    </div>
  );

  /* ─── Empty History State ─── */
  const EmptyHistoryState = () => (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
      <h2 className="text-4xl font-bold text-muted-foreground/30 mb-2">
        {isAr ? 'أنشئ أول فيديو' : 'Generate your first video'}
      </h2>
      <p className="text-muted-foreground/50">
        {isAr ? 'إبداعاتك ستظهر هنا' : 'Your creations will appear here'}
      </p>
    </div>
  );

  /* ════════════════════════════════════════════ */
  /* ─── MOBILE LAYOUT ─── */
  /* ════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        <div className="flex-1 overflow-y-auto">
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
          <HowItWorksState />
        </div>

        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-40 pointer-events-none">
          <button
            onClick={() => setMobileCreateOpen(true)}
            className="pointer-events-auto flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-[14px] shadow-2xl shadow-primary/30 active:scale-95 transition-transform"
          >
            <Play size={16} className="fill-current" />
            {isAr ? 'إنشاء فيديو' : 'Create Video'}
          </button>
        </div>

        <Sheet open={mobileCreateOpen} onOpenChange={setMobileCreateOpen}>
          <SheetContent side="bottom" className="h-[92vh] rounded-t-2xl p-0 border-t border-border/30">
            <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mt-3 mb-1" />
            <CreationControls />
          </SheetContent>
        </Sheet>

        <ModelPickerDropdown
          open={showModelPicker}
          onOpenChange={setShowModelPicker}
          models={filteredModels}
          selectedModelId={selectedModelId}
          onSelect={(id) => { setSelectedModelId(id); setShowModelPicker(false); setModelSearch(''); }}
          search={modelSearch}
          onSearchChange={setModelSearch}
          isAr={isAr}
          anchorRef={modelRowRef}
          isMobile
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
      <aside className="w-[280px] flex-shrink-0 bg-popover/95 backdrop-blur-xl h-[calc(100vh-3.5rem-var(--banner-h,0px))] sticky top-[calc(3.5rem+var(--banner-h,0px))] overflow-hidden flex flex-col shadow-[2px_0_16px_-4px_rgba(0,0,0,0.08)] dark:shadow-[2px_0_20px_-4px_rgba(0,0,0,0.25)]">
        <CreationControls />
      </aside>

      {/* CENTER PANEL */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="flex items-center justify-between px-6 pt-4 pb-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors",
                activeTab === 'history' ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAr ? 'السجل' : 'History'}
            </button>
            <button
              onClick={() => setActiveTab('how')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-colors",
                activeTab === 'how' ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isAr ? 'كيف يعمل' : 'How it works'}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'how' ? <HowItWorksState /> : <EmptyHistoryState />}
        </div>
      </main>

      {/* Model Picker — floating dropdown */}
      <ModelPickerDropdown
        open={showModelPicker}
        onOpenChange={setShowModelPicker}
        models={filteredModels}
        selectedModelId={selectedModelId}
        onSelect={(id) => { setSelectedModelId(id); setShowModelPicker(false); setModelSearch(''); }}
        search={modelSearch}
        onSearchChange={setModelSearch}
        isAr={isAr}
        anchorRef={modelRowRef}
      />
    </div>
  );
}

/* ─── Model Picker Floating Dropdown ─── */
function ModelPickerDropdown({ open, onOpenChange, models, selectedModelId, onSelect, search, onSearchChange, isAr, anchorRef, isMobile }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  models: VideoModel[];
  selectedModelId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  isAr: boolean;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  isMobile?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onOpenChange(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  // Autofocus search
  useEffect(() => {
    if (open) setTimeout(() => searchInputRef.current?.focus(), 50);
  }, [open]);

  if (!open) return null;

  // For mobile, render as a sheet-like overlay
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/40" onClick={() => onOpenChange(false)} />
        <div ref={panelRef} className="absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-2xl bg-popover border-t border-border/40 flex flex-col animate-in slide-in-from-bottom duration-200">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20 mx-auto mt-3 mb-2" />
          <PickerContent
            ref={searchInputRef}
            models={models}
            selectedModelId={selectedModelId}
            onSelect={onSelect}
            search={search}
            onSearchChange={onSearchChange}
            isAr={isAr}
          />
        </div>
      </div>
    );
  }

  // Desktop — floating panel anchored right of left panel
  return (
    <div className="fixed inset-0 z-50" onClick={() => onOpenChange(false)}>
      <div
        ref={panelRef}
        onClick={e => e.stopPropagation()}
        className="absolute left-[280px] top-[calc(3.5rem+var(--banner-h,0px)+8px)] w-[320px] max-h-[min(520px,calc(100vh-6rem))] rounded-xl bg-popover/98 backdrop-blur-xl shadow-2xl shadow-black/15 dark:shadow-black/40 flex flex-col animate-in fade-in slide-in-from-left-2 duration-200"
        style={isAr ? { left: 'auto', right: '280px' } : undefined}
      >
        <PickerContent
          ref={searchInputRef}
          models={models}
          selectedModelId={selectedModelId}
          onSelect={onSelect}
          search={search}
          onSearchChange={onSearchChange}
          isAr={isAr}
        />
      </div>
    </div>
  );
}

/* ─── Shared picker content ─── */
const PickerContent = ({ ref, models, selectedModelId, onSelect, search, onSearchChange, isAr }: {
  ref: React.RefObject<HTMLInputElement | null>;
  models: VideoModel[];
  selectedModelId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  isAr: boolean;
}) => (
  <>
    {/* Search */}
    <div className="p-3 pb-2">
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-card/80">
        <Search size={14} className="text-muted-foreground/50 flex-shrink-0" />
        <input
          ref={ref}
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder={isAr ? 'بحث عن نموذج...' : 'Search models...'}
          className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />
      </div>
    </div>

    {/* Header */}
    <div className="px-4 pt-3 pb-1.5">
      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
        <Sparkles size={10} /> {isAr ? 'النماذج المتاحة' : 'Available models'}
      </p>
    </div>

    {/* List */}
    <div className="overflow-y-auto flex-1 px-2 pb-3 space-y-0.5">
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
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-start",
              isSelected
                ? "bg-primary/10"
                : "hover:bg-accent/60"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
              isSelected ? "bg-primary/15" : "bg-muted/50"
            )}>
              {model.preview_image_url ? (
                <img src={model.preview_image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Film size={15} className={isSelected ? "text-primary" : "text-muted-foreground"} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-foreground truncate">{model.model_name}</span>
                {model.supports_image_to_video && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-bold flex-shrink-0">I2V</span>
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
              <Check size={15} className="text-primary flex-shrink-0" />
            )}
          </button>
        );
      })}
      {models.length === 0 && (
        <p className="text-center text-[12px] text-muted-foreground/50 py-6">
          {isAr ? 'لا توجد نتائج' : 'No models found'}
        </p>
      )}
    </div>
  </>
);
