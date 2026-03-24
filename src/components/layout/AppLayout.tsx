import { Outlet } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { AuthModal } from '@/components/AuthModal';
import logoMark from '@/assets/logo-mark.svg';
import logoFullAr from '@/assets/logo-mark-ar.svg';
import { useEffect } from 'react';

// Preload both logo assets to prevent flicker
const preloadImage = (src: string) => {
  const img = new Image();
  img.src = src;
};

export function AppLayout() {
  useEffect(() => {
    preloadImage(logoMark);
    preloadImage(logoFullAr);
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <TopNavbar />
      <AuthModal />
      <Outlet />
    </div>
  );
}
