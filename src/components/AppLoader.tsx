import { useEffect, useState } from 'react';

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
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: 24,
                background: 'linear-gradient(135deg, #F03E1B 0%, #FF6B35 60%, #FFB347 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'splashPulse 1.6s ease-in-out infinite',
              }}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L13.09 8.26L20 9.27L15 14.14L16.18 21.02L12 17.77L7.82 21.02L9 14.14L4 9.27L10.91 8.26L12 2Z"
                  fill="white"
                />
              </svg>
            </div>
            <div
              style={{
                fontFamily: "'Almarai', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 28,
                color: 'white',
                letterSpacing: '-0.02em',
              }}
            >
              تخيّل.ai
            </div>
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
        @keyframes splashPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(240,62,27,0.4), 0 16px 40px rgba(240,62,27,0.3); }
          50%       { box-shadow: 0 0 0 10px rgba(240,62,27,0), 0 20px 50px rgba(240,62,27,0.4); }
        }
        @keyframes splashProgress {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0%); }
        }
      `}</style>
    </>
  );
}
