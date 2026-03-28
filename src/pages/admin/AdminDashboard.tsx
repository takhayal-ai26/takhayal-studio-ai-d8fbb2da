import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, CreditCard, Zap, Image, TrendingUp, AlertTriangle,
  Plus, FileText, Eye, BarChart3, ArrowUpRight, Activity, Loader2, DollarSign
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  // Real generation stats
  const { data: genLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['dashboard-gen-logs'],
    queryFn: async () => {
      const { data } = await supabase.from('generation_logs')
        .select('credits_used, provider_cost, revenue, margin, created_at, quality_tier')
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  const { data: toolRuns = [] } = useQuery({
    queryKey: ['dashboard-tool-runs'],
    queryFn: async () => {
      const { data } = await supabase.from('tool_runs')
        .select('tool_slug, status, credits_charged, revenue, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      return data || [];
    },
  });

  const { data: providerHealth = [] } = useQuery({
    queryKey: ['dashboard-providers'],
    queryFn: async () => {
      const { data } = await supabase.from('provider_configs').select('provider_name, health_status, is_connected, last_sync_at');
      return data || [];
    },
  });

  // Calculate real stats
  const today = new Date().toISOString().split('T')[0];
  const genToday = genLogs.filter((l: any) => l.created_at?.startsWith(today)).length;
  const revenueToday = genLogs.filter((l: any) => l.created_at?.startsWith(today)).reduce((s: number, l: any) => s + (Number(l.revenue) || 0), 0);
  const totalRevenue = genLogs.reduce((s: number, l: any) => s + (Number(l.revenue) || 0), 0);
  const totalCost = genLogs.reduce((s: number, l: any) => s + (Number(l.provider_cost) || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const totalRuns = toolRuns.length;
  const completedRuns = toolRuns.filter((r: any) => r.status === 'completed').length;

  const unhealthyProviders = providerHealth.filter((p: any) => p.health_status === 'degraded' || p.health_status === 'down');

  // Tool usage breakdown
  const toolUsage = (() => {
    const counts: Record<string, number> = {};
    toolRuns.forEach((r: any) => { counts[r.tool_slug] = (counts[r.tool_slug] || 0) + 1; });
    return Object.entries(counts).map(([tool, uses]) => ({ tool, uses })).sort((a, b) => b.uses - a.uses).slice(0, 5);
  })();

  // Daily generation trend (last 7 days)
  const dailyTrend = (() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = 0;
    }
    genLogs.forEach((l: any) => {
      const day = l.created_at?.split('T')[0];
      if (day && day in days) days[day]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date: date.slice(5), generations: count }));
  })();

  const stats = [
    { label: 'Generations Today', value: genToday.toLocaleString(), icon: Image },
    { label: 'Revenue Today', value: `$${revenueToday.toFixed(2)}`, icon: DollarSign },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp },
    { label: 'Total Profit', value: `$${totalProfit.toFixed(2)}`, icon: BarChart3 },
    { label: 'Total Tool Runs', value: totalRuns.toLocaleString(), icon: Zap },
    { label: 'Completed Runs', value: completedRuns.toLocaleString(), icon: Activity },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time platform metrics from your database</p>
        </div>
      </div>

      {/* Alerts */}
      {unhealthyProviders.length > 0 && (
        <div className="space-y-2">
          {unhealthyProviders.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
              <AlertTriangle size={14} />
              {p.provider_name} is {p.health_status}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      {logsLoading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-muted-foreground" size={24} /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <s.icon size={16} className="text-primary" />
                  </div>
                </div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Generations (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailyTrend}>
                <defs>
                  <linearGradient id="genGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="generations" stroke="hsl(var(--primary))" fill="url(#genGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={toolUsage} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="tool" type="category" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Provider Health */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">API Provider Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {providerHealth.map((p: any) => (
              <div key={p.provider_name} className="p-3 rounded-lg border border-border/20 bg-muted/10">
                <p className="text-[13px] font-medium">{p.provider_name}</p>
                <Badge variant="outline" className={`text-[10px] mt-1 ${
                  p.health_status === 'healthy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  p.health_status === 'degraded' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                  'bg-muted/30 text-muted-foreground border-border/40'
                }`}>
                  {p.health_status || 'unknown'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Using DollarSign import
import { DollarSign } from 'lucide-react';
