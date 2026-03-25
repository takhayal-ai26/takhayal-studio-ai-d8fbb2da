import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu, Plus, Edit, Activity, CheckCircle, RefreshCw, Loader2, Wifi, WifiOff, Settings2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ProviderConfig {
  id: string;
  provider_name: string;
  provider_type: string;
  is_connected: boolean;
  environment: string;
  health_status: string;
  last_sync_at: string | null;
  api_key_set: boolean;
  default_model: string | null;
  config: Record<string, unknown>;
}

const AVAILABLE_MODELS: Record<string, { name: string; id: string; speed: string; cost: string; active: boolean; bestFor: string }[]> = {
  'Fal.ai': [
    { name: 'Flux Schnell', id: 'fal-ai/flux/schnell', speed: '~8s', cost: '$0.003', active: true, bestFor: 'Fast drafts, iteration' },
    { name: 'Flux Dev', id: 'fal-ai/flux/dev', speed: '~12s', cost: '$0.025', active: false, bestFor: 'Development, testing' },
    { name: 'Flux Pro', id: 'fal-ai/flux-pro', speed: '~15s', cost: '$0.05', active: false, bestFor: 'High quality generation' },
    { name: 'FLUX Pro Ultra', id: 'fal-ai/flux-pro/v1.1-ultra', speed: '~20s', cost: '$0.06', active: false, bestFor: 'Highest quality photorealistic, hero shots, premium ads' },
    { name: 'Ideogram V3', id: 'fal-ai/ideogram/v3', speed: '~15s', cost: '$0.08', active: false, bestFor: 'Arabic/English text overlays, typography, logos, posters' },
    { name: 'SDXL Lightning', id: 'fal-ai/fast-sdxl', speed: '~3s', cost: '$0.001', active: false, bestFor: 'Ultra fast previews, high volume generation' },
    { name: 'Stable Diffusion 3.5 Large', id: 'fal-ai/stable-diffusion-v35-large', speed: '~18s', cost: '$0.04', active: false, bestFor: 'Artistic, illustrated, creative editorial' },
    { name: 'Aura Flow', id: 'fal-ai/aura-flow', speed: '~12s', cost: '$0.02', active: false, bestFor: 'Fashion, beauty, lifestyle photography' },
    { name: 'Recraft V3', id: 'fal-ai/recraft-v3', speed: '~15s', cost: '$0.04', active: false, bestFor: 'Brand design, illustrations, vector-style, icons' },
    { name: 'Imagen 4', id: 'fal-ai/imagen4/preview', speed: '~10s', cost: '$0.04', active: false, bestFor: 'Photorealistic people, lifestyle, Gulf social content' },
  ],
};

const ROUTING_RULES = [
  { tool: 'Generate Image', defaultModel: 'Flux Schnell', fallback: 'FLUX Pro Ultra', planRouting: 'Free: Schnell / Pro: Schnell' },
  { tool: 'Create Logo', defaultModel: 'Ideogram V3', fallback: 'Recraft V3', planRouting: 'All: Ideogram V3' },
  { tool: 'Text Overlay', defaultModel: 'Ideogram V3', fallback: '-', planRouting: 'All: Ideogram V3' },
  { tool: 'Fast Preview', defaultModel: 'SDXL Lightning', fallback: 'Flux Schnell', planRouting: 'All: SDXL Lightning' },
  { tool: 'Upscale Image', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
  { tool: 'Remove Background', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
  { tool: 'Enhance Image', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
];

const healthColor: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  degraded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  down: 'bg-destructive/10 text-destructive border-destructive/20',
  unknown: 'bg-muted/30 text-muted-foreground border-border/40',
};

const statusColor: Record<string, string> = {
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  not_connected: 'bg-muted/30 text-muted-foreground border-border/40',
};

export default function AdminModels() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig | null>(null);
  const [configForm, setConfigForm] = useState({ environment: 'production', default_model: '' });

  const fetchProviders = useCallback(async () => {
    const { data, error } = await supabase
      .from('provider_configs')
      .select('*')
      .order('is_connected', { ascending: false });

    if (error) {
      console.error('Failed to fetch providers:', error);
      toast({ title: 'Error', description: 'Failed to load providers', variant: 'destructive' });
      return;
    }
    setProviders((data as unknown as ProviderConfig[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const handleSync = useCallback(async (providerName: string) => {
    setSyncingProvider(providerName);
    try {
      const { data, error } = await supabase.functions.invoke('check-provider-health', {
        body: { provider_name: providerName },
      });

      if (error) throw error;

      toast({
        title: `${providerName} Sync Complete`,
        description: data.details || `Health: ${data.health}`,
        variant: data.health === 'healthy' ? 'default' : 'destructive',
      });

      await fetchProviders();
    } catch (err) {
      console.error('Sync failed:', err);
      toast({ title: 'Sync Failed', description: String(err), variant: 'destructive' });
    } finally {
      setSyncingProvider(null);
    }
  }, [fetchProviders]);

  const openConfigDialog = useCallback((provider: ProviderConfig) => {
    setSelectedProvider(provider);
    setConfigForm({
      environment: provider.environment,
      default_model: provider.default_model || '',
    });
    setConfigDialogOpen(true);
  }, []);

  const handleSaveConfig = useCallback(async () => {
    if (!selectedProvider) return;

    const { error } = await supabase
      .from('provider_configs')
      .update({
        environment: configForm.environment,
        default_model: configForm.default_model || null,
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', selectedProvider.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
      return;
    }

    toast({ title: 'Configuration Saved', description: `${selectedProvider.provider_name} updated successfully` });
    setConfigDialogOpen(false);
    fetchProviders();
  }, [selectedProvider, configForm, fetchProviders]);

  const formatTimeSince = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const connectedProvider = providers.find(p => p.is_connected);
  const providerModels = connectedProvider ? AVAILABLE_MODELS[connectedProvider.provider_name] || [] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Models & Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage AI providers, model routing, costs, and failover</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Add Provider</Button>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="providers" className="text-xs">Providers</TabsTrigger>
          <TabsTrigger value="models" className="text-xs">Models</TabsTrigger>
          <TabsTrigger value="routing" className="text-xs">Routing Rules</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs">Cost Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-muted-foreground" size={24} />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {providers.map(p => (
                <Card key={p.id} className={`border-border/40 bg-card/50 transition-all ${p.is_connected ? 'ring-1 ring-emerald-500/20' : ''}`}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${p.is_connected ? 'bg-primary/10' : 'bg-muted/20'}`}>
                          {p.is_connected ? <Wifi size={16} className="text-primary" /> : <WifiOff size={16} className="text-muted-foreground" />}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">{p.provider_name}</h3>
                          <p className="text-[11px] text-muted-foreground">{p.provider_type}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${p.is_connected ? statusColor.connected : statusColor.not_connected}`}>
                        {p.is_connected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-[12px]">
                      <div>
                        <p className="text-muted-foreground">Environment</p>
                        <p className="font-medium capitalize">{p.is_connected ? p.environment : '-'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Health</p>
                        {p.is_connected && p.health_status !== 'unknown' ? (
                          <Badge variant="outline" className={`text-[10px] ${healthColor[p.health_status] || healthColor.unknown}`}>
                            {p.health_status}
                          </Badge>
                        ) : <p className="font-medium">-</p>}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Sync</p>
                        <p className="font-medium">{formatTimeSince(p.last_sync_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        disabled={!p.is_connected || syncingProvider === p.provider_name}
                        onClick={() => handleSync(p.provider_name)}
                      >
                        {syncingProvider === p.provider_name ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <RefreshCw size={12} />
                        )}
                        {syncingProvider === p.provider_name ? 'Syncing...' : 'Sync'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => openConfigDialog(p)}
                      >
                        <Settings2 size={12} /> Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="models">
          <Card className="border-border/40 bg-card/50">
            {providerModels.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Model</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">ID</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Speed</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Cost/Run</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Best For</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Default</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {providerModels.map(m => (
                    <TableRow key={m.id} className="border-border/20">
                      <TableCell className="text-[13px] font-medium">{m.name}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-mono">{m.id}</TableCell>
                      <TableCell className="text-[13px]">{m.speed}</TableCell>
                      <TableCell className="text-[13px] font-medium text-primary">{m.cost}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate" title={m.bestFor}>{m.bestFor}</TableCell>
                      <TableCell>{connectedProvider?.default_model === m.id && <CheckCircle size={14} className="text-emerald-400" />}</TableCell>
                      <TableCell><Switch defaultChecked={m.active} className="scale-75" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center text-center gap-3 py-12">
                <Cpu size={32} className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No active models. Connect a provider first.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="routing">
          <Card className="border-border/40 bg-card/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Default Model</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Fallback</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Plan Routing</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROUTING_RULES.map(r => (
                  <TableRow key={r.tool} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{r.tool}</TableCell>
                    <TableCell className="text-[13px]">{r.defaultModel}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{r.fallback}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{r.planRouting}</TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={12} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="costs">
          <Card className="border-border/40 bg-card/50 p-8">
            <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
              <Activity size={32} className="text-muted-foreground" />
              <h3 className="text-lg font-semibold">Cost Tracking</h3>
              <p className="text-sm text-muted-foreground max-w-md">Real-time cost tracking will be available when usage data accumulates. Monitor margin by tool, provider costs, and trends.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Configure Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 size={18} /> Configure {selectedProvider?.provider_name}
            </DialogTitle>
            <DialogDescription>
              Update provider settings and default model configuration.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Status</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[11px] ${selectedProvider?.is_connected ? statusColor.connected : statusColor.not_connected}`}>
                  {selectedProvider?.is_connected ? 'Connected' : 'Not Connected'}
                </Badge>
                {selectedProvider?.api_key_set && (
                  <Badge variant="outline" className="text-[11px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                    API Key Set
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment" className="text-xs text-muted-foreground uppercase tracking-wider">Environment</Label>
              <Select value={configForm.environment} onValueChange={(v) => setConfigForm(prev => ({ ...prev, environment: v }))}>
                <SelectTrigger id="environment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="sandbox">Sandbox</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedProvider?.is_connected && AVAILABLE_MODELS[selectedProvider.provider_name] && (
              <div className="space-y-2">
                <Label htmlFor="default-model" className="text-xs text-muted-foreground uppercase tracking-wider">Default Model</Label>
                <Select value={configForm.default_model} onValueChange={(v) => setConfigForm(prev => ({ ...prev, default_model: v }))}>
                  <SelectTrigger id="default-model">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MODELS[selectedProvider.provider_name].map(m => (
                      <SelectItem key={m.name} value={m.name.toLowerCase().replace(/\s/g, '-')}>
                        {m.name} ({m.speed})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedProvider?.is_connected && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">API Key</Label>
                <Input
                  type="password"
                  value="••••••••••••••••••"
                  disabled
                  className="bg-muted/20"
                />
                <p className="text-[11px] text-muted-foreground">API key is managed via backend secrets. Contact admin to update.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveConfig}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
