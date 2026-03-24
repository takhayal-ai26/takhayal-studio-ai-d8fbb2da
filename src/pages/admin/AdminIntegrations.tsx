import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Cpu, HardDrive, Shield, BarChart3, Mail, Webhook, Settings, CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

interface Integration {
  name: string;
  description: string;
  status: 'connected' | 'needs_setup' | 'error' | 'sandbox' | 'live';
  env?: string;
}

const statusStyle: Record<string, { class: string; icon: typeof CheckCircle }> = {
  connected: { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  live: { class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle },
  needs_setup: { class: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: Clock },
  error: { class: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
  sandbox: { class: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: AlertCircle },
};

const sections: { label: string; icon: typeof CreditCard; value: string; integrations: Integration[] }[] = [
  { label: 'Payments', icon: CreditCard, value: 'payments', integrations: [
    { name: 'Stripe', description: 'Primary payment processor for subscriptions and credit packs', status: 'needs_setup' },
    { name: 'Regional Gateway', description: 'MENA-specific payment methods (future)', status: 'needs_setup' },
  ]},
  { label: 'AI Providers', icon: Cpu, value: 'ai', integrations: [
    { name: 'Replicate', description: 'Primary AI model provider for image generation', status: 'needs_setup' },
    { name: 'Stability AI', description: 'Alternative generation and upscaling models', status: 'needs_setup' },
    { name: 'OpenAI', description: 'Prompt enhancement and image analysis', status: 'needs_setup' },
    { name: 'Fal.ai', description: 'Fast inference for real-time generation', status: 'needs_setup' },
  ]},
  { label: 'Storage / CDN', icon: HardDrive, value: 'storage', integrations: [
    { name: 'Supabase Storage', description: 'Primary file storage for generated images and uploads', status: 'needs_setup' },
    { name: 'CDN Provider', description: 'Content delivery for optimized asset serving', status: 'needs_setup' },
  ]},
  { label: 'Auth', icon: Shield, value: 'auth', integrations: [
    { name: 'Google Auth', description: 'Sign in with Google OAuth', status: 'needs_setup' },
    { name: 'Apple Auth', description: 'Sign in with Apple', status: 'needs_setup' },
  ]},
  { label: 'Analytics', icon: BarChart3, value: 'analytics', integrations: [
    { name: 'PostHog', description: 'Product analytics and event tracking', status: 'needs_setup' },
    { name: 'Google Analytics', description: 'Traffic and conversion tracking', status: 'needs_setup' },
  ]},
  { label: 'CRM / Email', icon: Mail, value: 'email', integrations: [
    { name: 'Resend', description: 'Transactional email delivery', status: 'needs_setup' },
    { name: 'Loops', description: 'Onboarding flows and marketing automation', status: 'needs_setup' },
  ]},
  { label: 'Webhooks / API', icon: Webhook, value: 'webhooks', integrations: [
    { name: 'Internal API Keys', description: 'Manage API keys for internal services', status: 'needs_setup' },
    { name: 'Webhook Endpoints', description: 'Configure webhook delivery for events', status: 'needs_setup' },
  ]},
];

export default function AdminIntegrations() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Integration control center — connect payments, AI, storage, auth, and more</p>
      </div>

      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList className="bg-muted/30 flex-wrap h-auto gap-1 p-1">
          {sections.map(s => (
            <TabsTrigger key={s.value} value={s.value} className="text-xs gap-1.5">
              <s.icon size={12} /> {s.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {sections.map(section => (
          <TabsContent key={section.value} value={section.value}>
            <div className="grid md:grid-cols-2 gap-4">
              {section.integrations.map(int => {
                const st = statusStyle[int.status];
                const StatusIcon = st.icon;
                return (
                  <Card key={int.name} className="border-border/40 bg-card/50 hover:ring-1 hover:ring-primary/10 transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10"><section.icon size={16} className="text-primary" /></div>
                          <div>
                            <h3 className="text-sm font-bold">{int.name}</h3>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{int.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-[10px] capitalize gap-1 ${st.class}`}>
                          <StatusIcon size={10} /> {int.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 mt-2">
                        <Settings size={12} /> {int.status === 'needs_setup' ? 'Setup' : 'Configure'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
