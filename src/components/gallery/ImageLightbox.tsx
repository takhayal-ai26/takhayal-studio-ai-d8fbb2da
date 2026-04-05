import { useEffect, useCallback, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { GenerationJob } from '@/hooks/useGenerationJobs';
import {
  Download, RefreshCw, X, Loader2, AlertCircle, RotateCcw,
  Calendar, Cpu, Ratio, Sparkles, Share2, Trash2,
  ChevronLeft, ChevronRight, Copy, Check, LayoutTemplate, Wrench
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { isToolJob, getToolName, getToolAction } from '@/hooks/useToolInfo';

interface Props {
  job: GenerationJob | null;
  open: boolean;
  onClose: () => void;
  onRetry: (id: string) => void;
  onReuse: (prompt: string, job?: GenerationJob) => void;
  onShare?: (job: GenerationJob) => void;
  onDelete?: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  templateTitle?: string | null;
}

async function downloadImage(url: string, filename: string) {
  try {
    const resp = await fetch(url, { mode: 'cors' });
    if (!resp.ok) throw new Error('fetch failed');
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 200);
    toast.success('Download started');
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.info('Download started');
  }
}

export function ImageLightbox({
  job, open, onClose, onRetry, onReuse, onShare, onDelete,
  onPrev, onNext, hasPrev, hasNext, templateTitle
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { models } = useModels();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const modelName = job
    ? (models.find(m => m.id === job.model_id)?.model_name || (isAr ? 'افتراضي' : 'Default'))
    : '';

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') { isAr ? onNext?.() : onPrev?.(); }
      if (e.key === 'ArrowRight') { isAr ? onPrev?.() : onNext?.(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onPrev, onNext, isAr]);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const handleCopyPrompt = useCallback(() => {
    if (!job?.prompt) return;
    navigator.clipboard.writeText(job.prompt);
    setCopied(true);
    toast.success(isAr ? 'تم النسخ' : 'Copied');
    setTimeout(() => setCopied(false), 2000);
  }, [job?.prompt, isAr]);

  if (!open || !job) return null;

  const hasValidImage = !!job.image_url && job.image_url.length > 5;
  const isProcessing = job.status === 'queued' || job.status === 'generating' || job.status === 'processing' || (job.status === 'completed' && !hasValidImage);
  const isFailed = job.status === 'failed' && !hasValidImage;
  const isCompleted = hasValidImage && (job.status === 'completed');
  const processingLabel = job.status === 'queued'
    ? (isAr ? 'في الانتظار...' : 'Queued...')
    : (isAr ? 'جاري التوليد...' : 'Generating...');

  const isTool = isToolJob(job.tool_id);
  const toolName = isTool ? getToolName(job.tool_id, isAr) : '';
  const toolAction = isTool ? getToolAction(job.tool_id, isAr) : '';

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!job.image_url || downloading) return;
    setDownloading(true);
    await downloadImage(job.image_url, `takhayal-${job.id}.png`);
    setDownloading(false);
  };

  const handleReuseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onReuse(job.prompt || '', job);
    onClose();
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onShare?.(job);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete?.(job.id);
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRetry(job.id);
    onClose();
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose();
  };

  const handlePrevClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isAr ? onNext?.() : onPrev?.();
  };

  const handleNextClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isAr ? onPrev?.() : onNext?.();
  };

  const dateStr = formatDate(job.created_at, isAr);

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-background/90 backdrop-blur-2xl cursor-pointer"
        onClick={handleCloseClick}
      />

      {hasPrev && (
        <button
          onClick={handlePrevClick}
          className={`absolute top-1/2 -translate-y-1/2 z-[95] w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all shadow-md cursor-pointer ${isAr ? 'right-5' : 'left-5'}`}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={handleNextClick}
          className={`absolute top-1/2 -translate-y-1/2 z-[95] w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-all shadow-md cursor-pointer ${isAr ? 'left-5' : 'right-5'}`}
        >
          <ChevronRight size={18} />
        </button>
      )}

      <button
        onClick={handleCloseClick}
        className={`absolute top-5 z-[95] w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-md cursor-pointer ${isAr ? 'left-[360px] xl:left-[400px]' : 'right-[360px] xl:right-[400px]'}`}
      >
        <X size={15} />
      </button>

      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="absolute inset-0 z-[92] flex items-stretch"
      >
        <div className="flex-1 flex items-center justify-center p-10 lg:p-16" onClick={handleCloseClick}>
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
              <Loader2 size={44} className="text-primary animate-spin" />
              <span className="text-sm font-medium text-primary">{processingLabel}</span>
            </div>
          ) : isFailed ? (
            <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
              <AlertCircle size={44} className="text-destructive/60" />
              <span className="text-sm font-medium text-destructive">{isAr ? 'فشل التوليد' : 'Failed'}</span>
            </div>
          ) : job.image_url ? (
            <img
              src={job.image_url}
              alt={job.prompt || ''}
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
              onClick={e => e.stopPropagation()}
            />
          ) : null}
        </div>

        <div
          className="w-[340px] xl:w-[380px] flex-shrink-0 bg-card/60 backdrop-blur-xl border-s border-border/10 overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 xl:p-7 space-y-6 pt-16">
            {/* Action buttons */}
            <div className="space-y-2.5">
              {isCompleted && job.image_url && (
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                  {downloading ? (isAr ? 'جاري التحميل...' : 'Downloading...') : (isAr ? 'تحميل الصورة' : 'Download Image')}
                </button>
              )}
              <div className="flex gap-2">
                {isCompleted && (
                  <button
                    onClick={handleReuseClick}
                    className="flex-1 h-10 rounded-xl bg-muted/50 text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/70 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    {isTool ? (isAr ? 'استخدام الأداة' : 'Use Tool') : (isAr ? 'إعادة استخدام' : 'Reuse')}
                  </button>
                )}
                {isCompleted && (
                  <button
                    onClick={handleShareClick}
                    className="flex-1 h-10 rounded-xl bg-muted/50 text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/70 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Share2 size={13} />
                    {isAr ? 'مشاركة' : 'Share'}
                  </button>
                )}
              </div>
              {isCompleted && onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="w-full h-10 rounded-xl border border-destructive/25 bg-destructive/10 text-destructive text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-destructive/15 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  {isAr ? 'حذف الصورة' : 'Delete Image'}
                </button>
              )}
              {isFailed && (
                <button
                  onClick={handleRetryClick}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <RotateCcw size={14} />
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </button>
              )}
            </div>

            <div className="h-px bg-border/10" />

            {/* Tool-generated: clean tool info */}
            {isTool ? (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em] mb-3 block">
                  {isAr ? 'الأداة' : 'Tool'}
                </span>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wrench size={14} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-[14px] font-semibold text-foreground block">{toolName}</span>
                    <span className="text-[11px] text-muted-foreground/50">{toolAction}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <MetaRow icon={<Calendar size={14} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                </div>
              </div>
            ) : templateTitle ? (
              <div>
                <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em] mb-3 block">
                  {isAr ? 'القالب' : 'Template'}
                </span>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <LayoutTemplate size={14} className="text-primary" />
                  </div>
                  <span className="text-[14px] font-semibold text-foreground">{templateTitle}</span>
                </div>
                <div className="space-y-3">
                  <MetaRow icon={<Calendar size={14} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                </div>
              </div>
            ) : (
              <>
                {job.prompt && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">
                        {isAr ? 'التعليمة' : 'Prompt'}
                      </span>
                      <button
                        onClick={handleCopyPrompt}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/30 hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all cursor-pointer"
                        title={isAr ? 'نسخ' : 'Copy'}
                      >
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="text-[13px] text-foreground/80 leading-[1.7]">{job.prompt}</p>
                  </div>
                )}

                <div className="h-px bg-border/10" />

                <div>
                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em] mb-3 block">
                    {isAr ? 'التفاصيل' : 'Details'}
                  </span>
                  <div className="space-y-3">
                    <MetaRow icon={<Calendar size={14} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                    <MetaRow icon={<Cpu size={14} />} label={isAr ? 'النموذج' : 'Model'} value={modelName} />
                    <MetaRow icon={<Ratio size={14} />} label={isAr ? 'النسبة' : 'Ratio'} value={job.ratio || '1:1'} />
                    <MetaRow icon={<Sparkles size={14} />} label={isAr ? 'الجودة' : 'Quality'} value={job.quality_tier || '1K'} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground/30">{icon}</span>
        <span className="text-[12px] text-muted-foreground/50">{label}</span>
      </div>
      <span className="text-[12px] text-foreground/70 font-medium">{value}</span>
    </div>
  );
}
