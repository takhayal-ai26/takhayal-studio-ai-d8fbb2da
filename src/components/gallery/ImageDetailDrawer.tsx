import { useLanguage } from '@/i18n/LanguageContext';
import { GenerationJob } from '@/hooks/useGenerationJobs';
import { useModels } from '@/hooks/useModels';
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer';
import { Download, RefreshCw, X, Loader2, AlertCircle, RotateCcw, Calendar, Cpu, Ratio, Sparkles } from 'lucide-react';

interface Props {
  job: GenerationJob | null;
  open: boolean;
  onClose: () => void;
  onRetry: (id: string) => void;
  onReuse: (prompt: string) => void;
}

export function ImageDetailDrawer({ job, open, onClose, onRetry, onReuse }: Props) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const { models } = useModels();

  const modelName = job ? (models.find(m => m.id === job.model_id)?.model_name || (isAr ? 'افتراضي' : 'Default')) : '';

  if (!job) return null;

  const isProcessing = job.status === 'processing';
  const isFailed = job.status === 'failed';
  const isCompleted = job.status === 'completed';

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const statusLabel = isProcessing
    ? (isAr ? 'جاري التوليد...' : 'Generating...')
    : isFailed
    ? (isAr ? 'فشل التوليد' : 'Failed')
    : (isAr ? 'مكتمل' : 'Completed');

  const statusColor = isProcessing ? 'text-primary' : isFailed ? 'text-destructive' : 'text-green-500';

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[92vh] outline-none">
        <div className="flex flex-col max-h-[90vh] overflow-y-auto" dir={isAr ? 'rtl' : 'ltr'}>
          {/* Close button */}
          <div className="flex justify-end p-3 pb-0">
            <DrawerClose asChild>
              <button className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={16} />
              </button>
            </DrawerClose>
          </div>

          {/* Image area */}
          <div className="px-4 pb-3">
            {isProcessing ? (
              <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/5 to-muted/10 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">{statusLabel}</span>
              </div>
            ) : isFailed ? (
              <div className="aspect-square rounded-xl bg-muted/20 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={36} className="text-destructive/60" />
                <span className="text-sm font-medium text-destructive">{statusLabel}</span>
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
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              >
                <Download size={15} />
                {isAr ? 'تحميل' : 'Download'}
              </button>
            )}
            {isCompleted && (
              <button
                onClick={() => { onReuse(job.prompt || ''); onClose(); }}
                className="flex-1 h-10 rounded-xl border border-border/40 text-foreground text-sm font-medium flex items-center justify-center gap-2 hover:bg-muted/40 transition-colors"
              >
                <RefreshCw size={15} />
                {isAr ? 'إعادة استخدام' : 'Reuse'}
              </button>
            )}
            {isFailed && (
              <button
                onClick={() => { onRetry(job.id); onClose(); }}
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              >
                <RotateCcw size={15} />
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="px-4 pb-6 space-y-3">
            {/* Prompt */}
            {job.prompt && (
              <div className="rounded-xl bg-muted/30 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Sparkles size={12} className="text-primary" />
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {isAr ? 'التعليمة' : 'Prompt'}
                  </span>
                </div>
                <p className="text-[13px] text-foreground leading-relaxed">{job.prompt}</p>
              </div>
            )}

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-2">
              <MetaItem
                icon={<Calendar size={13} />}
                label={isAr ? 'التاريخ' : 'Date'}
                value={dateStr}
              />
              <MetaItem
                icon={<Cpu size={13} />}
                label={isAr ? 'النموذج' : 'Model'}
                value={job.model_id || (isAr ? 'افتراضي' : 'Default')}
              />
              <MetaItem
                icon={<Ratio size={13} />}
                label={isAr ? 'النسبة' : 'Ratio'}
                value={job.ratio || '1:1'}
              />
              <MetaItem
                icon={<span className={`text-xs font-bold ${statusColor}`}>●</span>}
                label={isAr ? 'الحالة' : 'Status'}
                value={statusLabel}
              />
            </div>
          </div>
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
