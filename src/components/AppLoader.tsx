import { useEffect, useState } from 'react';
import splashLogo from '@/assets/logo-splash.svg';

export function AppLoader({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'loading' | 'fading' | 'done'>('loading');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('fading');
      setTimeout(() => setPhase('done'), 380);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {phase !== 'done' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'hsl(0 0% 8%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: phase === 'fading' ? 0 : 1,
            transition: 'opacity 380ms ease-out',
            pointerEvents: phase === 'fading' ? 'none' : 'auto',
          }}
        >
          <div
            style={{
              animation: 'splashIn 500ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24,
            }}
          >
            <img
              src={splashLogo}
              alt="Takhayal"
              style={{
                width: 80,
                height: 80,
                borderRadius: 18,
                display: 'block',
              }}
            />
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 80,
              width: 160,
              height: 3,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, #F03E1B, transparent)',
                animation: 'splashProgress 1.2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ visibility: phase === 'done' ? 'visible' : 'hidden' }}>
        {children}
      </div>

      <style>{`
        @keyframes splashIn {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes splashProgress {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0%); }
        }
      `}</style>
    </>
  );
}
