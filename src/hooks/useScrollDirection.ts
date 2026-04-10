import { useState, useEffect, useRef } from 'react';

/** Returns true when mobile nav bars should be hidden (user scrolling down). */
export function useScrollDirection(threshold = 12) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    // Only on mobile-width viewports
    const mq = window.matchMedia('(max-width: 767px)');
    if (!mq.matches) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;

        // Near top → always show
        if (y < 40) {
          setHidden(false);
        } else if (Math.abs(delta) > threshold) {
          setHidden(delta > 0); // down = hide
        }

        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return hidden;
}
