import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, Users, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import EconomicsTab from '@/components/admin/EconomicsTab';

const trafficData = [
  { date: 'Mar 18', visits: 2400, signups: 120 }, { date: 'Mar 19', visits: 2800, signups: 145 },
  { date: 'Mar 20', visits: 3100, signups: 160 }, { date: 'Mar 21', visits: 2900, signups: 138 },
  { date: 'Mar 22', visits: 3400, signups: 172 }, { date: 'Mar 23', visits: 3200, signups: 155 },
  { date: 'Mar 24', visits: 3600, signups: 184 },
];

const toolUsage = [
  { tool: 'Generate', uses: 4812 }, { tool: 'Remove BG', uses: 3410 },
  { tool: 'Upscale', uses: 1890 }, { tool: 'Enhance', uses: 1340 }, { tool: 'Logo', uses: 1240 },
];

const retentionData = [
  { week: 'W1', rate: 100 }, { week: 'W2', rate: 68 }, { week: 'W3', rate: 52 },
  { week: 'W4', rate: 44 }, { week: 'W5', rate: 38 }, { week: 'W6', rate: 35 },
  { week: 'W7', rate: 32 }, { week: 'W8', rate: 30 },
];

const revenueByPlan = [
  { month: 'Jan', free: 0, pro: 12400 }, { month: 'Feb', free: 0, pro: 13800 },
  { month: 'Mar', free: 0, pro: 18060 },
];

const chartStyle = { background: 'hsl(0,0%,8%)', border: '1px solid hsl(0,0%,16%)', borderRadius: 8, fontSize: 12 };

export default function AdminAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Deep reporting on traffic, usage, revenue, and retention</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Weekly Traffic', value: '21,400', icon: BarChart3 },
          { label: 'Signup Rate', value: '5.2%', icon: TrendingUp },
          { label: 'Active Rate', value: '25.6%', icon: Users },
          { label: 'Credit Burn Rate', value: '67,230/mo', icon: Zap },
        ].map(s => (
          <Card key={s.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><s.icon size={16} className="text-primary" /></div>
              <div>
                <p className="text-lg font-bold">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="traffic" className="text-xs">Traffic & Signups</TabsTrigger>
          <TabsTrigger value="tools" className="text-xs">Tool Usage</TabsTrigger>
          <TabsTrigger value="retention" className="text-xs">Retention</TabsTrigger>
          <TabsTrigger value="revenue" className="text-xs">Revenue</TabsTrigger>
          <TabsTrigger value="economics" className="text-xs">Economics</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Traffic & Signup Funnel</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(10,88%,52%)" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(10,88%,52%)" stopOpacity={0} /></linearGradient>
                    <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(200,70%,50%)" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(200,70%,50%)" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartStyle} />
                  <Area type="monotone" dataKey="visits" stroke="hsl(10,88%,52%)" fill="url(#visitGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="signups" stroke="hsl(200,70%,50%)" fill="url(#signupGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Tool Usage Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={toolUsage} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="tool" type="category" tick={{ fontSize: 12, fill: 'hsl(0,0%,100%)' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip contentStyle={chartStyle} />
                  <Bar dataKey="uses" fill="hsl(10,88%,52%)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Weekly Retention Cohort</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={retentionData}>
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip contentStyle={chartStyle} />
                  <Line type="monotone" dataKey="rate" stroke="hsl(10,88%,52%)" strokeWidth={2} dot={{ fill: 'hsl(10,88%,52%)', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Revenue by Plan</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByPlan}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(0,2%,41%)' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={chartStyle} />
                  <Bar dataKey="pro" fill="hsl(10,88%,52%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
