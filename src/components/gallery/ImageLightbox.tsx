import { useEffect, useCallback, useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useModels } from '@/hooks/useModels';
import { GenerationJob } from '@/hooks/useGenerationJobs';
import {
  Download, RefreshCw, X, Loader2, AlertCircle, RotateCcw,
  Calendar, Cpu, Ratio, Sparkles, Share2, Trash2,
  ChevronLeft, ChevronRight, Copy, Check
} from 'lucide-react';
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
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true">
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Nav arrows - above backdrop */}
      {hasPrev && (
        <button
          onClick={() => { isAr ? onNext?.() : onPrev?.(); }}
          className={`absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-muted/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${isAr ? 'right-3' : 'left-3'}`}
        >
          <ChevronLeft size={18} />
        </button>
      )}
      {hasNext && (
        <button
          onClick={() => { isAr ? onPrev?.() : onNext?.(); }}
          className={`absolute top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-muted/60 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all ${isAr ? 'left-3' : 'right-3'}`}
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Main container */}
      <div
        dir={isAr ? 'rtl' : 'ltr'}
        className="absolute inset-0 z-10 flex items-center justify-center p-6 lg:p-10 pointer-events-none"
      >
        <div
          className="relative w-full max-w-[1200px] max-h-[90vh] bg-card rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in zoom-in-[0.97] fade-in duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 h-14">
            <span className="text-[13px] font-medium text-muted-foreground/60">
              {isAr ? 'معاينة' : 'Preview'}
            </span>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body: 2-column */}
          <div className="flex flex-col lg:flex-row" style={{ maxHeight: 'calc(90vh - 3.5rem)' }}>
            {/* Left: Image */}
            <div className="flex-1 min-w-0 flex items-center justify-center bg-muted/20 p-4 lg:p-8 overflow-hidden">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-4 py-20">
                  <Loader2 size={40} className="text-primary animate-spin" />
                  <span className="text-sm font-medium text-primary">{isAr ? 'جاري التوليد...' : 'Generating...'}</span>
                </div>
              ) : isFailed ? (
                <div className="flex flex-col items-center gap-4 py-20">
                  <AlertCircle size={40} className="text-destructive/60" />
                  <span className="text-sm font-medium text-destructive">{isAr ? 'فشل التوليد' : 'Failed'}</span>
                </div>
              ) : job.image_url ? (
                <img
                  src={job.image_url}
                  alt={job.prompt || ''}
                  className="max-h-[72vh] max-w-full rounded-xl object-contain"
                />
              ) : null}
            </div>

            {/* Right: Details panel */}
            <div className="w-full lg:w-[340px] flex-shrink-0 border-t lg:border-t-0 lg:border-s border-border/10 overflow-y-auto p-5 lg:p-6 space-y-5">
              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {isCompleted && job.image_url && (
                  <button
                    onClick={handleDownload}
                    className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:brightness-110 active:scale-[0.97] transition-all"
                  >
                    <Download size={14} />
                    {isAr ? 'تحميل' : 'Download'}
                  </button>
                )}
                {isCompleted && (
                  <button
                    onClick={() => { onReuse(job.prompt || ''); onClose(); }}
                    className="h-9 px-4 rounded-xl bg-muted/50 text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-muted/70 active:scale-[0.97] transition-all"
                  >
                    <RefreshCw size={13} />
                    {isAr ? 'إعادة' : 'Reuse'}
                  </button>
                )}
                {isCompleted && onShare && (
                  <button
                    onClick={() => onShare(job)}
                    className="h-9 px-4 rounded-xl bg-muted/50 text-foreground text-[13px] font-medium flex items-center gap-2 hover:bg-muted/70 active:scale-[0.97] transition-all"
                  >
                    <Share2 size={13} />
                    {isAr ? 'مشاركة' : 'Share'}
                  </button>
                )}
                {isFailed && (
                  <button
                    onClick={() => { onRetry(job.id); onClose(); }}
                    className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-[13px] font-medium flex items-center gap-2 hover:brightness-110 active:scale-[0.97] transition-all"
                  >
                    <RotateCcw size={13} />
                    {isAr ? 'إعادة المحاولة' : 'Retry'}
                  </button>
                )}
              </div>

              {/* Prompt */}
              {job.prompt && (
                <div className="rounded-xl bg-muted/30 p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={12} className="text-primary/70" />
                      <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest">
                        {isAr ? 'التعليمة' : 'Prompt'}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyPrompt}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 active:scale-95 transition-all"
                      title={isAr ? 'نسخ' : 'Copy'}
                    >
                      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <p className="text-[13px] text-foreground/80 leading-relaxed">{job.prompt}</p>
                </div>
              )}

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-2">
                <MetaCard icon={<Calendar size={13} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                <MetaCard icon={<Cpu size={13} />} label={isAr ? 'النموذج' : 'Model'} value={modelName} />
                <MetaCard icon={<Ratio size={13} />} label={isAr ? 'النسبة' : 'Ratio'} value={job.ratio || '1:1'} />
                <MetaCard icon={<Sparkles size={13} />} label={isAr ? 'الجودة' : 'Quality'} value={job.quality_tier || '1K'} />
              </div>

              {/* Delete */}
              {isCompleted && onDelete && (
                <button
                  onClick={() => onDelete(job.id)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/40 hover:text-destructive transition-colors pt-1"
                >
                  <Trash2 size={12} />
                  {isAr ? 'حذف' : 'Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/20 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground/40">{icon}</span>
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-[12px] text-foreground/70 truncate">{value}</p>
    </div>
  );
}
