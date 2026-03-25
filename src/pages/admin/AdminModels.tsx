import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Cpu, Plus, Edit, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const providers = [
  { name: 'Fal.ai', type: 'AI Generation', status: 'connected', env: 'production', health: 'healthy', lastSync: '1m ago' },
  { name: 'Replicate', type: 'AI Generation', status: 'not_connected', env: '-', health: '-', lastSync: '-' },
  { name: 'Stability AI', type: 'AI Generation', status: 'not_connected', env: '-', health: '-', lastSync: '-' },
  { name: 'OpenAI', type: 'AI Enhancement', status: 'not_connected', env: '-', health: '-', lastSync: '-' },
];

const models = [
  { name: 'Flux Schnell', provider: 'Fal.ai', tool: 'Generate', type: 'Generation', default: true, active: true, latency: '~8s', cost: '$0.003' },
  { name: 'Flux Pro', provider: 'Fal.ai', tool: 'Generate', type: 'Generation', default: false, active: false, latency: '~15s', cost: '$0.05' },
  { name: 'Flux Dev', provider: 'Fal.ai', tool: 'Generate', type: 'Generation', default: false, active: false, latency: '~12s', cost: '$0.025' },
];

const routing = [
  { tool: 'Generate Image', defaultModel: 'Flux Schnell', fallback: 'Flux Dev', planRouting: 'Free: Schnell / Pro: Schnell' },
  { tool: 'Create Logo', defaultModel: 'Flux Schnell', fallback: '-', planRouting: 'All: Flux Schnell' },
  { tool: 'Upscale Image', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
  { tool: 'Remove Background', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
  { tool: 'Enhance Image', defaultModel: '-', fallback: '-', planRouting: 'Not connected' },
];

const healthColor: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  degraded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  down: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusColor: Record<string, string> = {
  connected: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  not_connected: 'bg-muted/30 text-muted-foreground border-border/40',
};

export default function AdminModels() {
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
          <div className="grid md:grid-cols-2 gap-4">
            {providers.map(p => (
              <Card key={p.name} className="border-border/40 bg-card/50">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10"><Cpu size={16} className="text-primary" /></div>
                      <div>
                        <h3 className="text-sm font-bold">{p.name}</h3>
                        <p className="text-[11px] text-muted-foreground">{p.type}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] capitalize ${statusColor[p.status]}`}>{p.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-[12px]">
                    <div><p className="text-muted-foreground">Environment</p><p className="font-medium capitalize">{p.env}</p></div>
                    <div><p className="text-muted-foreground">Health</p><p className="font-medium capitalize">{p.health !== '-' ? <Badge variant="outline" className={`text-[10px] ${healthColor[p.health]}`}>{p.health}</Badge> : '-'}</p></div>
                    <div><p className="text-muted-foreground">Last Sync</p><p className="font-medium">{p.lastSync}</p></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="text-xs gap-1"><RefreshCw size={12} /> Sync</Button>
                    <Button variant="outline" size="sm" className="text-xs gap-1"><Edit size={12} /> Configure</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models">
          <Card className="border-border/40 bg-card/50">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Model</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Provider</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Latency</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Cost/Run</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Default</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map(m => (
                  <TableRow key={m.name} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{m.name}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{m.provider}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{m.tool}</Badge></TableCell>
                    <TableCell className="text-[13px]">{m.latency}</TableCell>
                    <TableCell className="text-[13px] font-medium text-primary">{m.cost}</TableCell>
                    <TableCell>{m.default && <CheckCircle size={14} className="text-emerald-400" />}</TableCell>
                    <TableCell><Switch defaultChecked={m.active} className="scale-75" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                {routing.map(r => (
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
              <p className="text-sm text-muted-foreground max-w-md">Real-time cost tracking will be available when AI providers are connected. Monitor margin by tool, provider costs, and trends.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
