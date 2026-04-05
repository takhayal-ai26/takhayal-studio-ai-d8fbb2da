import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, CreditCard, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import AdminUsers from './AdminUsers';
import AdminBilling from './AdminBilling';

function relativeTime(d: string | null) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatAction(action: string, details: any): string {
  const d = details || {};
  switch (action) {
    case 'add_credits': return `Added ${d.amount || '?'} credits (${d.reason || ''})`;
    case 'deduct_credits': return `Deducted ${d.amount || '?'} credits (${d.reason || ''})`;
    case 'change_plan': return `Plan changed: ${d.old_plan || '?'} → ${d.new_plan || '?'}`;
    case 'suspend_user': return `Suspended user (${d.duration || 'indefinite'})`;
    case 'ban_user': return `Permanently banned user`;
    case 'password_reset_sent': return `Password reset email sent`;
    default: return action.replace(/_/g, ' ');
  }
}

function AuditLogTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('admin_audit_log')
      .select('*')
      .eq('entity_type', 'user')
      .order('created_at', { ascending: false })
      .limit(100);

    if (filterAction !== 'all') {
      query = query.eq('action', filterAction);
    }

    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  }, [filterAction]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = search
    ? logs.filter(l => {
        const details = l.new_value || {};
        const text = `${details.user_name || ''} ${details.email || ''} ${l.action}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
    : logs;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search audit log..." className="pl-9 h-9 text-sm bg-muted/30" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-9 w-48 text-xs"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="add_credits">Add Credits</SelectItem>
            <SelectItem value="deduct_credits">Deduct Credits</SelectItem>
            <SelectItem value="change_plan">Change Plan</SelectItem>
            <SelectItem value="suspend_user">Suspend</SelectItem>
            <SelectItem value="ban_user">Ban</SelectItem>
            <SelectItem value="password_reset_sent">Password Reset</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="border-border/40 bg-card/50">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Timestamp</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Action</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Target User</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider text-muted-foreground">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12 text-muted-foreground">No audit log entries</TableCell></TableRow>
            ) : filtered.map(log => {
              const details = log.new_value || {};
              return (
                <TableRow key={log.id} className="border-border/20">
                  <TableCell className="text-[12px] text-muted-foreground">{relativeTime(log.created_at)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">{formatAction(log.action, details)}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-[12px] font-medium">{details.user_name || '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{details.email || ''}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                    {details.note || details.reason || '—'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default function AdminUsersMerged() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage users, credits, billing, and subscription plans</p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="users" className="text-xs gap-1.5"><Users size={14} /> All Users</TabsTrigger>
          <TabsTrigger value="audit" className="text-xs gap-1.5"><CreditCard size={14} /> Credits & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AdminUsers embedded />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
