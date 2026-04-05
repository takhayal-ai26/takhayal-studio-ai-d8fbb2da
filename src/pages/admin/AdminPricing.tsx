import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import {
  DollarSign, TrendingUp, AlertTriangle, Percent, Coins,
  Settings2, Save, RefreshCw, Cpu, Wrench, Zap, BarChart3, Clock, Loader2, Pencil, X
} from 'lucide-react';
import { usePricingTiers } from '@/hooks/usePricingTiers';
import { useToolProviders } from '@/hooks/useToolProviders';
import { PricingMatrixCard } from '@/components/admin/PricingMatrixCard';
import PricingMatrixPage from '@/components/admin/PricingMatrixPage';

/* ───── types ───── */
interface CreditSettings {
  id: string;
  credit_value_usd: number;
  default_credits_per_generation: number;
  min_credits_per_action: number;
  rounding_rule: string;
}

interface ModelRow {
  id: string;
  model_name: string;
  endpoint_id: string;
  provider_name: string;
  cost_per_run: number | null;
  credits_per_generation: number | null;
  is_active: boolean;
  input_type: string;
  speed: string | null;
  best_for: string | null;
  supported_ratios: string[];
  supported_sizes: string[];
  default_ratio: string | null;
  default_resolution: string | null;
  max_resolution: string | null;
  last_sync_at: string | null;
  pricing_mode: string;
}

interface ToolPricing {
  id: string;
  tool_id: string;
  tool_name: string;
  default_model_id: string | null;
  credits_per_generation: number;
  credit_multiplier: number;
  override_model_pricing: boolean;
  free_usage_enabled: boolean;
  max_free_uses: number;
}

interface ProviderRow {
  id: string;
  provider_name: string;
  pricing_type: string | null;
  base_cost: number | null;
  currency: string | null;
  fallback_cost: number | null;
  billing_notes: string | null;
  health_status: string;
  is_connected: boolean;
}

interface GenStats {
  total_generations: number;
  total_cost: number;
  total_revenue: number;
  total_margin: number;
}

/* ───── metric card ───── */
function MetricCard({ label, value, sub, icon: Icon, color = 'primary' }: { label: string; value: string; sub?: string; icon: any; color?: string }) {
  const colorClasses: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-red-500/10 text-red-400',
    yellow: 'bg-amber-500/10 text-amber-400',
  };
  return (
    <div className="rounded-2xl border border-border/10 bg-card/80 p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon size={18} />
        </div>
        <span className="text-[12px] text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="typo-heading-page">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

/* ───── Tool Provider Margins Tab ───── */
function ToolProviderMarginsTab({ creditVal }: { creditVal: number }) {
  const { providers, activeProviders, updateProvider, isLoading } = useToolProviders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState(0);
  const [editActive, setEditActive] = useState(true);

  const startEdit = (p: any) => {
    setEditingId(p.id);
    setEditCredits(p.credit_cost);
    setEditActive(p.is_active);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      await updateProvider.mutateAsync({ id: editingId, updates: { credit_cost: editCredits, is_active: editActive } });
      toast.success('Provider updated');
      setEditingId(null);
    } catch (e) { toast.error('Failed to save'); }
  };

  if (isLoading) return <div className="py-8 text-center text-muted-foreground text-sm">Loading tool providers…</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Edit credits and availability for each tool provider. Margin auto-calculates from credit value (${creditVal}/credit).</p>
      <div className="rounded-2xl border border-border/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border/10 bg-muted/5">
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Tool</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Provider</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Tier</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">API Cost</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Credits</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Revenue</th>
            <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Margin %</th>
            <th className="text-center px-4 py-3 text-xs text-muted-foreground font-medium">Active</th>
            <th className="px-4 py-3"></th>
          </tr></thead>
          <tbody>
            {providers.map(p => {
              const isEditing = editingId === p.id;
              const cr = isEditing ? editCredits : p.credit_cost;
              const rev = cr * creditVal;
              const margin = rev > 0 ? ((rev - p.internal_cost_usd) / rev * 100) : 0;
              return (
                <tr key={p.id} className={`border-b border-border/5 hover:bg-muted/5 ${!p.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-3 font-medium text-foreground">{p.display_name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.provider_name}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{p.tier}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">${p.internal_cost_usd.toFixed(4)}</td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <Input type="number" min={1} max={999} className="w-16 h-8 text-xs" value={editCredits} onChange={e => setEditCredits(Math.max(1, Number(e.target.value)))} />
                    ) : (
                      <span className="font-semibold">{p.credit_cost}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-emerald-400">${rev.toFixed(4)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={margin < 0 ? 'destructive' : margin < 20 ? 'secondary' : 'default'} className="text-[10px]">{margin.toFixed(1)}%</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isEditing ? (
                      <Switch checked={editActive} onCheckedChange={setEditActive} />
                    ) : (
                      <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px]">{p.is_active ? 'On' : 'Off'}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 text-xs gap-1"><Save size={12} />Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs"><X size={12} /></Button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/20 transition-all">
                        <Pencil size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {providers.length === 0 && (
              <tr><td colSpan={9} className="text-center py-8 text-muted-foreground text-sm">No tool providers configured.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════ MAIN ═══════ */
export default function AdminPricing() {
  const [tab, setTab] = useState('overview');
  const [creditSettings, setCreditSettings] = useState<CreditSettings | null>(null);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [tools, setTools] = useState<ToolPricing[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [stats, setStats] = useState<GenStats>({ total_generations: 0, total_cost: 0, total_revenue: 0, total_margin: 0 });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const { allTiers, syncLogs, addTier, updateTier, deleteTier, reload: reloadTiers, reloadLogs } = usePricingTiers();

  const load = useCallback(async () => {
    const [csRes, mRes, tRes, pRes, sRes] = await Promise.all([
      supabase.from('credit_settings').select('*').limit(1).single(),
      supabase.from('models').select('*').order('model_name'),
      supabase.from('tools_pricing').select('*').order('tool_name'),
      supabase.from('provider_configs').select('*'),
      supabase.from('generation_logs').select('credits_used, provider_cost, revenue, margin'),
    ]);
    if (csRes.data) setCreditSettings(csRes.data as CreditSettings);
    if (mRes.data) setModels(mRes.data as unknown as ModelRow[]);
    if (tRes.data) setTools(tRes.data as unknown as ToolPricing[]);
    if (pRes.data) setProviders(pRes.data as unknown as ProviderRow[]);
    if (sRes.data) {
      const logs = sRes.data as any[];
      setStats({
        total_generations: logs.length,
        total_cost: logs.reduce((s, l) => s + (l.provider_cost || 0), 0),
        total_revenue: logs.reduce((s, l) => s + (l.revenue || 0), 0),
        total_margin: logs.reduce((s, l) => s + (l.margin || 0), 0),
      });
    }
    reloadTiers();
    reloadLogs();
  }, [reloadTiers, reloadLogs]);

  useEffect(() => { load(); }, [load]);

  const saveCreditSettings = async () => {
    if (!creditSettings) return;
    setSaving(true);
    const { error } = await supabase.from('credit_settings').update({
      credit_value_usd: creditSettings.credit_value_usd,
      default_credits_per_generation: creditSettings.default_credits_per_generation,
      min_credits_per_action: creditSettings.min_credits_per_action,
      rounding_rule: creditSettings.rounding_rule,
      updated_at: new Date().toISOString(),
    }).eq('id', creditSettings.id);
    setSaving(false);
    if (error) toast.error('Failed to save'); else toast.success('Credit settings saved');
  };

  const updateModelCredits = async (id: string, credits: number) => {
    const { error } = await supabase.from('models').update({ credits_per_generation: credits, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('Failed'); else { setModels(prev => prev.map(m => m.id === id ? { ...m, credits_per_generation: credits } : m)); toast.success('Updated'); }
  };

  const updateTool = async (t: ToolPricing) => {
    const { error } = await supabase.from('tools_pricing').update({
      credits_per_generation: t.credits_per_generation,
      credit_multiplier: t.credit_multiplier,
      override_model_pricing: t.override_model_pricing,
      free_usage_enabled: t.free_usage_enabled,
      max_free_uses: t.max_free_uses,
      default_model_id: t.default_model_id,
      updated_at: new Date().toISOString(),
    }).eq('id', t.id);
    if (error) toast.error('Failed'); else toast.success('Tool pricing saved');
  };

  const updateProvider = async (p: ProviderRow) => {
    const { error } = await supabase.from('provider_configs').update({
      pricing_type: p.pricing_type,
      base_cost: p.base_cost,
      currency: p.currency,
      fallback_cost: p.fallback_cost,
      billing_notes: p.billing_notes,
      updated_at: new Date().toISOString(),
    }).eq('id', p.id);
    if (error) toast.error('Failed'); else toast.success('Provider updated');
  };

  const avgMarginPct = stats.total_revenue > 0 ? ((stats.total_margin / stats.total_revenue) * 100).toFixed(1) : '0';
  const creditVal = creditSettings?.credit_value_usd || 0.02;

  const modelMargin = (m: ModelRow) => {
    const cr = m.credits_per_generation || creditSettings?.default_credits_per_generation || 2;
    const rev = cr * creditVal;
    const cost = m.cost_per_run || 0;
    return { rev, cost, margin: rev - cost, pct: rev > 0 ? ((rev - cost) / rev * 100) : 0 };
  };

  const seedTools = async () => {
    const defaults = [
      { tool_id: 'generate-image', tool_name: 'Generate Image', credits_per_generation: 2 },
      { tool_id: 'upscale', tool_name: 'Upscale', credits_per_generation: 3 },
      { tool_id: 'remove-bg', tool_name: 'Remove Background', credits_per_generation: 1 },
      { tool_id: 'create-logo', tool_name: 'Create Logo', credits_per_generation: 4 },
    ];
    for (const d of defaults) {
      await supabase.from('tools_pricing').upsert(d, { onConflict: 'tool_id' });
    }
    toast.success('Default tools seeded');
    load();
  };

  const syncStatusColor: Record<string, string> = {
    success: 'text-emerald-400 bg-emerald-500/10',
    partial: 'text-amber-400 bg-amber-500/10',
    failed: 'text-red-400 bg-red-500/10',
    pending: 'text-muted-foreground bg-muted/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="typo-heading-page">Pricing & Economics</h1>
          <p className="text-sm text-muted-foreground mt-1">Control pricing at provider, model, and tool level</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw size={14} />Refresh</Button>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard label="Total Revenue" value={`$${stats.total_revenue.toFixed(2)}`} icon={DollarSign} color="green" />
        <MetricCard label="Total COGS" value={`$${stats.total_cost.toFixed(2)}`} icon={TrendingUp} color="red" />
        <MetricCard label="Total Profit" value={`$${stats.total_margin.toFixed(2)}`} icon={DollarSign} color={stats.total_margin >= 0 ? 'green' : 'red'} />
        <MetricCard label="Avg Margin" value={`${avgMarginPct}%`} icon={Percent} color={Number(avgMarginPct) < 20 ? 'yellow' : 'green'} />
        <MetricCard label="Generations" value={String(stats.total_generations)} icon={BarChart3} />
      </div>

      {/* Alerts */}
      {models.filter(m => m.is_active && modelMargin(m).pct < 0).length > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-400" />
          <span className="text-sm text-red-400">
            {models.filter(m => m.is_active && modelMargin(m).pct < 0).length} model(s) have negative margins!
          </span>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-card/80 border border-border/10">
          <TabsTrigger value="overview" className="gap-1.5"><Settings2 size={14} />Credit System</TabsTrigger>
          <TabsTrigger value="providers" className="gap-1.5"><Zap size={14} />Providers</TabsTrigger>
          <TabsTrigger value="models" className="gap-1.5"><Cpu size={14} />Models</TabsTrigger>
          <TabsTrigger value="matrix" className="gap-1.5"><BarChart3 size={14} />Pricing Matrix</TabsTrigger>
          <TabsTrigger value="tool_providers" className="gap-1.5"><Wrench size={14} />Tool Provider Margins</TabsTrigger>
          <TabsTrigger value="tools" className="gap-1.5"><Wrench size={14} />Tools</TabsTrigger>
          <TabsTrigger value="sync" className="gap-1.5"><Clock size={14} />Sync Logs</TabsTrigger>
        </TabsList>

        {/* ── CREDIT SYSTEM ── */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="rounded-2xl border border-border/10 bg-card/80 p-6 max-w-lg space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Coins size={18} className="text-primary" />Global Credit Settings</h3>
            {creditSettings && (
              <>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">1 Credit = USD</label>
                    <Input type="number" step="0.001" value={creditSettings.credit_value_usd} onChange={e => setCreditSettings({ ...creditSettings, credit_value_usd: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Default Credits per Generation</label>
                    <Input type="number" value={creditSettings.default_credits_per_generation} onChange={e => setCreditSettings({ ...creditSettings, default_credits_per_generation: Number(e.target.value) })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Min Credits per Action</label>
                    <Input type="number" value={creditSettings.min_credits_per_action} onChange={e => setCreditSettings({ ...creditSettings, min_credits_per_action: Number(e.target.value) })} className="mt-1" />
                  </div>
                </div>
                <Button onClick={saveCreditSettings} disabled={saving} className="gap-2"><Save size={14} />{saving ? 'Saving...' : 'Save Settings'}</Button>
              </>
            )}
          </div>
          <div className="rounded-xl border border-border/10 bg-card/60 p-4 text-xs text-muted-foreground space-y-1">
            <p><strong>Pricing Hierarchy:</strong></p>
            <p>1. Tool override (highest) → 2. Model pricing tier (quality-based) → 3. Model base pricing → 4. Provider fallback</p>
          </div>
        </TabsContent>

        {/* ── PROVIDERS ── */}
        <TabsContent value="providers" className="mt-4">
          <div className="rounded-2xl border border-border/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/10 bg-muted/5">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Pricing Type</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Base Cost</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Currency</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Fallback Cost</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Notes</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {providers.map(p => (
                  <tr key={p.id} className="border-b border-border/5 hover:bg-muted/5">
                    <td className="px-4 py-3 font-medium text-foreground">{p.provider_name}</td>
                    <td className="px-4 py-3">
                      <select value={p.pricing_type || 'per_image'} onChange={e => setProviders(prev => prev.map(x => x.id === p.id ? { ...x, pricing_type: e.target.value } : x))} className="bg-background border border-border/20 rounded px-2 py-1 text-xs">
                        <option value="per_image">Per Image</option>
                        <option value="per_request">Per Request</option>
                        <option value="per_second">Per Second</option>
                        <option value="per_megapixel">Per Megapixel</option>
                      </select>
                    </td>
                    <td className="px-4 py-3"><Input type="number" step="0.001" className="w-24 h-8 text-xs" value={p.base_cost || 0} onChange={e => setProviders(prev => prev.map(x => x.id === p.id ? { ...x, base_cost: Number(e.target.value) } : x))} /></td>
                    <td className="px-4 py-3"><Input className="w-16 h-8 text-xs" value={p.currency || 'USD'} onChange={e => setProviders(prev => prev.map(x => x.id === p.id ? { ...x, currency: e.target.value } : x))} /></td>
                    <td className="px-4 py-3"><Input type="number" step="0.001" className="w-24 h-8 text-xs" value={p.fallback_cost || 0} onChange={e => setProviders(prev => prev.map(x => x.id === p.id ? { ...x, fallback_cost: Number(e.target.value) } : x))} /></td>
                    <td className="px-4 py-3"><Input className="w-32 h-8 text-xs" value={p.billing_notes || ''} onChange={e => setProviders(prev => prev.map(x => x.id === p.id ? { ...x, billing_notes: e.target.value } : x))} /></td>
                    <td className="px-4 py-3"><Badge variant={p.is_connected ? 'default' : 'secondary'} className="text-[10px]">{p.health_status}</Badge></td>
                    <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => updateProvider(p)} className="h-7 text-xs gap-1"><Save size={12} />Save</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── MODELS ── */}
        <TabsContent value="models" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Model capabilities & pricing from fal.ai API + admin overrides</p>
            <Button variant="outline" size="sm" className="gap-2 text-xs" disabled={syncing} onClick={async () => {
              setSyncing(true);
              try {
                const { data, error } = await supabase.functions.invoke('sync-models', { body: {} });
                const result = data as any;
                toast.success(`Synced ${result.models_synced}/${result.models_checked} models, ${result.tiers_synced || 0} pricing tiers`);
                load();
              } catch (e: any) { toast.error(e.message); }
              finally { setSyncing(false); }
            }}>
              {syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Sync All Models
            </Button>
          </div>
          <div className="rounded-2xl border border-border/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/10 bg-muted/5">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Model</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Input</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Quality Tiers</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Ratios</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Cost</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Credits</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Margin %</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Tiers</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Synced</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Active</th>
              </tr></thead>
              <tbody>
                {models.map(m => {
                  const mm = modelMargin(m);
                  const cr = m.credits_per_generation || creditSettings?.default_credits_per_generation || 2;
                  const tierCount = (allTiers[m.id] || []).length;
                  const isExpanded = expandedModel === m.id;
                  return (
                    <>
                      <tr key={m.id} className="border-b border-border/5 hover:bg-muted/5 cursor-pointer" onClick={() => setExpandedModel(isExpanded ? null : m.id)}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">{m.model_name}</p>
                          <p className="text-[11px] text-muted-foreground font-mono">{m.endpoint_id}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] ${m.input_type === 'aspect_ratio' ? 'bg-primary/10 text-primary border-primary/20' : ''}`}>{m.input_type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                            {((m as any).supported_quality_tiers || ['1K']).map((q: string) => <Badge key={q} variant="outline" className="text-[9px] py-0 px-1 bg-primary/10 text-primary border-primary/20">{q}</Badge>)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-0.5 max-w-[120px]">
                            {(m.supported_ratios || []).slice(0, 3).map(r => <Badge key={r} variant="outline" className="text-[9px] py-0 px-1">{r}</Badge>)}
                            {(m.supported_ratios || []).length > 3 && <Badge variant="outline" className="text-[9px] py-0 px-1">+{m.supported_ratios.length - 3}</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">${(m.cost_per_run || 0).toFixed(4)}</td>
                        <td className="px-4 py-3">
                          <Input type="number" className="w-16 h-8 text-xs" value={cr} onClick={e => e.stopPropagation()} onChange={e => updateModelCredits(m.id, Number(e.target.value))} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={mm.pct < 0 ? 'destructive' : mm.pct < 20 ? 'secondary' : 'default'} className="text-[10px]">{mm.pct.toFixed(1)}%</Badge>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{tierCount}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-muted-foreground">{m.last_sync_at ? formatDate(m.last_sync_at) : '-'}</td>
                        <td className="px-4 py-3"><Badge variant={m.is_active ? 'default' : 'secondary'} className="text-[10px]">{m.is_active ? 'Active' : 'Off'}</Badge></td>
                      </tr>
                      {isExpanded && (
                        <tr key={m.id + '-detail'} className="bg-muted/5 border-b border-border/10">
                          <td colSpan={10} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Supported Ratios</p>
                                <div className="flex flex-wrap gap-1">{(m.supported_ratios || []).map(r => <Badge key={r} variant="outline" className="text-[10px]">{r}</Badge>)}</div>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Supported Sizes</p>
                                <div className="flex flex-wrap gap-1">{(m.supported_sizes || []).length > 0 ? m.supported_sizes.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>) : <span className="text-muted-foreground">—</span>}</div>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Default Ratio / Resolution</p>
                                <p className="text-foreground">{m.default_ratio || '—'} / {m.default_resolution || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Max Resolution</p>
                                <p className="text-foreground">{m.max_resolution || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Speed</p>
                                <p className="text-foreground">{m.speed || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Best For</p>
                                <p className="text-foreground">{m.best_for || '—'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Pricing Mode</p>
                                <p className="text-foreground">{m.pricing_mode}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">Economics</p>
                                <p className="text-foreground">Cost: ${(m.cost_per_run || 0).toFixed(4)} → Rev: ${mm.rev.toFixed(4)} → <span className={mm.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}>Margin: ${mm.margin.toFixed(4)}</span></p>
                              </div>
                            </div>
                            {tierCount > 0 && (
                              <div className="mt-4">
                                <p className="text-muted-foreground font-medium text-xs mb-2">Pricing Tiers ({tierCount})</p>
                                {/* Show pricing notes if available */}
                                {(m as any).admin_overrides?.pricing_notes && (
                                  <p className="text-[11px] text-amber-400/80 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-1.5 mb-2 italic">
                                    Provider Note: {(m as any).admin_overrides.pricing_notes}
                                  </p>
                                )}
                                <div className="rounded-lg border border-border/10 overflow-hidden">
                                  <table className="w-full text-xs">
                                    <thead><tr className="bg-muted/10">
                                      <th className="text-left px-3 py-2 text-muted-foreground">Tier</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Quality</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Resolution</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Multiplier</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Provider Cost</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Credits</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Revenue</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Margin</th>
                                      <th className="text-left px-3 py-2 text-muted-foreground">Margin %</th>
                                    </tr></thead>
                                    <tbody>
                                      {(allTiers[m.id] || []).map(t => {
                                        const tRev = t.credits_charged * creditVal;
                                        const tMargin = tRev - t.cost_per_run;
                                        const tMarginPct = tRev > 0 ? (tMargin / tRev * 100) : 0;
                                        // Extract multiplier from notes field
                                        const multiplierMatch = t.notes?.match(/multiplier:([\d.]+)/);
                                        const multiplier = multiplierMatch ? parseFloat(multiplierMatch[1]) : 1;
                                        return (
                                          <tr key={t.id} className="border-t border-border/5">
                                            <td className="px-3 py-2 font-medium">
                                              {t.tier_label}
                                              {t.is_default && <Badge variant="outline" className="ml-1 text-[8px] py-0 px-1">Default</Badge>}
                                            </td>
                                            <td className="px-3 py-2">{t.quality_level || '—'}</td>
                                            <td className="px-3 py-2 font-mono">{t.resolution_key || '—'}</td>
                                            <td className="px-3 py-2">
                                              <Badge variant={multiplier > 1 ? 'secondary' : 'outline'} className="text-[9px]">{multiplier}x</Badge>
                                            </td>
                                            <td className="px-3 py-2">${t.cost_per_run.toFixed(4)}</td>
                                            <td className="px-3 py-2 font-medium">{t.credits_charged}</td>
                                            <td className="px-3 py-2 text-emerald-400">${tRev.toFixed(4)}</td>
                                            <td className={`px-3 py-2 ${tMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>${tMargin.toFixed(4)}</td>
                                            <td className="px-3 py-2">
                                              <Badge variant={tMarginPct < 0 ? 'destructive' : tMarginPct < 20 ? 'secondary' : 'default'} className="text-[9px]">{tMarginPct.toFixed(1)}%</Badge>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── PRICING MATRIX ── */}
        <TabsContent value="matrix" className="mt-4 space-y-4">
          <PricingMatrixPage />
        </TabsContent>

        {/* ── TOOL PROVIDER MARGINS ── */}
        <TabsContent value="tool_providers" className="mt-4 space-y-4">
          <ToolProviderMarginsTab creditVal={creditVal} />
        </TabsContent>

        {/* ── TOOLS ── */}
        <TabsContent value="tools" className="mt-4 space-y-4">
          {tools.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">No tool pricing configured yet</p>
              <Button onClick={seedTools} className="gap-2"><Zap size={14} />Seed Default Tools</Button>
            </div>
          )}
          {tools.length > 0 && (
            <div className="rounded-2xl border border-border/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border/10 bg-muted/5">
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Tool</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Credits</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Multiplier</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Override Model</th>
                  <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Free Uses</th>
                  <th className="px-4 py-3"></th>
                </tr></thead>
                <tbody>
                  {tools.map(t => (
                    <tr key={t.id} className="border-b border-border/5 hover:bg-muted/5">
                      <td className="px-4 py-3 font-medium text-foreground">{t.tool_name}</td>
                      <td className="px-4 py-3"><Input type="number" className="w-16 h-8 text-xs" value={t.credits_per_generation} onChange={e => setTools(prev => prev.map(x => x.id === t.id ? { ...x, credits_per_generation: Number(e.target.value) } : x))} /></td>
                      <td className="px-4 py-3"><Input type="number" step="0.1" className="w-16 h-8 text-xs" value={t.credit_multiplier} onChange={e => setTools(prev => prev.map(x => x.id === t.id ? { ...x, credit_multiplier: Number(e.target.value) } : x))} /></td>
                      <td className="px-4 py-3"><Switch checked={t.override_model_pricing} onCheckedChange={v => setTools(prev => prev.map(x => x.id === t.id ? { ...x, override_model_pricing: v } : x))} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch checked={t.free_usage_enabled} onCheckedChange={v => setTools(prev => prev.map(x => x.id === t.id ? { ...x, free_usage_enabled: v } : x))} />
                          {t.free_usage_enabled && <Input type="number" className="w-14 h-8 text-xs" value={t.max_free_uses} onChange={e => setTools(prev => prev.map(x => x.id === t.id ? { ...x, max_free_uses: Number(e.target.value) } : x))} />}
                        </div>
                      </td>
                      <td className="px-4 py-3"><Button size="sm" variant="ghost" onClick={() => updateTool(t)} className="h-7 text-xs gap-1"><Save size={12} />Save</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── SYNC LOGS ── */}
        <TabsContent value="sync" className="mt-4">
          <div className="rounded-2xl border border-border/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border/10 bg-muted/5">
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Provider</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Status</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Models Synced</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Error</th>
                <th className="text-left px-4 py-3 text-xs text-muted-foreground font-medium">Time</th>
              </tr></thead>
              <tbody>
                {syncLogs.map(log => (
                  <tr key={log.id} className="border-b border-border/5 hover:bg-muted/5">
                    <td className="px-4 py-3 font-medium text-foreground">{log.provider_name}</td>
                    <td className="px-4 py-3">
                      <Badge className={`text-[10px] ${syncStatusColor[log.sync_status] || ''}`}>{log.sync_status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{log.synced_models_count}</td>
                    <td className="px-4 py-3 text-[11px] text-red-400 max-w-[200px] truncate">{log.error_message || '-'}</td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {syncLogs.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No sync logs yet. Run "Sync from fal" in Models & Providers.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
