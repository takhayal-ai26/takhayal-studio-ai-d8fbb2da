import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DollarSign, TrendingUp, Percent, BarChart3, RefreshCw, Grid3X3, Pencil, Save, X } from 'lucide-react';
import { useToolProviders, type ToolProvider } from '@/hooks/useToolProviders';
import EconomicsTab from '@/components/admin/EconomicsTab';
import PricingMatrixPage from '@/components/admin/PricingMatrixPage';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const CREDIT_VALUE_USD = 0.016;

function ToolProviderMarginsEditable({ providers: allProviders }: { providers: ToolProvider[] }) {
  const { updateProvider } = useToolProviders();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCredits, setEditCredits] = useState(0);
  const [editActive, setEditActive] = useState(true);

  const startEdit = (p: ToolProvider) => {
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
    } catch { toast.error('Failed to save'); }
  };

  return (
    <Card className="border-border/40 bg-card/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Tool Provider Pricing</CardTitle>
        <p className="text-xs text-muted-foreground">Edit credits and toggle availability. Margin auto-calculates at ${CREDIT_VALUE_USD}/credit.</p>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Provider</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Tier</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Cost ($)</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Revenue ($)</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Margin</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
            <TableHead className="text-[11px] uppercase text-muted-foreground w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allProviders.map(p => {
            const isEditing = editingId === p.id;
            const cr = isEditing ? editCredits : p.credit_cost;
            const revenue = cr * CREDIT_VALUE_USD;
            const margin = revenue - p.internal_cost_usd;
            const marginPct = revenue > 0 ? (margin / revenue * 100) : 0;
            const marginColor = marginPct > 70 ? 'text-emerald-400' : marginPct > 40 ? 'text-yellow-400' : 'text-red-400';
            return (
              <TableRow key={p.id} className={`border-border/20 ${!p.is_active && !isEditing ? 'opacity-40' : ''}`}>
                <TableCell className="text-[13px] font-medium">{p.display_name}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground font-mono">{p.provider_endpoint}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{p.tier}</Badge></TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="number" min={1} max={999} className="w-16 h-7 text-xs" value={editCredits} onChange={e => setEditCredits(Math.max(1, Number(e.target.value)))} />
                  ) : (
                    <span className="font-semibold text-[13px]">{p.credit_cost}</span>
                  )}
                </TableCell>
                <TableCell className="text-[13px]">${p.internal_cost_usd.toFixed(4)}</TableCell>
                <TableCell className="text-[13px]">${revenue.toFixed(4)}</TableCell>
                <TableCell className={`text-[13px] font-medium ${marginColor}`}>{marginPct.toFixed(0)}%</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Switch checked={editActive} onCheckedChange={setEditActive} />
                  ) : (
                    <Badge variant={p.is_active ? 'default' : 'secondary'} className="text-[10px]">
                      {p.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={saveEdit} className="h-7 text-xs gap-1"><Save size={12} />Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="h-7 text-xs"><X size={12} /></Button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/20 transition-all"><Pencil size={12} /></button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {allProviders.length === 0 && (
            <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No providers configured</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

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

export default function AdminCommerce() {
  const [stats, setStats] = useState({ total_generations: 0, total_cost: 0, total_revenue: 0, total_margin: 0 });
  const { providers } = useToolProviders();

  const load = useCallback(async () => {
    const { data } = await supabase.from('generation_logs').select('credits_used, provider_cost, revenue, margin');
    if (data) {
      setStats({
        total_generations: data.length,
        total_cost: data.reduce((s, l: any) => s + (l.provider_cost || 0), 0),
        total_revenue: data.reduce((s, l: any) => s + (l.revenue || 0), 0),
        total_margin: data.reduce((s, l: any) => s + (l.margin || 0), 0),
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const avgMarginPct = stats.total_revenue > 0 ? ((stats.total_margin / stats.total_revenue) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="typo-heading-page">Commerce</h1>
          <p className="text-sm text-muted-foreground mt-1">Pricing matrix, revenue, costs, and margins</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-2"><RefreshCw size={14} />Refresh</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Revenue (USD)" value={`$${stats.total_revenue.toFixed(2)}`} icon={DollarSign} color="green" />
        <MetricCard label="Total COGS" value={`$${stats.total_cost.toFixed(2)}`} icon={TrendingUp} color="red" />
        <MetricCard label="Total Profit" value={`$${stats.total_margin.toFixed(2)}`} icon={DollarSign} color={stats.total_margin >= 0 ? 'green' : 'red'} />
        <MetricCard label="Avg Margin" value={`${avgMarginPct}%`} icon={Percent} color={Number(avgMarginPct) < 20 ? 'yellow' : 'green'} />
      </div>

      <Tabs defaultValue="pricing-matrix">
        <TabsList className="bg-card/80 border border-border/10">
          <TabsTrigger value="pricing-matrix" className="gap-1.5"><Grid3X3 size={14} />Pricing Matrix</TabsTrigger>
          <TabsTrigger value="economics" className="gap-1.5"><BarChart3 size={14} />Economics</TabsTrigger>
          <TabsTrigger value="providers" className="gap-1.5"><DollarSign size={14} />Tool Provider Margins</TabsTrigger>
        </TabsList>

        <TabsContent value="pricing-matrix" className="mt-4">
          <PricingMatrixPage />
        </TabsContent>

        <TabsContent value="economics" className="mt-4">
          <EconomicsTab />
        </TabsContent>

        <TabsContent value="providers" className="mt-4">
          <ToolProviderMarginsEditable providers={providers} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
