import { Navigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { InspirationFeed } from '@/components/layout/InspirationFeed';
import { CreationPanel } from '@/components/layout/CreationPanel';
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
          <div className="flex flex-1 min-h-0 relative overflow-visible">
            <CreationPanel />
            <InspirationFeed />
          </div>
        );
    }
  };

  if (activePage === 'gallery') {
    return <Navigate to="/gallery" replace />;
  }

  return (
    <>
      <div className="flex flex-1 min-h-0 overflow-visible" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
        {renderContent()}
      </div>
      <UpgradeModal />
    </>
  );
};

export default Canvas;
