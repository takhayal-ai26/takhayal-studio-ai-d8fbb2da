import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Layers, Scale } from 'lucide-react';
import AdminTemplates from './AdminTemplates';
import AdminContent from './AdminContent';
import AdminLegalPolicies from './AdminLegalPolicies';

export default function AdminContentMerged() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Content</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage templates, landing page content, and legal policies</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="templates" className="text-xs gap-1.5"><FileText size={14} /> Templates</TabsTrigger>
          <TabsTrigger value="landing" className="text-xs gap-1.5"><Layers size={14} /> Landing Page</TabsTrigger>
          <TabsTrigger value="legal" className="text-xs gap-1.5"><Scale size={14} /> Legal & Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <AdminTemplates embedded />
        </TabsContent>

        <TabsContent value="landing">
          <AdminContent embedded />
        </TabsContent>

        <TabsContent value="legal">
          <AdminLegalPolicies />
        </TabsContent>
      </Tabs>
    </div>
  );
}
