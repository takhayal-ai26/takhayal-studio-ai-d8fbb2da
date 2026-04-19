import { useParams } from 'react-router-dom';
import { useToolsDB } from '@/hooks/useToolsDB';
import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

const StandardToolPage = lazy(() => import('./ToolPage'));
const GuidedToolPage = lazy(() => import('./GuidedToolPage'));
const EditImagePage = lazy(() => import('./EditImagePage'));

export default function ToolPageRouter() {
  const { toolId } = useParams();
  const { tools, isLoading } = useToolsDB();
  const tool = tools.find(t => t.slug === toolId || t.id === toolId);

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={24} /></div>;
  }

  const Component =
    tool?.toolMode === 'edit_image' ? EditImagePage :
    tool?.toolMode === 'guided_image' ? GuidedToolPage :
    StandardToolPage;

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" size={24} /></div>}>
      <Component />
    </Suspense>
  );
}
