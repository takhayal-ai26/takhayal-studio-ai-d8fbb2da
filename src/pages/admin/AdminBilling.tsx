import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DollarSign, CreditCard, Zap, TrendingUp, Search, Filter, Plus, Edit, MoreHorizontal } from 'lucide-react';

const plans = [
  { name: 'Free', price: '$0/mo', credits: 20, users: 11643, status: 'active', featured: false },
  { name: 'Pro', price: '$15/mo', credits: 500, users: 1204, status: 'active', featured: true },
];

const packages = [
  { name: 'Starter Pack', credits: 50, price: '$4.99', badge: '', status: 'active' },
  { name: 'Creator Pack', credits: 200, price: '$14.99', badge: 'Most Popular', status: 'active' },
  { name: 'Studio Pack', credits: 500, price: '$29.99', badge: 'Best Value', status: 'active' },
  { name: 'Enterprise', credits: 2000, price: '$99.99', badge: '', status: 'active' },
];

const transactions = [
  { user: 'Ahmed K.', amount: '$15.00', type: 'Subscription', status: 'completed', date: '2026-03-24', invoice: 'INV-4821' },
  { user: 'Sara M.', amount: '$14.99', type: 'Credit Pack', status: 'completed', date: '2026-03-24', invoice: 'INV-4820' },
  { user: 'Omar H.', amount: '$29.99', type: 'Credit Pack', status: 'completed', date: '2026-03-23', invoice: 'INV-4819' },
  { user: 'Layla I.', amount: '$15.00', type: 'Subscription', status: 'failed', date: '2026-03-23', invoice: 'INV-4818' },
  { user: 'Karim S.', amount: '$4.99', type: 'Credit Pack', status: 'refunded', date: '2026-03-22', invoice: 'INV-4817' },
];

const creditLogs = [
  { user: 'Ahmed K.', change: '+500', reason: 'Pro plan renewal', tool: '-', date: '2026-03-24', type: 'system' },
  { user: 'Sara M.', change: '-2', reason: 'Image generation', tool: 'Generate', date: '2026-03-24', type: 'system' },
  { user: 'Omar H.', change: '+50', reason: 'Admin adjustment', tool: '-', date: '2026-03-23', type: 'admin' },
  { user: 'Fatima A.', change: '-3', reason: 'Upscale image', tool: 'Upscale', date: '2026-03-23', type: 'system' },
];

const txStatusColor: Record<string, string> = {
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-destructive/10 text-destructive border-destructive/20',
  refunded: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
};

export default function AdminBilling() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Credits</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage plans, packages, transactions, and credit operations</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'MRR', value: '$18,060', icon: DollarSign },
          { label: 'Paid Users', value: '1,204', icon: CreditCard },
          { label: 'Credits Sold', value: '89,400', icon: Zap },
          { label: 'Avg Revenue/User', value: '$15.01', icon: TrendingUp },
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

      <Tabs defaultValue="plans" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="plans" className="text-xs">Plans</TabsTrigger>
          <TabsTrigger value="packages" className="text-xs">Credit Packages</TabsTrigger>
          <TabsTrigger value="transactions" className="text-xs">Transactions</TabsTrigger>
          <TabsTrigger value="credit-logs" className="text-xs">Credit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <div className="grid md:grid-cols-2 gap-4">
            {plans.map(p => (
              <Card key={p.name} className={`border-border/40 bg-card/50 ${p.featured ? 'ring-1 ring-primary/30' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{p.name}</h3>
                      <p className="text-2xl font-bold text-primary mt-1">{p.price}</p>
                    </div>
                    {p.featured && <Badge className="text-[10px]">Featured</Badge>}
                  </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>{p.credits} credits/month</p>
                    <p>{p.users.toLocaleString()} active users</p>
                  </div>
                  <Button variant="outline" size="sm" className="mt-4 gap-1.5 text-xs"><Edit size={12} /> Edit Plan</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="packages">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Credit Packages</CardTitle>
              <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Add Package</Button>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Package</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Credits</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Price</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Badge</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map(p => (
                  <TableRow key={p.name} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{p.name}</TableCell>
                    <TableCell className="text-[13px]">{p.credits}</TableCell>
                    <TableCell className="text-[13px] font-medium text-primary">{p.price}</TableCell>
                    <TableCell>{p.badge && <Badge variant="outline" className="text-[10px]">{p.badge}</Badge>}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{p.status}</Badge></TableCell>
                    <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={12} /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold">Recent Transactions</CardTitle>
              <div className="flex gap-2">
                <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search..." className="pl-9 h-8 text-xs w-48 bg-muted/30" /></div>
                <Button variant="outline" size="sm" className="text-xs gap-1"><Filter size={12} /> Filter</Button>
              </div>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">User</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Type</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Date</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t, i) => (
                  <TableRow key={i} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{t.user}</TableCell>
                    <TableCell className="text-[13px] font-medium">{t.amount}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{t.type}</TableCell>
                    <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${txStatusColor[t.status]}`}>{t.status}</Badge></TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{t.date}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{t.invoice}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="credit-logs">
          <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Credit Logs</CardTitle></CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">User</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Change</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Reason</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Date</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {creditLogs.map((l, i) => (
                  <TableRow key={i} className="border-border/20">
                    <TableCell className="text-[13px] font-medium">{l.user}</TableCell>
                    <TableCell className={`text-[13px] font-bold ${l.change.startsWith('+') ? 'text-emerald-400' : 'text-destructive'}`}>{l.change}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{l.reason}</TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{l.tool}</TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">{l.date}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] capitalize">{l.type}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
