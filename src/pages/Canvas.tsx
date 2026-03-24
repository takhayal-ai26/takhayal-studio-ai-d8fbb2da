import { useApp } from '@/context/AppContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { CenterCanvas } from '@/components/layout/CenterCanvas';
import { RightPanel } from '@/components/layout/RightPanel';
import { AuthModal } from '@/components/AuthModal';
import { GalleryView } from '@/components/views/GalleryView';
import { CreditsView } from '@/components/views/CreditsView';
import { SettingsView } from '@/components/views/SettingsView';
import { TemplatesView } from '@/components/views/TemplatesView';
import { toast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

const Canvas = () => {
  const { activePage, isAuthenticated } = useApp();
  const hasWelcomed = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !hasWelcomed.current) {
      hasWelcomed.current = true;
      toast({
        title: 'Welcome to Takhayal ✓',
        description: 'You have 10 free credits to start',
      });
    }
  }, [isAuthenticated]);

  const renderContent = () => {
    switch (activePage) {
      case 'gallery': return <GalleryView />;
      case 'credits': return <CreditsView />;
      case 'settings': return <SettingsView />;
      case 'templates': return <TemplatesView />;
      case 'canvas':
      default:
        return (
          <>
            <CenterCanvas />
            <RightPanel />
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      {renderContent()}
      <AuthModal />
    </div>
  );
};

export default Canvas;
