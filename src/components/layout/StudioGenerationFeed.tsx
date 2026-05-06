import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowUpCircle, Copy, Download, Film, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { useGenerationJobs, type GenerationJob } from '@/hooks/useGenerationJobs';
import { useLanguage } from '@/i18n/LanguageContext';
import { generationHandoffUrl } from '@/lib/ux';
import { localizePath } from '@/lib/localized-routes';
import { toast } from '@/hooks/use-toast';

function ratioToCSS(ratio?: string | null): string {
  const map: Record<string, string> = {
    '1:1': '1/1',
    '16:9': '16/9',
    '9:16': '9/16',
    '4:5': '4/5',
    '4:3': '4/3',
    '3:2': '3/2',
    '3:4': '3/4',
    '2:3': '2/3',
  };

  return map[ratio || '1:1'] || '1/1';
}

function isImageStudioJob(job: GenerationJob) {
  return (job.media_type || 'image') !== 'video' && (!job.tool_id || job.tool_id === 'studio');
}

function downloadImage(url: string, prompt: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `${prompt.slice(0, 30).replace(/\s+/g, '-') || 'takhayal-image'}.png`;
  a.target = '_blank';
  a.click();
}

function handoff(path: string, imageUrl: string, jobId: string, modelId?: string | null) {
  window.location.assign(generationHandoffUrl(path, imageUrl, { sourceJobId: jobId, modelId: modelId || undefined }));
}

function hasGeneratedImage(job: GenerationJob) {
  return !!job.image_url && job.image_url.length > 5;
}

function StudioJobCard({
  job,
  onRetry,
  onOpen,
  featured = false,
}: {
  job: GenerationJob;
  onRetry: (id: string) => void;
  onOpen: (job: GenerationJob) => void;
  featured?: boolean;
}) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const cssRatio = ratioToCSS(job.ratio);
  const hasImage = hasGeneratedImage(job);
  const isProcessing = job.status === 'queued' || job.status === 'generating' || job.status === 'processing' || (job.status === 'completed' && !hasImage);
  const isFailed = job.status === 'failed' && !hasImage;
  const cardSizeClass = featured ? 'w-full max-w-[388px]' : 'w-full';
  const cardStyle = { aspectRatio: featured ? '1/1' : cssRatio };

  if (isProcessing) {
    return (
      <div className={`gen-card-processing rounded-2xl overflow-hidden bg-card/60 border border-border/10 relative ${cardSizeClass}`} style={cardStyle}>
        <div className="absolute inset-0 gen-shimmer" />
        <div className="absolute inset-0 gen-glow" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className={`${featured ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center`}>
            <Loader2 size={featured ? 20 : 18} className="text-primary animate-spin" />
          </div>
          <div className="w-full max-w-[220px] space-y-2">
            <span className="block text-[13px] font-medium text-primary/80">{t.studio.generating}</span>
            <div
              role="progressbar"
              aria-label={isAr ? 'تقدم التوليد' : 'Generation progress'}
              aria-valuetext={t.studio.generating}
              className="h-1.5 w-full overflow-hidden rounded-full bg-background/70 border border-border/20"
            >
              <div className="gen-progress-meter h-full w-1/2 rounded-full bg-primary" />
            </div>
          </div>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[11px] text-muted-foreground/40 line-clamp-2">{job.prompt}</p>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className={`rounded-2xl overflow-hidden bg-card/60 border border-destructive/20 relative ${cardSizeClass}`} style={cardStyle}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <div className={`${featured ? 'w-12 h-12' : 'w-10 h-10'} rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center`}>
            <AlertCircle size={featured ? 20 : 18} className="text-destructive/70" />
          </div>
          <span className="text-[13px] font-medium text-destructive/70">{t.studio.failedToLoad}</span>
          <button
            type="button"
            onClick={() => onRetry(job.id)}
            className="h-8 px-4 rounded-lg bg-card border border-border/20 text-[12px] font-medium text-foreground/80 hover:bg-muted/30 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw size={12} />
            {t.studio.retry}
          </button>
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-[11px] text-muted-foreground/30 line-clamp-2">{job.prompt}</p>
        </div>
      </div>
    );
  }

  if (!job.image_url) return null;

  return (
    <div
      className={`rounded-2xl overflow-hidden bg-card/60 border border-border/10 relative group cursor-pointer transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 ${cardSizeClass}`}
      style={cardStyle}
      onClick={() => onOpen(job)}
    >
      <div className={featured ? 'aspect-square w-full' : 'h-full w-full'}>
        <img
          src={job.image_url}
          alt={job.prompt || ''}
          className={`h-full w-full transition-all duration-500 group-hover:scale-[1.02] animate-fade-in ${featured ? 'object-contain' : 'object-cover'}`}
        />
      </div>
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors duration-300 pointer-events-none" />

      <div className={`quick-actions absolute ${isAr ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 group-hover:pointer-events-auto transition-all duration-300`}>
        <QuickActionButton icon={<Copy size={14} />} label={isAr ? 'نسخ الوصف' : 'Copy prompt'} onClick={() => {
          navigator.clipboard.writeText(job.prompt || '');
          toast({ title: isAr ? 'تم نسخ الوصف' : 'Prompt copied' });
        }} />
        <QuickActionButton icon={<Download size={14} />} label={isAr ? 'تحميل' : 'Download'} onClick={() => downloadImage(job.image_url!, job.prompt || '')} />
        <QuickActionButton icon={<Film size={14} />} label={isAr ? 'تحريك' : 'Animate'} onClick={() => handoff('/video/generate-video', job.image_url!, job.id, job.model_id)} />
        <QuickActionButton icon={<Wand2 size={14} />} label={isAr ? 'تعديل' : 'Edit'} onClick={() => handoff('/tools/edit-image', job.image_url!, job.id, job.model_id)} />
        <QuickActionButton icon={<ArrowUpCircle size={14} />} label={isAr ? 'رفع الجودة' : 'Upscale'} onClick={() => handoff('/tools/upscale', job.image_url!, job.id, job.model_id)} />
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/85 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 pointer-events-none">
        <p className="text-[11px] text-foreground/85 line-clamp-2">{job.prompt}</p>
      </div>
    </div>
  );
}

function EmptyRecentSlot({ loading }: { loading: boolean }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';

  return (
    <div className="aspect-square w-full max-w-[388px] rounded-2xl bg-card/60 border border-border/10 relative overflow-hidden flex items-center justify-center text-center px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--primary)/0.08),transparent_42%)]" />
      <div className="relative flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-background/60 border border-border/15 flex items-center justify-center">
          {loading ? (
            <Loader2 size={19} className="text-primary animate-spin" />
          ) : (
            <Wand2 size={19} className="text-muted-foreground/45" />
          )}
        </div>
        <p className="text-[15px] font-medium text-foreground/70">
          {isAr ? 'ستظهر صورتك الجديدة هنا' : 'Your generated image will show here'}
        </p>
        <p className="max-w-[260px] text-[12px] leading-relaxed text-muted-foreground/45">
          {isAr ? 'اكتب وصفك واضغط توليد لعرض النتيجة في هذه المساحة.' : 'Write a prompt and generate to see the latest result in this space.'}
        </p>
      </div>
    </div>
  );
}

function QuickActionButton({ icon, onClick, label }: { icon: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={label}
      aria-label={label}
      className="w-9 h-9 rounded-full backdrop-blur-md border border-border/10 flex items-center justify-center transition-all duration-200 active:scale-90 bg-background/60 text-foreground/80 hover:bg-primary/80 hover:text-primary-foreground hover:border-primary/30"
    >
      {icon}
    </button>
  );
}

type StudioGenerationFeedSection = 'full' | 'featured' | 'history';
type RecentJobEventDetail = {
  jobId?: string;
  prompt?: string;
  ratio?: string;
  resolution?: string;
  qualityTier?: string;
  modelId?: string | null;
  creditCost?: number;
};

export function StudioGenerationFeed({ section = 'full' }: { section?: StudioGenerationFeedSection }) {
  const { jobs, loading, retryJob, refetch } = useGenerationJobs();
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const [recentJobId, setRecentJobId] = useState<string | null>(() => (
    typeof window === 'undefined'
      ? null
      : sessionStorage.getItem('takhayal:studio:recentJobId')
  ));
  const [announcedJob, setAnnouncedJob] = useState<GenerationJob | null>(null);

  const studioJobs = useMemo(() => jobs.filter(isImageStudioJob), [jobs]);
  const recentJob = useMemo(
    () => recentJobId ? studioJobs.find(job => job.id === recentJobId) || (announcedJob?.id === recentJobId ? announcedJob : null) : null,
    [announcedJob, recentJobId, studioJobs]
  );
  const olderJobs = useMemo(
    () => studioJobs.filter(job => job.id !== recentJobId && hasGeneratedImage(job)),
    [recentJobId, studioJobs]
  );

  useEffect(() => {
    const handleRecentJob = (event: Event) => {
      const detail = (event as CustomEvent<RecentJobEventDetail>).detail;
      const jobId = detail?.jobId;
      if (jobId) {
        setRecentJobId(jobId);
        setAnnouncedJob({
          id: jobId,
          status: 'queued',
          prompt: detail.prompt || '',
          image_url: null,
          error_message: null,
          ratio: detail.ratio || '1:1',
          resolution: detail.resolution || detail.qualityTier || null,
          quality_tier: detail.qualityTier || detail.resolution || null,
          model_id: detail.modelId || null,
          credits_used: detail.creditCost || 0,
          created_at: new Date().toISOString(),
          tool_id: 'studio',
          media_type: 'image',
          video_url: null,
          thumbnail_url: null,
          duration: null,
          source_mode: null,
          used_image_input: false,
          input_image_urls: [],
        });
        void refetch();
      }
    };

    window.addEventListener('takhayal:studio:recent-job', handleRecentJob);
    return () => window.removeEventListener('takhayal:studio:recent-job', handleRecentJob);
  }, [refetch]);

  const showFeatured = section !== 'history';
  const showHistory = section !== 'featured';
  const frameClass = section === 'featured'
    ? 'w-full flex flex-col overflow-visible md:pt-[68px]'
    : 'w-full md:flex-1 flex flex-col overflow-visible md:overflow-hidden';
  const contentClass = section === 'featured'
    ? 'w-full'
    : 'md:flex-1 overflow-visible md:overflow-y-auto px-4 py-5 sm:px-6 lg:px-8 xl:px-10 space-y-5';

  const openGallery = (job: GenerationJob) => {
    navigate(`${localizePath('/gallery', lang)}?highlight=${encodeURIComponent(job.id)}`);
  };

  return (
    <div className={frameClass}>
      <div className={contentClass}>
        {showFeatured && (
          <div className="flex w-full justify-center">
            {recentJob ? (
              <StudioJobCard job={recentJob} onRetry={retryJob} onOpen={openGallery} featured />
            ) : (
              <EmptyRecentSlot loading={loading} />
            )}
          </div>
        )}

        {showHistory && olderJobs.length > 0 && (
          <>
            {section === 'history' && (
              <div className="px-1 pb-1 pt-1 md:pt-0">
                <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-[0.15em]">
                  {lang === 'ar' ? 'الصور السابقة' : 'Previous images'}
                </p>
              </div>
            )}
            <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 2xl:columns-5 [column-fill:_balance]">
              {olderJobs.map(job => (
                <div key={job.id} className="mb-4 break-inside-avoid">
                  <StudioJobCard job={job} onRetry={retryJob} onOpen={openGallery} />
                </div>
              ))}
            </div>
          </>
        )}

        {showHistory && loading && studioJobs.length > 0 && !recentJob && (
          <div className="flex justify-center py-6">
            <div className="h-8 px-3 rounded-full bg-card/70 border border-border/10 flex items-center gap-2 text-[12px] text-muted-foreground">
              <Loader2 size={13} className="text-primary animate-spin" />
              Loading
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
