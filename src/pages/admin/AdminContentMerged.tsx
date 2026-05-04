import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Layers, Scale, Home, MessageSquareQuote, Cpu, Search } from 'lucide-react';
import AdminTemplates from './AdminTemplates';
import AdminContent from './AdminContent';
import AdminLegalPolicies from './AdminLegalPolicies';
import AdminDashboardHero from './AdminDashboardHero';
import AdminTestimonials from './AdminTestimonials';
import AdminModelGuide from './AdminModelGuide';
import AdminSeoLandingPages from './AdminSeoLandingPages';

export default function AdminContentMerged() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-heading-page">Content</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage templates, landing page content, dashboard hero, testimonials, and legal policies</p>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="templates" className="text-xs gap-1.5"><FileText size={14} /> Templates</TabsTrigger>
          <TabsTrigger value="dashboard-hero" className="text-xs gap-1.5"><Home size={14} /> Dashboard Hero</TabsTrigger>
          <TabsTrigger value="testimonials" className="text-xs gap-1.5"><MessageSquareQuote size={14} /> Testimonials</TabsTrigger>
          <TabsTrigger value="landing" className="text-xs gap-1.5"><Layers size={14} /> Landing Page</TabsTrigger>
          <TabsTrigger value="seo" className="text-xs gap-1.5"><Search size={14} /> SEO Pages</TabsTrigger>
          <TabsTrigger value="model-guide" className="text-xs gap-1.5"><Cpu size={14} /> Model Guide</TabsTrigger>
          <TabsTrigger value="legal" className="text-xs gap-1.5"><Scale size={14} /> Legal & Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="templates">
          <AdminTemplates embedded />
        </TabsContent>

        <TabsContent value="dashboard-hero">
          <AdminDashboardHero />
        </TabsContent>

        <TabsContent value="testimonials">
          <AdminTestimonials embedded />
        </TabsContent>

        <TabsContent value="landing">
          <AdminContent embedded />
        </TabsContent>

        <TabsContent value="seo">
          <AdminSeoLandingPages />
        </TabsContent>

        <TabsContent value="model-guide">
          <AdminModelGuide embedded />
        </TabsContent>

        <TabsContent value="legal">
          <AdminLegalPolicies />
        </TabsContent>
      </Tabs>
    </div>
  );
}
