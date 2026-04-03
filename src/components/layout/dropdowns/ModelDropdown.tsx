import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/i18n/LanguageContext';
import { MobileBottomSheet } from './MobileBottomSheet';
import type { ModelRecord } from '@/hooks/useModels';
import type { PricingTier } from '@/hooks/usePricingTiers';

interface Props {
  models: ModelRecord[];
  selectedModelId: string;
  allTiers: Record<string, PricingTier[]>;
  language: string;
  anchorRect: DOMRect | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

function ModelCard({ model, isActive, language, onSelect }: { model: ModelRecord; isActive: boolean; language: string; onSelect: (id: string) => void }) {
  const bestFor = language === 'ar' ? (model.best_for_ar || model.best_for) : model.best_for;
  return (
    <button
      key={model.id}
      data-selected={isActive}
      onClick={(e) => { e.stopPropagation(); onSelect(model.id); }}
      className={`w-full flex items-center gap-3 text-start rounded-2xl mx-4 mb-2 p-4 transition-all duration-200 ${
        isActive
          ? 'bg-primary/10 ring-1 ring-primary/25 shadow-[0_2px_12px_-2px] shadow-primary/15'
          : 'bg-foreground/[0.03] hover:bg-foreground/[0.06] active:scale-[0.98]'
      }`}
      style={{ width: 'calc(100% - 32px)' }}
    >
      <div className="flex-1 min-w-0">
        <p className={`text-[15px] font-semibold leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {model.model_name}
        </p>
        {bestFor && (
          <p className="text-[12px] mt-1 text-muted-foreground/70 line-clamp-2">{bestFor}</p>
        )}
      </div>
      {isActive && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <Check size={14} className="text-primary-foreground" />
        </div>
      )}
    </button>
  );
}

export function ModelDropdown({ models, selectedModelId, language, anchorRect, onSelect, onClose }: Props) {
  const isMobile = useIsMobile();
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!isMobile) {
      const el = panelRef.current;
      if (!el) return;
      const selectedEl = el.querySelector('[data-selected="true"]');
      if (selectedEl) selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isMobile]);

  if (isMobile) {
    return (
      <MobileBottomSheet title={t.studio.selectModel} open onClose={onClose}>
        <div className="pb-4">
          {models.map(m => (
            <ModelCard key={m.id} model={m} isActive={selectedModelId === m.id} language={language} onSelect={onSelect} />
          ))}
          {models.length === 0 && (
            <p className="text-[13px] text-center py-8 text-muted-foreground">{language === 'ar' ? 'لا توجد نماذج نشطة' : 'No active models'}</p>
          )}
        </div>
      </MobileBottomSheet>
    );
  }

  // Desktop: portal dropdown
  const panelW = 290;
  const panelMaxH = 420;
  let top = 0, left = 0;
  if (anchorRect) {
    top = Math.max(8, anchorRect.top - panelMaxH + anchorRect.height + 60);
    left = anchorRect.right + 8;
    if (top + panelMaxH > window.innerHeight - 16) top = window.innerHeight - panelMaxH - 16;
    if (left + panelW > window.innerWidth - 16) left = anchorRect.left - panelW - 8;
    if (top < 8) top = 8;
  }

  return createPortal(
    <div data-dropdown-portal>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div ref={panelRef} className="fixed z-[9999] animate-in fade-in slide-in-from-left-2 duration-150" style={{ top, left, width: panelW }}>
        <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'var(--dropdown-bg)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', maxHeight: panelMaxH, display: 'flex', flexDirection: 'column' }}>
          <div className="sticky top-0 z-[1] px-3.5 py-2.5 border-b border-border" style={{ background: 'var(--dropdown-bg)' }}>
            <p className="text-[10px] uppercase tracking-[2.5px] font-medium text-muted-foreground">{t.studio.selectModel}</p>
          </div>
          <div className="overflow-y-auto flex-1 scrollbar-thin" style={{ maxHeight: panelMaxH - 40 }}>
            {models.map((m, i) => {
              const isActive = selectedModelId === m.id;
              const bestFor = language === 'ar' ? (m.best_for_ar || m.best_for) : m.best_for;
              const isLast = i === models.length - 1;
              return (
                <button
                  key={m.id}
                  data-selected={isActive}
                  onClick={(e) => { e.stopPropagation(); onSelect(m.id); }}
                  className="w-full flex items-center gap-3 text-left transition-colors duration-[120ms]"
                  style={{
                    padding: '10px 14px', minHeight: 52,
                    borderBottom: isLast ? 'none' : `1px solid var(--dropdown-divider)`,
                    borderLeft: isActive ? '2px solid hsl(var(--primary))' : '2px solid transparent',
                    background: isActive ? 'hsla(var(--primary) / 0.06)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isActive) (e.currentTarget.style.background = 'hsl(var(--muted))'); }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium leading-tight" style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--foreground))' }}>{m.model_name}</p>
                    {bestFor && <p className="text-[11px] mt-0.5 truncate text-muted-foreground">{bestFor}</p>}
                  </div>
                  <span className="text-[9px] flex-shrink-0 text-muted-foreground">{(m.supported_quality_tiers || ['1K']).join('  ')}</span>
                  {isActive && <Check size={14} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
            {models.length === 0 && <p className="text-[12px] text-center py-6 text-muted-foreground">No active models</p>}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
