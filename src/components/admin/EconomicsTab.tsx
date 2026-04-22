import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Percent, AlertTriangle, Shield } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';

interface GenerationLog {
  id: string;
  user_id: string | null;
  model_id: string | null;
  tool_id: string | null;
  credits_used: number;
  provider_cost: number;
  revenue: number;
  margin: number;
  quality_tier: string | null;
  resolution: string | null;
  actual_api_cost: number;
  revenue_usd: number;
  profit_usd: number;
  margin_pct: number;
  created_at: string;
}

const chartStyle = { background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, fontSize: 12 };
const CREDIT_VALUE = 0.016;

const marginColor = (m: number) => m > 70 ? 'text-emerald-400' : m > 40 ? 'text-yellow-400' : 'text-red-400';
const marginBg = (m: number) => m > 70 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : m > 40 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20';

export default function EconomicsTab() {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [logsRes, modelsRes] = await Promise.all([
        supabase.from('generation_logs').select('*').order('created_at', { ascending: true }),
        supabase.from('models').select('id, model_name, endpoint_id'),
      ]);
      setLogs((logsRes.data as any[]) || []);
      const names: Record<string, string> = {};
      (modelsRes.data || []).forEach((m: any) => { names[m.id] = m.model_name; });
      setModelNames(names);
      setLoading(false);
    }
    fetchData();
  }, []);

  const getRevenue = (l: GenerationLog) => Number(l.revenue_usd) || Number(l.revenue) || (l.credits_used * CREDIT_VALUE);
  const getCost = (l: GenerationLog) => Number(l.actual_api_cost) || Number(l.provider_cost) || 0;

  const totalRevenue = logs.reduce((s, l) => s + getRevenue(l), 0);
  const totalCost = logs.reduce((s, l) => s + getCost(l), 0);
  const totalProfit = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Daily aggregation
  const dailyMap = new Map<string, { revenue: number; cost: number; profit: number }>();
  logs.forEach(l => {
    const d = l.created_at.slice(0, 10);
    const prev = dailyMap.get(d) || { revenue: 0, cost: 0, profit: 0 };
    const rev = getRevenue(l), cost = getCost(l);
    dailyMap.set(d, { revenue: prev.revenue + rev, cost: prev.cost + cost, profit: prev.profit + (rev - cost) });
  });
  const dailyData = Array.from(dailyMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-30)
    .map(([date, v]) => ({ date, revenue: +v.revenue.toFixed(4), cost: +v.cost.toFixed(4), profit: +v.profit.toFixed(4) }));

  // Model breakdown
  const modelMap = new Map<string, { requests: number; cost: number; revenue: number; credits: number }>();
  logs.forEach(l => {
    const key = l.model_id || 'unknown';
    const prev = modelMap.get(key) || { requests: 0, cost: 0, revenue: 0, credits: 0 };
    modelMap.set(key, { requests: prev.requests + 1, cost: prev.cost + getCost(l), revenue: prev.revenue + getRevenue(l), credits: prev.credits + l.credits_used });
  });
  const modelBreakdown = Array.from(modelMap.entries())
    .map(([id, v]) => {
      const profit = v.revenue - v.cost;
      const margin = v.revenue > 0 ? (profit / v.revenue) * 100 : 0;
      return { model: modelNames[id] || id.slice(0, 8), requests: v.requests, avgCost: v.requests > 0 ? v.cost / v.requests : 0, totalCost: v.cost, totalCredits: v.credits, totalRevenue: v.revenue, profit, margin };
    })
    .sort((a, b) => b.requests - a.requests);

  // Quality tier breakdown (no upscale columns)
  const tierMap = new Map<string, { requests: number; totalCost: number; revenue: number }>();
  logs.forEach(l => {
    const key = l.quality_tier || l.resolution || '1K';
    const prev = tierMap.get(key) || { requests: 0, totalCost: 0, revenue: 0 };
    tierMap.set(key, { requests: prev.requests + 1, totalCost: prev.totalCost + getCost(l), revenue: prev.revenue + getRevenue(l) });
  });
  const tierBreakdown = Array.from(tierMap.entries())
    .map(([tier, v]) => ({
      tier, requests: v.requests,
      avgCost: v.requests > 0 ? v.totalCost / v.requests : 0,
      margin: v.revenue > 0 ? ((v.revenue - v.totalCost) / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => { const order = ['1K', '2K', '4K']; return order.indexOf(a.tier) - order.indexOf(b.tier); });

  // GPT Image cost guard
  const gptLogs = logs.filter(l => ['GPT Image 1.5', 'GPT Image 2'].includes(modelNames[l.model_id || '']));
  const gptTotal = gptLogs.length;
  const gptAvgCost = gptTotal > 0 ? gptLogs.reduce((s, l) => s + getCost(l), 0) / gptTotal : 0;
  const gptHighCostAlert = gptLogs.some(l => getCost(l) > 0.020);

  // User breakdown
  const userMap = new Map<string, { credits: number; cost: number; revenue: number }>();
  logs.forEach(l => {
    const key = l.user_id || 'anonymous';
    const prev = userMap.get(key) || { credits: 0, cost: 0, revenue: 0 };
    userMap.set(key, { credits: prev.credits + l.credits_used, cost: prev.cost + getCost(l), revenue: prev.revenue + getRevenue(l) });
  });
  const userBreakdown = Array.from(userMap.entries())
    .map(([user, v]) => ({ user: user.slice(0, 8) + '…', creditsUsed: v.credits, totalCost: v.cost, totalRevenue: v.revenue, profit: v.revenue - v.cost }))
    .sort((a, b) => b.creditsUsed - a.creditsUsed);

  // Tool breakdown
  const toolMap = new Map<string, { runs: number; cost: number; revenue: number }>();
  logs.forEach(l => {
    const key = l.tool_id || 'general';
    const prev = toolMap.get(key) || { runs: 0, cost: 0, revenue: 0 };
    toolMap.set(key, { runs: prev.runs + 1, cost: prev.cost + getCost(l), revenue: prev.revenue + getRevenue(l) });
  });
  const toolBreakdown = Array.from(toolMap.entries())
    .map(([tool, v]) => ({ tool, runs: v.runs, avgCost: v.runs > 0 ? v.cost / v.runs : 0, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0 }))
    .sort((a, b) => b.runs - a.runs);

  if (loading) return <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading economics data…</div>;
  if (logs.length === 0) return <div className="text-center py-12 text-muted-foreground"><p className="text-sm">No generation logs yet.</p></div>;

  const fmt = (v: number) => `$${v.toFixed(4)}`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue (USD)', value: fmt(totalRevenue), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Cost (USD)', value: fmt(totalCost), icon: TrendingDown, color: 'text-red-400' },
          { label: 'Net Profit (USD)', value: fmt(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Avg Margin %', value: fmtPct(marginPct), icon: Percent, color: marginColor(marginPct) },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><s.icon size={16} className={s.color} /></div>
              <div><p className="text-lg font-bold">{s.value}</p><p className="text-[11px] text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily Revenue vs Cost Chart */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue vs Cost (Daily — Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={chartStyle} formatter={(v: number) => `$${v.toFixed(4)}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(142,70%,45%)" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="cost" stroke="hsl(0,70%,50%)" strokeWidth={2} dot={false} name="Cost" />
              <Line type="monotone" dataKey="profit" stroke="hsl(210,70%,50%)" strokeWidth={2} dot={false} name="Profit" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost by Model */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Cost by Model</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Generations</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelBreakdown.map(r => (
                <TableRow key={r.model}>
                  <TableCell className="font-medium text-xs">{r.model}</TableCell>
                  <TableCell className="text-right text-xs">{r.requests}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.avgCost)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.totalCost)}</TableCell>
                  <TableCell className="text-right text-xs">{r.totalCredits}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.totalRevenue)}</TableCell>
                  <TableCell className={`text-right text-xs ${r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.profit)}</TableCell>
                  <TableCell className="text-right text-xs"><Badge variant="outline" className={`text-[10px] ${marginBg(r.margin)}`}>{fmtPct(r.margin)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Resolution Tier Breakdown */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Cost by Resolution</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resolution</TableHead>
                <TableHead className="text-right">Generations</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tierBreakdown.map(r => (
                <TableRow key={r.tier}>
                  <TableCell className="font-medium text-xs">{r.tier}</TableCell>
                  <TableCell className="text-right text-xs">{r.requests}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.avgCost)}</TableCell>
                  <TableCell className="text-right text-xs"><Badge variant="outline" className={`text-[10px] ${marginBg(r.margin)}`}>{fmtPct(r.margin)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* GPT Image Cost Guard */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield size={14} className="text-primary" />
            GPT Image Cost Guard
          </CardTitle>
        </CardHeader>
        <CardContent>
          {gptTotal === 0 ? (
            <p className="text-xs text-muted-foreground">No GPT Image generations yet.</p>
          ) : (
            <div className="space-y-3">
              {gptHighCostAlert && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={16} className="text-red-400" />
                  <p className="text-xs text-red-400 font-medium">⚠️ ALERT: A generation exceeded $0.020 — check cost guard!</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div><p className="text-[10px] text-muted-foreground uppercase">Total Generations</p><p className="text-lg font-bold">{gptTotal}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Avg Cost/Gen</p><p className={`text-lg font-bold ${gptAvgCost <= 0.020 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(gptAvgCost)}</p></div>
                <div><p className="text-[10px] text-muted-foreground uppercase">Status</p><p className={`text-lg font-bold ${gptAvgCost <= 0.020 ? 'text-emerald-400' : 'text-red-400'}`}>{gptAvgCost <= 0.020 ? '✅ Safe' : '⚠️ Over Budget'}</p></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost by User */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Cost by User</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="text-right">Credits Used</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userBreakdown.map(r => (
                <TableRow key={r.user}>
                  <TableCell className="font-mono text-xs">{r.user}</TableCell>
                  <TableCell className="text-right text-xs">{r.creditsUsed}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.totalCost)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.totalRevenue)}</TableCell>
                  <TableCell className={`text-right text-xs ${r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.profit)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost by Tool */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Cost by Tool</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead className="text-right">Avg Cost</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolBreakdown.map(r => (
                <TableRow key={r.tool}>
                  <TableCell className="font-medium text-xs">{r.tool}</TableCell>
                  <TableCell className="text-right text-xs">{r.runs}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.avgCost)}</TableCell>
                  <TableCell className="text-right text-xs"><Badge variant="outline" className={`text-[10px] ${marginBg(r.margin)}`}>{fmtPct(r.margin)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
