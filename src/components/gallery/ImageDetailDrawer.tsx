import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { GenerationJob } from '@/hooks/useGenerationJobs';
import { useModels } from '@/hooks/useModels';
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer';
import { Download, RefreshCw, X, Loader2, AlertCircle, RotateCcw, Calendar, Cpu, Ratio, Sparkles, Share2, Trash2, Copy, Check, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  job: GenerationJob | null;
  open: boolean;
  onClose: () => void;
  onRetry: (id: string) => void;
  onReuse: (prompt: string) => void;
  onShare?: (job: GenerationJob) => void;
  onDelete?: (id: string) => void;
  templateTitle?: string | null;
}

async function downloadImage(url: string, filename: string) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
    toast.success('Download started');
  } catch {
    window.open(url, '_blank');
    toast.info('Image opened in new tab');
  }
}

export function ImageDetailDrawer({ job, open, onClose, onRetry, onReuse, onShare, onDelete }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { models } = useModels();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const modelName = job ? (models.find(m => m.id === job.model_id)?.model_name || (isAr ? 'افتراضي' : 'Default')) : '';

  if (!job) return null;

  const hasValidImage = !!job.image_url && job.image_url.length > 5;
  const isProcessing = job.status === 'queued' || job.status === 'generating' || job.status === 'processing' || (job.status === 'completed' && !hasValidImage);
  const isFailed = job.status === 'failed' && !hasValidImage;
  const isCompleted = hasValidImage && (job.status === 'completed');
  const processingLabel = job.status === 'queued'
    ? (isAr ? 'في الانتظار...' : 'Queued...')
    : (isAr ? 'جاري التوليد...' : 'Generating...');

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!job.image_url || downloading) return;
    setDownloading(true);
    await downloadImage(job.image_url, `takhayal-${job.id}.png`);
    setDownloading(false);
  };

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!job.prompt) return;
    navigator.clipboard.writeText(job.prompt);
    setCopied(true);
    toast.success(isAr ? 'تم النسخ' : 'Copied');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onShare) return;

    onClose();

    window.setTimeout(() => {
      onShare(job);
    }, 0);
  };

  const dateStr = new Date(job.created_at).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[92vh] outline-none">
        <div className="flex flex-col max-h-[90vh] overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Close button */}
          <div className="flex justify-end p-3 pb-0">
            <DrawerClose asChild>
              <button className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X size={16} />
              </button>
            </DrawerClose>
          </div>

          {/* Image area */}
          <div className="px-4 pb-3">
            {isProcessing ? (
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/5 to-muted/10 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">{processingLabel}</span>
              </div>
            ) : isFailed ? (
              <div className="aspect-square rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={36} className="text-destructive/60" />
                <span className="text-sm font-medium text-destructive">{isAr ? 'فشل التوليد' : 'Failed'}</span>
              </div>
            ) : job.image_url ? (
              <img
                src={job.image_url}
                alt={job.prompt || ''}
                className="w-full rounded-xl object-contain max-h-[50vh]"
              />
            ) : null}
          </div>

          {/* Actions bar */}
          <div className="px-4 pb-3 flex gap-2">
            {isCompleted && job.image_url && (
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                {downloading ? (isAr ? 'جاري...' : '...') : (isAr ? 'تحميل' : 'Download')}
              </button>
            )}
            {isCompleted && (
              <button
                onClick={(e) => { e.stopPropagation(); onReuse(job.prompt || ''); onClose(); }}
                className="h-10 px-4 rounded-xl border border-border/40 text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors cursor-pointer"
              >
                <RefreshCw size={15} />
                {isAr ? 'إعادة استخدام' : 'Reuse'}
              </button>
            )}
            {isCompleted && (
              <button
                onClick={handleShareClick}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
              >
                <Share2 size={15} />
                {isAr ? 'مشاركة' : 'Share'}
              </button>
            )}
            {isFailed && (
              <button
                onClick={(e) => { e.stopPropagation(); onRetry(job.id); onClose(); }}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
              >
                <RotateCcw size={15} />
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </button>
            )}
          </div>

          {/* Prompt with copy */}
          <div className="px-4 pb-3 space-y-3">
            {job.prompt && (
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={12} className="text-primary" />
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isAr ? 'التعليمة' : 'Prompt'}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyPrompt}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">{job.prompt}</p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <MetaItem icon={<Calendar size={13} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
              <MetaItem icon={<Cpu size={13} />} label={isAr ? 'النموذج' : 'Model'} value={modelName} />
              <MetaItem icon={<Ratio size={13} />} label={isAr ? 'النسبة' : 'Ratio'} value={job.ratio || '1:1'} />
              <MetaItem icon={<Sparkles size={13} />} label={isAr ? 'الجودة' : 'Quality'} value={job.quality_tier || '1K'} />
            </div>
          </div>

          {/* Delete */}
          {isCompleted && onDelete && (
            <div className="px-4 pb-4">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                className="w-full h-10 rounded-xl text-destructive text-sm font-medium flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors cursor-pointer"
              >
                <Trash2 size={15} />
                {isAr ? 'حذف' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/20 p-2.5">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[12px] text-foreground truncate">{value}</p>
    </div>
  );
}
