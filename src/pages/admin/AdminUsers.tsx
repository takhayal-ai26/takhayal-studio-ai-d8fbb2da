import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, Download, MoreHorizontal, Plus, Users, UserCheck, UserX, CreditCard } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const MOCK_USERS = [
  { id: '1', name: 'Ahmed Khalil', email: 'ahmed@example.com', status: 'active', plan: 'Pro', credits: 420, generations: 1284, country: 'UAE', joined: '2025-12-01', lastActive: '2h ago' },
  { id: '2', name: 'Sara Mohammed', email: 'sara@example.com', status: 'active', plan: 'Free', credits: 4, generations: 86, country: 'KSA', joined: '2026-01-15', lastActive: '1d ago' },
  { id: '3', name: 'Omar Hassan', email: 'omar@example.com', status: 'active', plan: 'Pro', credits: 312, generations: 2104, country: 'Egypt', joined: '2025-11-20', lastActive: '5m ago' },
  { id: '4', name: 'Fatima Ali', email: 'fatima@example.com', status: 'suspended', plan: 'Free', credits: 0, generations: 12, country: 'Jordan', joined: '2026-02-08', lastActive: '30d ago' },
  { id: '5', name: 'Yusuf Baker', email: 'yusuf@example.com', status: 'active', plan: 'Pro', credits: 88, generations: 945, country: 'UAE', joined: '2025-10-05', lastActive: '12m ago' },
  { id: '6', name: 'Layla Ibrahim', email: 'layla@example.com', status: 'active', plan: 'Free', credits: 15, generations: 42, country: 'Kuwait', joined: '2026-03-01', lastActive: '3h ago' },
  { id: '7', name: 'Noor Abdallah', email: 'noor@example.com', status: 'banned', plan: 'Free', credits: 0, generations: 3, country: 'Qatar', joined: '2026-02-20', lastActive: '45d ago' },
  { id: '8', name: 'Karim Saleh', email: 'karim@example.com', status: 'active', plan: 'Pro', credits: 500, generations: 3210, country: 'KSA', joined: '2025-09-12', lastActive: '1m ago' },
];

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  banned: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function AdminUsers({ embedded }: { embedded?: boolean } = {}) {
  const [search, setSearch] = useState('');
  const filtered = MOCK_USERS.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform users and accounts</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Download size={14} /> Export CSV</Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: '12,847', icon: Users },
          { label: 'Active', value: '11,204', icon: UserCheck },
          { label: 'Paid', value: '1,204', icon: CreditCard },
          { label: 'Suspended / Banned', value: '38', icon: UserX },
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

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9 h-9 text-sm bg-muted/30" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs"><Filter size={14} /> Filters</Button>
      </div>

      {/* Table */}
      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">User</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Plan</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Credits</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Generations</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Country</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Last Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(u => (
              <TableRow key={u.id} className="border-border/20 hover:bg-muted/20 cursor-pointer">
                <TableCell>
                  <div>
                    <p className="text-[13px] font-medium">{u.name}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] capitalize ${statusColor[u.status]}`}>{u.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.plan === 'Pro' ? 'default' : 'secondary'} className="text-[10px]">{u.plan}</Badge>
                </TableCell>
                <TableCell className="text-[13px] font-medium">{u.credits}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{u.generations.toLocaleString()}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{u.country}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{u.lastActive}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="text-xs">View Profile</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">Add Credits</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">Deduct Credits</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs">Upgrade Plan</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-yellow-400">Suspend</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-destructive">Ban User</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
