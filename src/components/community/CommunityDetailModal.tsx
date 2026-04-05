import { useEffect, useState, useCallback } from 'react';
import { X, Copy, Share2, ArrowRight, Download, ChevronLeft, ChevronRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { CommunityPost } from '@/pages/Community';
import { toast } from 'sonner';

interface Props {
  post: CommunityPost | null;
  open: boolean;
  onClose: () => void;
  onUsePrompt: (prompt: string) => void;
  onShare: (post: CommunityPost) => void;
  isAr: boolean;
  isRTL: boolean;
  isMobile: boolean;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function CommunityDetailModal({
  post, open, onClose, onUsePrompt, onShare,
  isAr, isRTL, isMobile, onPrev, onNext, hasPrev, hasNext,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Reset state when post changes
  useEffect(() => {
    setCopied(false);
    setExpanded(false);
  }, [post?.id]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') isRTL ? onNext() : onPrev();
      if (e.key === 'ArrowRight') isRTL ? onPrev() : onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, onPrev, onNext, isRTL]);

  const handleCopyPrompt = useCallback(async () => {
    if (!post?.prompt) return;
    await navigator.clipboard.writeText(post.prompt);
    setCopied(true);
    toast.success(isAr ? 'تم نسخ الأمر' : 'Prompt copied!');
    setTimeout(() => setCopied(false), 2000);
  }, [post, isAr]);

  const handleDownload = useCallback(async () => {
    if (!post?.image_url) return;
    try {
      const resp = await fetch(post.image_url);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `takhayal-${post.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(post.image_url, '_blank');
    }
  }, [post]);

  if (!open || !post) return null;

  const promptText = post.prompt || '';
  const isLongPrompt = promptText.length > 160;
  const displayPrompt = isLongPrompt && !expanded ? promptText.slice(0, 160) + '…' : promptText;

  // Metadata items
  const meta: { label: string; value: string }[] = [];
  if (post.model_name) meta.push({ label: isAr ? 'النموذج' : 'Model', value: post.model_name });
  if (post.quality_tier || post.resolution) meta.push({ label: isAr ? 'الجودة' : 'Quality', value: post.quality_tier || post.resolution || '' });
  if (post.ratio) meta.push({ label: isAr ? 'النسبة' : 'Ratio', value: post.ratio });

  const creatorInitial = post.creator_name?.charAt(0)?.toUpperCase() || '?';

  // ── MOBILE LAYOUT ──
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-foreground">
            <X size={16} />
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => onShare(post)} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-foreground">
              <Share2 size={14} />
            </button>
            <button onClick={handleDownload} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center text-foreground">
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-4 overflow-hidden">
          <img src={post.image_url} alt={promptText} className="max-w-full max-h-full object-contain rounded-xl" />
        </div>

        {/* Info panel */}
        <div className="shrink-0 px-4 pt-4 pb-6 space-y-3">
          {/* Creator */}
          <div className="flex items-center gap-2">
            {post.creator_avatar ? (
              <img src={post.creator_avatar} className="w-6 h-6 rounded-full object-cover" alt="" />
            ) : (
              <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {creatorInitial}
              </span>
            )}
            <span className="text-sm text-foreground font-medium">
              {post.creator_name || (isAr ? 'مبدع' : 'Creator')}
            </span>
            <span className="text-[10px] text-muted-foreground/40 ms-auto">
              {formatDate(post.created_at, isAr)}
            </span>
          </div>

          {/* Prompt */}
          {promptText && (
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{displayPrompt}</p>
              <div className="flex items-center gap-2 mt-2">
                {isLongPrompt && (
                  <button onClick={() => setExpanded(!expanded)} className="text-[10px] text-primary font-medium flex items-center gap-0.5">
                    {expanded ? (isAr ? 'أقل' : 'Less') : (isAr ? 'المزيد' : 'More')}
                    {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                  </button>
                )}
                <button onClick={handleCopyPrompt} className="text-[10px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 ms-auto">
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? (isAr ? 'تم' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                </button>
              </div>
            </div>
          )}

          {/* Meta */}
          {meta.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {meta.map(m => (
                <span key={m.label} className="text-[10px] px-2 py-1 rounded-md bg-muted/40 text-muted-foreground">
                  {m.label}: {m.value}
                </span>
              ))}
            </div>
          )}

          {/* Use prompt */}
          {promptText && (
            <button
              onClick={() => onUsePrompt(promptText)}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
            >
              {isAr ? 'استخدم هذا الأمر' : 'Use this prompt'}
              <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ──
  return (
    <div
      className="fixed inset-0 z-[70] bg-black flex animate-in fade-in duration-200"
      onClick={onClose}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Nav arrows */}
      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'right-4' : 'left-4'} w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all z-10`}
        >
          {isRTL ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )}
      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? 'left-4' : 'right-4'} w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all z-10`}
        >
          {isRTL ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      )}

      <div
        className="relative bg-card border border-border/50 rounded-2xl overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-row shadow-2xl shadow-black/30 animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className={`absolute top-3 ${isRTL ? 'left-3' : 'right-3'} z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors`}
        >
          <X size={16} />
        </button>

        {/* Image side */}
        <div className="flex-1 min-w-0 bg-black/20 flex items-center justify-center p-4 max-h-[90vh] overflow-hidden">
          <img
            src={post.image_url}
            alt={promptText}
            className="max-w-full max-h-[82vh] object-contain rounded-lg"
          />
        </div>

        {/* Info panel */}
        <div className="w-[340px] shrink-0 flex flex-col p-5 overflow-y-auto max-h-[90vh] border-s border-border/30">
          {/* Creator */}
          <div className="flex items-center gap-2.5 mb-5">
            {post.creator_avatar ? (
              <img src={post.creator_avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
            ) : (
              <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                {creatorInitial}
              </span>
            )}
            <div>
              <span className="text-sm text-foreground font-medium block">
                {post.creator_name || (isAr ? 'مبدع' : 'Creator')}
              </span>
              <span className="text-[10px] text-muted-foreground/40">
                {formatDate(post.created_at, isAr)}
              </span>
            </div>
          </div>

          {/* Prompt */}
          {promptText && (
            <div className="mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-2">
                {isAr ? 'الأمر' : 'Prompt'}
              </h3>
              <div className="bg-muted/20 rounded-xl p-3">
                <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {displayPrompt}
                </p>
                <div className="flex items-center gap-2 mt-2.5">
                  {isLongPrompt && (
                    <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-primary font-medium flex items-center gap-0.5 hover:underline">
                      {expanded ? (isAr ? 'أقل' : 'Show less') : (isAr ? 'عرض الكل' : 'Show more')}
                      {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  )}
                  <button
                    onClick={handleCopyPrompt}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium flex items-center gap-1 ms-auto transition-colors"
                  >
                    {copied ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                    {copied ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          {meta.length > 0 && (
            <div className="mb-4">
              <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium mb-2">
                {isAr ? 'التفاصيل' : 'Details'}
              </h3>
              <div className="space-y-1.5">
                {meta.map(m => (
                  <div key={m.label} className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground/60">{m.label}</span>
                    <span className="text-foreground/80 font-medium">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-auto pt-4 space-y-2.5">
            {promptText && (
              <button
                onClick={() => onUsePrompt(promptText)}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
              >
                {isAr ? 'استخدم هذا الأمر' : 'Use this prompt'}
                <ArrowRight size={14} className={isRTL ? 'rotate-180' : ''} />
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => onShare(post)}
                className="flex-1 h-9 rounded-xl border border-border/50 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Share2 size={12} />
                {isAr ? 'مشاركة' : 'Share'}
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 h-9 rounded-xl border border-border/50 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download size={12} />
                {isAr ? 'تحميل' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
