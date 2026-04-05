import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wrench, Cpu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import AdminTools from './AdminTools';
import AdminModels from './AdminModels';

export default function AdminStudioConfig() {
  const location = useLocation();
  const defaultTab = location.pathname.includes('/admin/models') ? 'models' : 'tools';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-heading-page">Studio Config</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage tools, models, routing rules, and provider connections</p>
      </div>

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="tools" className="text-xs gap-1.5"><Wrench size={14} /> Tools</TabsTrigger>
          <TabsTrigger value="models" className="text-xs gap-1.5"><Cpu size={14} /> Models</TabsTrigger>
        </TabsList>

        <TabsContent value="tools">
          <AdminTools embedded />
        </TabsContent>

        <TabsContent value="models">
          <AdminModels embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}
