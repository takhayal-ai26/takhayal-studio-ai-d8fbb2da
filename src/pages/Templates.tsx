import { TemplatesView } from '@/components/views/TemplatesView';
import { Footer } from '@/components/layout/Footer';

export default function Templates() {
  return (
    <div className="flex-1" style={{ paddingTop: 'calc(3.5rem + var(--banner-h, 0px))' }}>
      <TemplatesView />
      <Footer />
    </div>
  );
}
