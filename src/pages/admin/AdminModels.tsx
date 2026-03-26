import { useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Cpu, Plus, Edit, Activity, CheckCircle, RefreshCw, Loader2, Wifi, WifiOff, Settings2, Search, Filter, Layers } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useModels, ModelRecord } from '@/hooks/useModels';
import { ModelDetailDrawer } from '@/components/admin/ModelDetailDrawer';

// --- Provider types (kept for Providers tab) ---
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

const ROUTING_RULES = [
  { tool: 'Generate Image', defaultModel: 'Flux Schnell', fallback: 'FLUX Pro Ultra', planRouting: 'Free: Schnell / Pro: Schnell' },
  { tool: 'Create Logo', defaultModel: 'Ideogram V3', fallback: 'Recraft V3', planRouting: 'All: Ideogram V3' },
  { tool: 'Text Overlay', defaultModel: 'Ideogram V3', fallback: '-', planRouting: 'All: Ideogram V3' },
  { tool: 'Fast Preview', defaultModel: 'SDXL Lightning', fallback: 'Flux Schnell', planRouting: 'All: SDXL Lightning' },
  { tool: 'Upscale Image', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
  { tool: 'Remove Background', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
  { tool: 'Enhance Image', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
];

export default function AdminModels() {
  // Provider state
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  // Models from hook
  const { models, loading: modelsLoading, updateModel, fetchModels } = useModels();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterInputType, setFilterInputType] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<ModelRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [syncingModels, setSyncingModels] = useState(false);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    const { data, error } = await supabase
      .from('provider_configs')
      .select('*')
      .order('is_connected', { ascending: false });
    if (!error) setProviders((data as unknown as ProviderConfig[]) || []);
    setProvidersLoading(false);
  }, []);

  useState(() => { fetchProviders(); });

  const handleProviderSync = useCallback(async (providerName: string) => {
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
      toast({ title: 'Sync Failed', description: String(err), variant: 'destructive' });
    } finally {
      setSyncingProvider(null);
    }
  }, [fetchProviders]);

  const handleSyncFromFal = useCallback(async () => {
    setSyncingModels(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-models', { body: {} });
      if (error) throw error;
      toast({
        title: 'Sync Complete',
        description: `${data.models_checked} models checked. Admin overrides preserved.`,
      });
      await fetchModels();
    } catch (err) {
      toast({ title: 'Sync Failed', description: String(err), variant: 'destructive' });
    } finally {
      setSyncingModels(false);
    }
  }, [fetchModels]);

  const handleToggleActive = useCallback(async (model: ModelRecord) => {
    try {
      await updateModel(model.id, { is_active: !model.is_active });
    } catch {
      toast({ title: 'Error', description: 'Failed to toggle model', variant: 'destructive' });
    }
  }, [updateModel]);

  const handleToggleDefault = useCallback(async (model: ModelRecord) => {
    try {
      // Only one default allowed
      if (!model.is_default) {
        // Unset all others first
        for (const m of models.filter(m => m.is_default && m.id !== model.id)) {
          await updateModel(m.id, { is_default: false });
        }
      }
      await updateModel(model.id, { is_default: !model.is_default });
    } catch {
      toast({ title: 'Error', description: 'Failed to set default', variant: 'destructive' });
    }
  }, [updateModel, models]);

  const openModelDetail = useCallback((model: ModelRecord) => {
    setSelectedModel(model);
    setDrawerOpen(true);
  }, []);

  const handleSaveModel = useCallback(async (id: string, updates: Partial<ModelRecord>) => {
    await updateModel(id, updates);
  }, [updateModel]);

  // Filtered models
  const filteredModels = models.filter(m => {
    if (searchQuery && !m.model_name.toLowerCase().includes(searchQuery.toLowerCase()) && !m.endpoint_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterProvider !== 'all' && m.provider_name !== filterProvider) return false;
    if (filterActive === 'active' && !m.is_active) return false;
    if (filterActive === 'inactive' && m.is_active) return false;
    if (filterInputType !== 'all' && m.input_type !== filterInputType) return false;
    return true;
  });

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

  const uniqueProviders = [...new Set(models.map(m => m.provider_name))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Models & Providers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage AI providers, model routing, costs, and failover</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleSyncFromFal} disabled={syncingModels}>
            {syncingModels ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Sync from fal
          </Button>
          <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Add Provider</Button>
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="providers" className="text-xs">Providers</TabsTrigger>
          <TabsTrigger value="models" className="text-xs">Models</TabsTrigger>
          <TabsTrigger value="routing" className="text-xs">Routing Rules</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs">Cost Tracking</TabsTrigger>
        </TabsList>

        {/* =================== PROVIDERS TAB =================== */}
        <TabsContent value="providers">
          {providersLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
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
                          <Badge variant="outline" className={`text-[10px] ${healthColor[p.health_status] || healthColor.unknown}`}>{p.health_status}</Badge>
                        ) : <p className="font-medium">-</p>}
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Sync</p>
                        <p className="font-medium">{formatTimeSince(p.last_sync_at)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="text-xs gap-1" disabled={!p.is_connected || syncingProvider === p.provider_name} onClick={() => handleProviderSync(p.provider_name)}>
                        {syncingProvider === p.provider_name ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                        {syncingProvider === p.provider_name ? 'Syncing...' : 'Sync'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* =================== MODELS TAB =================== */}
        <TabsContent value="models">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <Select value={filterProvider} onValueChange={setFilterProvider}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><Filter size={12} className="mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                {uniqueProviders.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterActive} onValueChange={setFilterActive}>
              <SelectTrigger className="w-[120px] h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterInputType} onValueChange={setFilterInputType}>
              <SelectTrigger className="w-[140px] h-9 text-xs"><Layers size={12} className="mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="image_size">image_size</SelectItem>
                <SelectItem value="aspect_ratio">aspect_ratio</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-[10px] text-muted-foreground">{filteredModels.length} models</Badge>
          </div>

          <Card className="border-border/40 bg-card/50">
            {modelsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Model</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Endpoint ID</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Provider</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Input Type</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Quality Tiers</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Ratios</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Default Res</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Cost/Run</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Best For</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Default</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground w-10">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModels.map(m => (
                    <TableRow
                      key={m.id}
                      className="border-border/20 cursor-pointer hover:bg-muted/10 transition-colors"
                      onClick={() => openModelDetail(m)}
                    >
                      <TableCell className="text-[13px] font-medium">{m.model_name}</TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-mono max-w-[180px] truncate">{m.endpoint_id}</TableCell>
                      <TableCell className="text-[12px]">{m.provider_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${m.input_type === 'aspect_ratio' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/20 text-muted-foreground'}`}>
                          {m.input_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                          {(m.supported_quality_tiers || ['1K']).map(q => (
                            <Badge key={q} variant="outline" className="text-[9px] py-0 px-1 bg-primary/10 text-primary border-primary/20">{q}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-0.5 max-w-[140px]">
                          {m.supported_ratios.slice(0, 3).map(r => (
                            <Badge key={r} variant="outline" className="text-[9px] py-0 px-1 bg-muted/10">{r}</Badge>
                          ))}
                          {m.supported_ratios.length > 3 && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-muted/10">+{m.supported_ratios.length - 3}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground font-mono">{m.default_resolution}</TableCell>
                      <TableCell className="text-[13px] font-medium text-primary">${m.cost_per_run?.toFixed(3) ?? '-'}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground max-w-[160px] truncate" title={m.best_for || ''}>{m.best_for}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        {m.is_default ? (
                          <CheckCircle size={14} className="text-emerald-400" />
                        ) : (
                          <button className="text-muted-foreground/30 hover:text-emerald-400 transition-colors" onClick={() => handleToggleDefault(m)}>
                            <CheckCircle size={14} />
                          </button>
                        )}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Switch checked={m.is_active} onCheckedChange={() => handleToggleActive(m)} className="scale-75" />
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openModelDetail(m)}>
                          <Edit size={12} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* =================== ROUTING TAB =================== */}
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

        {/* =================== COSTS TAB =================== */}
        <TabsContent value="costs">
          <Card className="border-border/40 bg-card/50 p-8">
            <div className="flex flex-col items-center justify-center text-center gap-3 py-8">
              <Activity size={32} className="text-muted-foreground" />
              <h3 className="text-lg font-semibold">Cost Tracking</h3>
              <p className="text-sm text-muted-foreground max-w-md">Real-time cost tracking will be available when usage data accumulates.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Model Detail Drawer */}
      <ModelDetailDrawer
        model={selectedModel}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSave={handleSaveModel}
      />
    </div>
  );
}
