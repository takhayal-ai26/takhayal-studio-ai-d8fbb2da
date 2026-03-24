import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Flame, X } from 'lucide-react';
import { useEffect } from 'react';

export function UpgradeModal() {
  const { upgradeModalOpen, closeUpgradeModal } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeUpgradeModal();
    };
    if (upgradeModalOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [upgradeModalOpen, closeUpgradeModal]);

  if (!upgradeModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center animate-fade-in"
      onClick={closeUpgradeModal}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[420px] mx-4 bg-card rounded-2xl border border-surface-border p-8 text-center animate-scale-in"
      >
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={18} />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-primary/[0.12] flex items-center justify-center mx-auto mb-5">
          <Flame size={24} className="text-primary" />
        </div>

        <h2 className="text-xl font-medium text-foreground">You're out of credits</h2>
        <p className="text-[14px] text-muted-foreground mt-2 mb-8">
          Upgrade to Pro to keep creating amazing visuals.
        </p>

        <button
          onClick={() => {
            closeUpgradeModal();
            navigate('/pricing');
          }}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-[14px] font-medium hover:bg-ember-hover transition-colors"
        >
          Upgrade to Pro
        </button>

        <button
          onClick={closeUpgradeModal}
          className="w-full h-10 mt-3 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
