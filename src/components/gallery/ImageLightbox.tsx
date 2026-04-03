import { useEffect, useCallback } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { GenerationJob } from '@/hooks/useGenerationJobs';
import {
  Download, RefreshCw, X, Loader2, AlertCircle, RotateCcw,
  Calendar, Cpu, Ratio, Sparkles, Share2, Trash2,
  ChevronLeft, ChevronRight, Copy, Check
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  job: GenerationJob | null;
  open: boolean;
  onClose: () => void;
  onRetry: (id: string) => void;
  onReuse: (prompt: string) => void;
  onShare?: (job: GenerationJob) => void;
  onDelete?: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ImageLightbox({
  job, open, onClose, onRetry, onReuse, onShare, onDelete,
  onPrev, onNext, hasPrev, hasNext
}: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { models } = useModels();
  const [copied, setCopied] = useState(false);

  const modelName = job
    ? (models.find(m => m.id === job.model_id)?.model_name || (isAr ? 'افتراضي' : 'Default'))
    : '';

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        if (isAr) onNext?.(); else onPrev?.();
      }
      if (e.key === 'ArrowRight') {
        if (isAr) onPrev?.(); else onNext?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onPrev, onNext, isAr]);

  // Lock body scroll
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

  const isProcessing = job.status === 'processing';
  const isFailed = job.status === 'failed';
  const isCompleted = job.status === 'completed';

  const handleDownload = () => {
    if (!job.image_url) return;
    const a = document.createElement('a');
    a.href = job.image_url;
    a.download = `takhayal-${job.id}.png`;
    a.target = '_blank';
    a.click();
  };

  const dateStr = new Date(job.created_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center animate-fade-in"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Nav arrows */}
      {hasPrev && (
        <button
          onClick={e => { e.stopPropagation(); isAr ? onNext?.() : onPrev?.(); }}
          className={`absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-background transition-all shadow-lg ${isAr ? 'right-4' : 'left-4'}`}
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={e => { e.stopPropagation(); isAr ? onPrev?.() : onNext?.(); }}
          className={`absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground/70 hover:text-foreground hover:bg-background transition-all shadow-lg ${isAr ? 'left-4' : 'right-4'}`}
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Main container */}
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-[1200px] mx-8 bg-popover rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/5">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isAr ? 'معاينة الصورة' : 'Image Preview'}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body: 2-column */}
        <div className="flex flex-col lg:flex-row max-h-[80vh]">
          {/* Left: Image */}
          <div className="flex-1 min-w-0 flex items-center justify-center bg-black/5 dark:bg-black/20 p-6 lg:p-8">
            {isProcessing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">{isAr ? 'جاري التوليد...' : 'Generating...'}</span>
              </div>
            ) : isFailed ? (
              <div className="flex flex-col items-center gap-4">
                <AlertCircle size={48} className="text-destructive/60" />
                <span className="text-sm font-medium text-destructive">{isAr ? 'فشل التوليد' : 'Failed'}</span>
              </div>
            ) : job.image_url ? (
              <img
                src={job.image_url}
                alt={job.prompt || ''}
                className="max-h-[70vh] max-w-full rounded-xl object-contain transition-transform duration-300 hover:scale-[1.02]"
              />
            ) : null}
          </div>

          {/* Right: Details panel */}
          <div className="w-full lg:w-[360px] flex-shrink-0 border-t lg:border-t-0 lg:border-s border-border/5 overflow-y-auto p-6 space-y-5">
            {/* Actions */}
            <div className="flex gap-2.5">
              {isCompleted && job.image_url && (
                <button
                  onClick={handleDownload}
                  className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  <Download size={15} />
                  {isAr ? 'تحميل' : 'Download'}
                </button>
              )}
              {isCompleted && (
                <button
                  onClick={() => { onReuse(job.prompt || ''); onClose(); }}
                  className="h-10 px-4 rounded-xl bg-muted/40 text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-muted/60 transition-colors"
                >
                  <RefreshCw size={14} />
                  {isAr ? 'إعادة' : 'Reuse'}
                </button>
              )}
              {isCompleted && onShare && (
                <button
                  onClick={() => onShare(job)}
                  className="h-10 px-4 rounded-xl bg-muted/40 text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-muted/60 transition-colors"
                >
                  <Share2 size={14} />
                  {isAr ? 'مشاركة' : 'Share'}
                </button>
              )}
              {isFailed && (
                <button
                  onClick={() => { onRetry(job.id); onClose(); }}
                  className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:brightness-110 transition-all"
                >
                  <RotateCcw size={14} />
                  {isAr ? 'إعادة المحاولة' : 'Retry'}
                </button>
              )}
            </div>

            {/* Prompt */}
            {job.prompt && (
              <div className="rounded-xl bg-muted/20 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-primary" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isAr ? 'التعليمة' : 'Prompt'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                    title={isAr ? 'نسخ' : 'Copy'}
                  >
                    {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                </div>
                <p className="text-[13px] text-foreground/90 leading-relaxed">{job.prompt}</p>
              </div>
            )}

            {/* Metadata grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <MetaCard icon={<Calendar size={14} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
              <MetaCard icon={<Cpu size={14} />} label={isAr ? 'النموذج' : 'Model'} value={modelName} />
              <MetaCard icon={<Ratio size={14} />} label={isAr ? 'النسبة' : 'Ratio'} value={job.ratio || '1:1'} />
              <MetaCard icon={<Sparkles size={14} />} label={isAr ? 'الجودة' : 'Quality'} value={job.quality_tier || '1K'} />
            </div>

            {/* Delete */}
            {isCompleted && onDelete && (
              <button
                onClick={() => onDelete(job.id)}
                className="flex items-center gap-2 text-[12px] font-medium text-destructive/60 hover:text-destructive transition-colors pt-2"
              >
                <Trash2 size={13} />
                {isAr ? 'حذف الصورة' : 'Delete image'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/15 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-muted-foreground/60">{icon}</span>
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[12px] text-foreground/80 truncate">{value}</p>
    </div>
  );
}
