import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, CreditCard, Zap, Image, TrendingUp, AlertTriangle,
  Plus, FileText, Eye, BarChart3, ArrowUpRight, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

const stats = [
  { label: 'Total Users', value: '12,847', change: '+12%', icon: Users, trend: 'up' },
  { label: 'New Today', value: '134', change: '+8%', icon: TrendingUp, trend: 'up' },
  { label: 'Active Users', value: '3,291', change: '+5%', icon: Activity, trend: 'up' },
  { label: 'Paid Users', value: '1,204', change: '+18%', icon: CreditCard, trend: 'up' },
  { label: 'MRR', value: '$18,060', change: '+22%', icon: BarChart3, trend: 'up' },
  { label: 'Credits Purchased', value: '89,400', change: '+15%', icon: Zap, trend: 'up' },
  { label: 'Credits Used', value: '67,230', change: '+9%', icon: Zap, trend: 'up' },
  { label: 'Generations Today', value: '4,812', change: '+11%', icon: Image, trend: 'up' },
];

const revenueData = [
  { month: 'Jan', revenue: 12400 }, { month: 'Feb', revenue: 13800 },
  { month: 'Mar', revenue: 15200 }, { month: 'Apr', revenue: 14600 },
  { month: 'May', revenue: 16900 }, { month: 'Jun', revenue: 18060 },
];

const usageData = [
  { day: 'Mon', generate: 820, upscale: 340, logo: 210, removeBg: 480, enhance: 290 },
  { day: 'Tue', generate: 910, upscale: 380, logo: 180, removeBg: 510, enhance: 320 },
  { day: 'Wed', generate: 780, upscale: 290, logo: 250, removeBg: 430, enhance: 270 },
  { day: 'Thu', generate: 1020, upscale: 410, logo: 190, removeBg: 560, enhance: 350 },
  { day: 'Fri', generate: 1150, upscale: 450, logo: 220, removeBg: 590, enhance: 380 },
  { day: 'Sat', generate: 680, upscale: 250, logo: 150, removeBg: 320, enhance: 200 },
  { day: 'Sun', generate: 740, upscale: 280, logo: 170, removeBg: 360, enhance: 230 },
];

const recentActivity = [
  { user: 'Ahmed K.', action: 'Purchased Pro plan', time: '2m ago', type: 'billing' },
  { user: 'Sara M.', action: 'Submitted to community', time: '5m ago', type: 'community' },
  { user: 'Omar H.', action: 'Generated 12 images', time: '8m ago', type: 'usage' },
  { user: 'Fatima A.', action: 'Reported content', time: '12m ago', type: 'report' },
  { user: 'Yusuf B.', action: 'Credits depleted', time: '15m ago', type: 'warning' },
];

const alerts = [
  { message: '3 community submissions pending review', type: 'warning' },
  { message: '2 failed payment retries', type: 'error' },
  { message: 'Replicate API latency elevated', type: 'warning' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform overview and quick actions</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus size={14} /> Add Credits
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <FileText size={14} /> Create Template
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Eye size={14} /> Review Queue
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium ${
                a.type === 'error'
                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                  : 'bg-[hsl(40,90%,50%)]/10 text-[hsl(40,90%,50%)] border border-[hsl(40,90%,50%)]/20'
              }`}
            >
              <AlertTriangle size={14} />
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/40 bg-card/50 hover:bg-card/80 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <s.icon size={16} className="text-primary" />
                </div>
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight size={12} /> {s.change}
                </span>
              </div>
              <p className="text-xl font-bold text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(10,88%,52%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(10,88%,52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(10,88%,52%)" fill="url(#revGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Tool Usage (This Week)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={usageData}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="generate" stackId="a" fill="hsl(10,88%,52%)" radius={[0,0,0,0]} />
                <Bar dataKey="upscale" stackId="a" fill="hsl(200,70%,50%)" />
                <Bar dataKey="logo" stackId="a" fill="hsl(280,60%,55%)" />
                <Bar dataKey="removeBg" stackId="a" fill="hsl(160,60%,45%)" />
                <Bar dataKey="enhance" stackId="a" fill="hsl(40,80%,55%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-[13px] font-medium text-foreground">{a.user}</p>
                  <p className="text-[11px] text-muted-foreground">{a.action}</p>
                </div>
                <span className="text-[11px] text-muted-foreground">{a.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Top Tools Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Generate Image', uses: 1150, pct: 100 },
              { name: 'Remove Background', uses: 590, pct: 51 },
              { name: 'Upscale Image', uses: 450, pct: 39 },
              { name: 'Enhance Image', uses: 380, pct: 33 },
              { name: 'Create Logo', uses: 220, pct: 19 },
            ].map((t) => (
              <div key={t.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground font-medium">{t.name}</span>
                  <span className="text-muted-foreground">{t.uses.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
