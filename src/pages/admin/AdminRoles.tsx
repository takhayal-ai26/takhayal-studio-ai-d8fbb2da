import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Plus, Edit, Lock, Shield, Users } from 'lucide-react';

const roles = [
  { name: 'Super Admin', description: 'Full access to all admin features', members: 2, permissions: 'All', editable: false },
  { name: 'Operations Admin', description: 'User management, content, templates', members: 3, permissions: 'Users, Content, Templates, Community', editable: true },
  { name: 'Billing Admin', description: 'Billing, credits, transactions', members: 1, permissions: 'Billing, Credits, Transactions', editable: true },
  { name: 'Content Admin', description: 'Content, templates, media management', members: 2, permissions: 'Content, Templates, Media', editable: true },
  { name: 'Community Moderator', description: 'Community moderation and review', members: 4, permissions: 'Community, Reports', editable: true },
  { name: 'Support Admin', description: 'Support tickets and reports', members: 2, permissions: 'Support, Reports', editable: true },
];

const admins = [
  { name: 'Admin User', email: 'admin@takhayal.ai', role: 'Super Admin', lastActive: '1m ago' },
  { name: 'Ops Manager', email: 'ops@takhayal.ai', role: 'Operations Admin', lastActive: '15m ago' },
  { name: 'Content Lead', email: 'content@takhayal.ai', role: 'Content Admin', lastActive: '2h ago' },
  { name: 'Moderator 1', email: 'mod1@takhayal.ai', role: 'Community Moderator', lastActive: '30m ago' },
];

export default function AdminRoles() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage admin roles, permissions, and team access</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Create Role</Button>
      </div>

      {/* Roles */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map(r => (
          <Card key={r.name} className="border-border/40 bg-card/50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-primary/10"><Shield size={16} className="text-primary" /></div>
                <div>
                  <h3 className="text-sm font-bold">{r.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{r.description}</p>
                </div>
              </div>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span className="font-medium">{r.members}</span></div>
                <div><span className="text-muted-foreground">Permissions: </span><span className="text-[11px]">{r.permissions}</span></div>
              </div>
              {r.editable && <Button variant="outline" size="sm" className="mt-3 text-xs gap-1"><Edit size={12} /> Edit Role</Button>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Members */}
      <Card className="border-border/40 bg-card/50">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Admin Team Members</h3>
          <Button size="sm" className="gap-1.5 text-xs"><Plus size={14} /> Add Admin</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Name</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Email</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Role</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Last Active</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map(a => (
              <TableRow key={a.email} className="border-border/20">
                <TableCell className="text-[13px] font-medium">{a.name}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{a.email}</TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{a.role}</Badge></TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{a.lastActive}</TableCell>
                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Edit size={12} /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
