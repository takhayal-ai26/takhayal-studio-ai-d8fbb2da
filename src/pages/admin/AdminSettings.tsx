import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Settings, Globe, Shield, Zap, FileText, AlertTriangle } from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="typo-heading-page">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">General platform configuration and feature flags</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Brand */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Settings size={16} /> Brand Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label className="text-xs">Platform Name</Label><Input defaultValue="Takhayal.ai" className="h-9 text-sm bg-muted/30" /></div>
            <div className="space-y-2"><Label className="text-xs">Tagline</Label><Input defaultValue="Arabic-first Creative AI Studio" className="h-9 text-sm bg-muted/30" /></div>
            <div className="space-y-2"><Label className="text-xs">Support Email</Label><Input defaultValue="support@takhayal.ai" className="h-9 text-sm bg-muted/30" /></div>
            <Button size="sm" className="text-xs">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe size={16} /> Localization</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="text-[13px] font-medium">Default Language</p><p className="text-[11px] text-muted-foreground">English</p></div><Badge variant="outline" className="text-[10px]">EN</Badge></div>
            <div className="flex items-center justify-between"><div><p className="text-[13px] font-medium">Arabic Support</p><p className="text-[11px] text-muted-foreground">Full RTL + translation</p></div><Switch defaultChecked className="scale-75" /></div>
            <div className="flex items-center justify-between"><div><p className="text-[13px] font-medium">Auto-detect Language</p><p className="text-[11px] text-muted-foreground">Based on browser locale</p></div><Switch className="scale-75" /></div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Zap size={16} /> Feature Flags</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Community Uploads', desc: 'Allow users to submit to community', on: true },
              { name: 'Prompt Enhancement', desc: 'AI-enhanced prompts before generation', on: true },
              { name: 'HD Generation', desc: 'Allow HD quality for Pro users', on: true },
              { name: 'Batch Generation', desc: 'Generate multiple images at once', on: false },
              { name: 'API Access', desc: 'External API access for enterprise', on: false },
            ].map(f => (
              <div key={f.name} className="flex items-center justify-between">
                <div><p className="text-[13px] font-medium">{f.name}</p><p className="text-[11px] text-muted-foreground">{f.desc}</p></div>
                <Switch defaultChecked={f.on} className="scale-75" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield size={16} /> System</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between"><div><p className="text-[13px] font-medium">Maintenance Mode</p><p className="text-[11px] text-muted-foreground">Disable all user-facing features</p></div><Switch className="scale-75" /></div>
            <div className="space-y-2"><Label className="text-xs">Global Generation Limit (daily)</Label><Input defaultValue="100" type="number" className="h-9 text-sm bg-muted/30 w-24" /></div>
            <div className="space-y-2"><Label className="text-xs">Default Free Credits</Label><Input defaultValue="20" type="number" className="h-9 text-sm bg-muted/30 w-24" /></div>
            <div className="pt-2 border-t border-border/20">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground"><FileText size={12} /> Environment: <Badge variant="outline" className="text-[10px]">Production</Badge></div>
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card className="border-border/40 bg-card/50 md:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText size={16} /> Legal & Policies</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2"><Label className="text-xs">Privacy Policy URL</Label><Input defaultValue="https://takhayal.ai/privacy" className="h-9 text-sm bg-muted/30" /></div>
              <div className="space-y-2"><Label className="text-xs">Terms of Service URL</Label><Input defaultValue="https://takhayal.ai/terms" className="h-9 text-sm bg-muted/30" /></div>
              <div className="space-y-2"><Label className="text-xs">Content Policy URL</Label><Input defaultValue="https://takhayal.ai/content-policy" className="h-9 text-sm bg-muted/30" /></div>
            </div>
            <Button size="sm" className="text-xs">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
