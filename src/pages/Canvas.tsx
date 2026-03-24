import { useApp } from '@/context/AppContext';
import { TopNavbar } from '@/components/layout/TopNavbar';
import { CenterCanvas } from '@/components/layout/CenterCanvas';
import { RightPanel } from '@/components/layout/RightPanel';
import { AuthModal } from '@/components/AuthModal';
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
          <>
            <CenterCanvas />
            <RightPanel />
          </>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <TopNavbar />
      <div className="flex flex-1 pt-16">
        {renderContent()}
      </div>
      <AuthModal />
    </div>
  );
};

export default Canvas;
