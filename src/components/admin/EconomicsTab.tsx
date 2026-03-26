import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, TrendingUp, TrendingDown, Percent } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
  resolution: string | null;
  created_at: string;
}

interface DailyData {
  date: string;
  revenue: number;
  cost: number;
}

interface ModelBreakdown {
  model: string;
  requests: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  margin: number;
}

interface UserBreakdown {
  user: string;
  creditsUsed: number;
  totalCost: number;
  totalRevenue: number;
  profit: number;
}

interface ToolBreakdown {
  tool: string;
  runs: number;
  avgCost: number;
  avgRevenue: number;
  margin: number;
}

const chartStyle = { background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, fontSize: 12 };

export default function EconomicsTab() {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [logsRes, modelsRes] = await Promise.all([
        supabase.from('generation_logs').select('*').order('created_at', { ascending: true }),
        supabase.from('models').select('id, model_name'),
      ]);
      setLogs((logsRes.data as GenerationLog[]) || []);
      const names: Record<string, string> = {};
      (modelsRes.data || []).forEach((m: any) => { names[m.id] = m.model_name; });
      setModelNames(names);
      setLoading(false);
    }
    fetchData();
  }, []);

  const totalRevenue = logs.reduce((s, l) => s + Number(l.revenue), 0);
  const totalCost = logs.reduce((s, l) => s + Number(l.provider_cost), 0);
  const totalProfit = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Daily aggregation
  const dailyMap = new Map<string, { revenue: number; cost: number }>();
  logs.forEach(l => {
    const d = l.created_at.slice(0, 10);
    const prev = dailyMap.get(d) || { revenue: 0, cost: 0 };
    dailyMap.set(d, { revenue: prev.revenue + Number(l.revenue), cost: prev.cost + Number(l.provider_cost) });
  });
  const dailyData: DailyData[] = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, revenue: +v.revenue.toFixed(4), cost: +v.cost.toFixed(4) }));

  // Model breakdown
  const modelMap = new Map<string, { requests: number; cost: number; revenue: number }>();
  logs.forEach(l => {
    const key = l.model_id || 'unknown';
    const prev = modelMap.get(key) || { requests: 0, cost: 0, revenue: 0 };
    modelMap.set(key, { requests: prev.requests + 1, cost: prev.cost + Number(l.provider_cost), revenue: prev.revenue + Number(l.revenue) });
  });
  const modelBreakdown: ModelBreakdown[] = Array.from(modelMap.entries())
    .map(([id, v]) => {
      const profit = v.revenue - v.cost;
      return { model: modelNames[id] || id, requests: v.requests, totalCost: v.cost, totalRevenue: v.revenue, profit, margin: v.revenue > 0 ? (profit / v.revenue) * 100 : 0 };
    })
    .sort((a, b) => b.requests - a.requests);

  // User breakdown
  const userMap = new Map<string, { credits: number; cost: number; revenue: number }>();
  logs.forEach(l => {
    const key = l.user_id || 'anonymous';
    const prev = userMap.get(key) || { credits: 0, cost: 0, revenue: 0 };
    userMap.set(key, { credits: prev.credits + l.credits_used, cost: prev.cost + Number(l.provider_cost), revenue: prev.revenue + Number(l.revenue) });
  });
  const userBreakdown: UserBreakdown[] = Array.from(userMap.entries())
    .map(([user, v]) => ({ user: user.slice(0, 8) + '…', creditsUsed: v.credits, totalCost: v.cost, totalRevenue: v.revenue, profit: v.revenue - v.cost }))
    .sort((a, b) => b.creditsUsed - a.creditsUsed);

  // Tool breakdown
  const toolMap = new Map<string, { runs: number; cost: number; revenue: number }>();
  logs.forEach(l => {
    const key = l.tool_id || 'general';
    const prev = toolMap.get(key) || { runs: 0, cost: 0, revenue: 0 };
    toolMap.set(key, { runs: prev.runs + 1, cost: prev.cost + Number(l.provider_cost), revenue: prev.revenue + Number(l.revenue) });
  });
  const toolBreakdown: ToolBreakdown[] = Array.from(toolMap.entries())
    .map(([tool, v]) => ({
      tool,
      runs: v.runs,
      avgCost: v.runs > 0 ? v.cost / v.runs : 0,
      avgRevenue: v.runs > 0 ? v.revenue / v.runs : 0,
      margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.runs - a.runs);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading economics data…</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No generation logs yet. Economics data will appear here once generations are made.</p>
      </div>
    );
  }

  const fmt = (v: number) => `$${v.toFixed(4)}`;
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Total Cost', value: fmt(totalCost), icon: TrendingDown, color: 'text-red-400' },
          { label: 'Total Profit', value: fmt(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400' },
          { label: 'Margin %', value: fmtPct(marginPct), icon: Percent, color: marginPct >= 0 ? 'text-emerald-400' : 'text-red-400' },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><s.icon size={16} className={s.color} /></div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue vs Cost Chart */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue vs Cost (Daily)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,16%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={chartStyle} formatter={(v: number) => `$${v.toFixed(4)}`} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(142,70%,45%)" strokeWidth={2} dot={false} name="Revenue" />
              <Line type="monotone" dataKey="cost" stroke="hsl(0,70%,50%)" strokeWidth={2} dot={false} name="Cost" />
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
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelBreakdown.map(r => (
                <TableRow key={r.model}>
                  <TableCell className="font-medium text-xs">{r.model}</TableCell>
                  <TableCell className="text-right text-xs">{r.requests}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.totalCost)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.totalRevenue)}</TableCell>
                  <TableCell className={`text-right text-xs ${r.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(r.profit)}</TableCell>
                  <TableCell className={`text-right text-xs ${r.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(r.margin)}</TableCell>
                </TableRow>
              ))}
              {modelBreakdown.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-4">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
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
              {userBreakdown.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">No data</TableCell></TableRow>
              )}
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
                <TableHead className="text-right">Avg Revenue</TableHead>
                <TableHead className="text-right">Margin %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolBreakdown.map(r => (
                <TableRow key={r.tool}>
                  <TableCell className="font-medium text-xs">{r.tool}</TableCell>
                  <TableCell className="text-right text-xs">{r.runs}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.avgCost)}</TableCell>
                  <TableCell className="text-right text-xs">{fmt(r.avgRevenue)}</TableCell>
                  <TableCell className={`text-right text-xs ${r.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(r.margin)}</TableCell>
                </TableRow>
              ))}
              {toolBreakdown.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground text-xs py-4">No data</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
