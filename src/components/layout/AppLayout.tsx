import { Outlet } from 'react-router-dom';
import { TopNavbar } from './TopNavbar';
import { BottomNav } from './BottomNav';
import { AuthModal } from '@/components/AuthModal';
import { PromoBannerStrip, usePromoBannerVisible } from '@/components/PromoBanner';
import { useAdminMediaStore } from '@/stores/adminMediaStore';
import { useEffect } from 'react';

// Preload brand assets from media store to prevent flicker
export function AppLayout() {
  const assets = useAdminMediaStore(s => s.assets);
  const bannerVisible = usePromoBannerVisible();

  useEffect(() => {
    const brandAssets = assets.filter(a => a.type === 'Brand');
    brandAssets.forEach(asset => {
      const img = new Image();
      img.src = asset.url;
    });
  }, [assets]);

  return (
    <div
      className="flex flex-col h-screen w-full bg-background"
      style={{
        '--banner-h': bannerVisible ? 'calc(40px + env(safe-area-inset-top, 0px))' : '0px'
      } as React.CSSProperties}
    >
      <PromoBannerStrip />
      <TopNavbar bannerOffset={bannerVisible} />
      <AuthModal />
      <div className="flex-1 min-h-0 pb-[calc(58px+env(safe-area-inset-bottom,0px))] md:pb-0">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
