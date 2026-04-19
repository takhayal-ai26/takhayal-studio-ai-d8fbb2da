import { Sun, Moon } from 'lucide-react';
import { useAppTheme } from '@/context/AppThemeContext';
import { useState } from 'react';

export function ThemeToggle() {
  const { mode, toggleMode } = useAppTheme();
  const [rotating, setRotating] = useState(false);

  const handleClick = () => {
    setRotating(true);
    toggleMode();
    setTimeout(() => setRotating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className="w-11 h-11 rounded-xl bg-transparent flex items-center justify-center hover:bg-foreground/[0.06] transition-all duration-150"
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {mode === 'dark' ? (
        <Sun size={16} className={`text-muted-foreground ${rotating ? 'animate-spin' : ''}`} style={rotating ? { animationDuration: '300ms' } : {}} />
      ) : (
        <Moon size={16} className={`text-muted-foreground ${rotating ? 'animate-spin' : ''}`} style={rotating ? { animationDuration: '300ms' } : {}} />
      )}
    </button>
  );
}
