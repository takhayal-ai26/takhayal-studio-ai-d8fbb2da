import { useState } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { GenerationJob } from '@/hooks/useGenerationJobs';
import { useModels } from '@/hooks/useModels';
import { Drawer, DrawerContent, DrawerClose } from '@/components/ui/drawer';
import { Download, RefreshCw, X, Loader2, AlertCircle, RotateCcw, Calendar, Cpu, Ratio, Sparkles, Share2, Trash2, Copy, Check, LayoutTemplate, ChevronDown, Wrench, Image as ImageLucide } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { isToolJob, getToolName, getToolAction } from '@/hooks/useToolInfo';

interface Props {
  job: GenerationJob | null;
  open: boolean;
  onClose: () => void;
  onRetry: (id: string) => void;
  onReuse: (prompt: string, job?: GenerationJob) => void;
  onShare?: (job: GenerationJob) => void;
  onDelete?: (id: string) => void;
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

export function ImageDetailDrawer({ job, open, onClose, onRetry, onReuse, onShare, onDelete, templateTitle }: Props) {
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
    window.setTimeout(() => { onShare(job); }, 0);
  };

  const handleReuseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onReuse(job.prompt || '', job);
    onClose();
  };

  const dateStr = formatDate(job.created_at, isAr);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[92vh] outline-none border-border/30">
        <div className="flex flex-col max-h-[90vh] overflow-y-auto pb-6" dir={isAr ? 'rtl' : 'ltr'}>
          
          {/* Close button */}
          <div className={`flex ${isAr ? 'justify-start' : 'justify-end'} px-4 pt-1 pb-0`}>
            <DrawerClose asChild>
              <button className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer">
                <ChevronDown size={16} />
              </button>
            </DrawerClose>
          </div>

          {/* Image */}
          <div className="px-4 pb-4">
            {isProcessing ? (
              <div className="aspect-square rounded-2xl bg-muted/10 flex flex-col items-center justify-center gap-3">
                <Loader2 size={32} className="text-primary animate-spin" />
                <span className="text-sm font-medium text-primary">{processingLabel}</span>
              </div>
            ) : isFailed ? (
              <div className="aspect-square rounded-2xl bg-muted/10 flex flex-col items-center justify-center gap-3">
                <AlertCircle size={32} className="text-destructive/60" />
                <span className="text-sm font-medium text-destructive">{isAr ? 'فشل التوليد' : 'Failed'}</span>
              </div>
            ) : job.image_url ? (
              <div className="rounded-2xl overflow-hidden bg-muted/5">
                <img
                  src={job.image_url}
                  alt={job.prompt || ''}
                  className="w-full rounded-2xl object-contain max-h-[45vh]"
                />
              </div>
            ) : null}
          </div>

          {/* Action buttons */}
          <div className="px-4 pb-4 space-y-2.5">
            {isCompleted && (
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                >
                  {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {downloading ? '...' : (isAr ? 'تحميل' : 'Download')}
                </button>
                <button
                  onClick={handleReuseClick}
                  className="h-11 px-4 rounded-xl bg-muted/30 text-foreground text-[13px] font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  <RefreshCw size={14} />
                  {isTool ? (isAr ? 'استخدام الأداة' : 'Use Tool') : (isAr ? 'إعادة' : 'Reuse')}
                </button>
                <button
                  onClick={handleShareClick}
                  className="flex-1 h-11 rounded-xl bg-muted/30 text-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:bg-muted/50 transition-all cursor-pointer"
                >
                  <Share2 size={14} />
                  {isAr ? 'مشاركة' : 'Share'}
                </button>
              </div>
            )}
            {isFailed && (
              <button
                onClick={(e) => { e.stopPropagation(); onRetry(job.id); onClose(); }}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                {isAr ? 'إعادة المحاولة' : 'Retry'}
              </button>
            )}
          </div>

          {/* Metadata */}
          <div className="px-4 space-y-3">
            {/* Tool-generated: show tool info */}
            {isTool ? (
              <>
                <div className="rounded-xl bg-muted/15 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Wrench size={12} className="text-primary" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isAr ? 'الأداة' : 'Tool'}
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-foreground">{toolName}</p>
                  <p className="text-[12px] text-muted-foreground/60 mt-1">{toolAction}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <MetaItem icon={<Calendar size={12} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                </div>
              </>
            ) : templateTitle ? (
              <>
                <div className="rounded-xl bg-muted/15 p-3.5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <LayoutTemplate size={12} className="text-primary" />
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {isAr ? 'القالب' : 'Template'}
                    </span>
                  </div>
                  <p className="text-[14px] font-semibold text-foreground">{templateTitle}</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <MetaItem icon={<Calendar size={12} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                </div>
              </>
            ) : (
              <>
                {job.prompt && (
                  <div className="rounded-xl bg-muted/15 p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={12} className="text-primary" />
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {isAr ? 'التعليمة' : 'Prompt'}
                        </span>
                      </div>
                      <button
                        onClick={handleCopyPrompt}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all cursor-pointer"
                      >
                        {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                      </button>
                    </div>
                    <p className="text-[13px] text-foreground/80 leading-relaxed">{job.prompt}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <MetaItem icon={<Calendar size={12} />} label={isAr ? 'التاريخ' : 'Date'} value={dateStr} />
                  <MetaItem icon={<Cpu size={12} />} label={isAr ? 'النموذج' : 'Model'} value={modelName} />
                  <MetaItem icon={<Ratio size={12} />} label={isAr ? 'النسبة' : 'Ratio'} value={job.ratio || '1:1'} />
                  <MetaItem icon={<Sparkles size={12} />} label={isAr ? 'الجودة' : 'Quality'} value={job.quality_tier || '1K'} />
                </div>
              </>
            )}

            {/* Delete — subtle at bottom */}
            {isCompleted && onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                className="w-full h-10 rounded-xl text-destructive/60 text-[12px] font-medium flex items-center justify-center gap-1.5 hover:text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                {isAr ? 'حذف الصورة' : 'Delete Image'}
              </button>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/10 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-muted-foreground/60">{icon}</span>
        <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-[12px] text-foreground/80 truncate">{value}</p>
    </div>
  );
}
