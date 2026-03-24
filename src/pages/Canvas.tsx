import { useApp } from '@/context/AppContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { InspirationFeed } from '@/components/layout/InspirationFeed';
import { CreationPanel } from '@/components/layout/CreationPanel';
import { AuthModal } from '@/components/AuthModal';
import { UpgradeModal } from '@/components/UpgradeModal';
import { GalleryView } from '@/components/views/GalleryView';
import { CreditsView } from '@/components/views/CreditsView';
import { SettingsView } from '@/components/views/SettingsView';
import { TemplatesView } from '@/components/views/TemplatesView';

const Canvas = () => {
  const { activePage } = useApp();

  const renderContent = () => {
    switch (activePage) {
      case 'gallery': return <GalleryView />;
      case 'credits': return <CreditsView />;
      case 'settings': return <SettingsView />;
      case 'templates': return <TemplatesView />;
      case 'canvas':
      default:
        return (
          <div className="flex flex-1 overflow-hidden">
            <InspirationFeed />
            <CreationPanel />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex flex-1 pt-16 overflow-hidden">
        {renderContent()}
      </div>
      <AuthModal />
      <UpgradeModal />
    </div>
  );
};

export default Canvas;
