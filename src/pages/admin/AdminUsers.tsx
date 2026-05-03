import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, MoreHorizontal, Users, UserCheck, UserX, CreditCard, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserProfileDrawer, type DrawerAction } from '@/components/admin/UserProfileDrawer';

const PAGE_SIZE = 50;

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  banned: 'bg-destructive/10 text-destructive border-destructive/20',
};

const planColor: Record<string, string> = {
  free: 'secondary',
  creator: 'default',
  studio: 'default',
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export interface AdminUserRow {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  credits: number;
  plan: string;
  status: string;
  country: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  total_generations: number;
}

interface Stats {
  total: number;
  active: number;
  paid: number;
  suspended: number;
}

export default function AdminUsers({ embedded }: { embedded?: boolean } = {}) {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, paid: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Drawer state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [drawerAction, setDrawerAction] = useState<DrawerAction>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(0); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStats = useCallback(async () => {
    const [totalRes, activeRes, paidRes, suspendedRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).or('status.eq.active,status.is.null'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('plan', ['creator', 'studio']),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).in('status', ['suspended', 'banned']),
    ]);
    setStats({
      total: totalRes.count ?? 0,
      active: activeRes.count ?? 0,
      paid: paidRes.count ?? 0,
      suspended: suspendedRes.count ?? 0,
    });
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*', { count: 'exact' });

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`);
      }
      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterPlan !== 'all') {
        query = query.eq('plan', filterPlan);
      }

      // Sorting
      switch (sortBy) {
        case 'oldest': query = query.order('created_at', { ascending: true }); break;
        case 'most_credits': query = query.order('credits', { ascending: false }); break;
        default: query = query.order('created_at', { ascending: false }); break;
      }

      const from = page * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;

      // Fetch generation counts for these users
      const userIds = (data || []).map((u: any) => u.user_id);
      let genCounts: Record<string, number> = {};
      if (userIds.length > 0) {
        const { data: genData } = await supabase
          .from('generation_logs')
          .select('user_id')
          .in('user_id', userIds);
        if (genData) {
          for (const g of genData) {
            if (g.user_id) genCounts[g.user_id] = (genCounts[g.user_id] || 0) + 1;
          }
        }
      }

      const rows: AdminUserRow[] = (data || []).map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name || p.email || 'Unknown',
        email: p.email,
        avatar_url: p.avatar_url,
        credits: p.credits ?? 0,
        plan: p.plan || 'free',
        status: p.status || 'active',
        country: p.country,
        created_at: p.created_at,
        last_sign_in_at: p.last_sign_in_at,
        total_generations: genCounts[p.user_id] || 0,
      }));

      setUsers(rows);
      setTotalCount(count ?? 0);
    } catch (e: any) {
      toast.error('Failed to load users: ' + e.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, filterStatus, filterPlan, sortBy]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const openDrawer = (userId: string, action: DrawerAction = null) => {
    setSelectedUserId(userId);
    setDrawerAction(action);
  };

  const handleExportUser = async (user: AdminUserRow) => {
    toast.info(`Exporting data for ${user.full_name}...`);
    try {
      const { data: gens } = await supabase
        .from('generation_logs')
        .select('created_at, model_id, quality_tier, credits_used, actual_api_cost')
        .eq('user_id', user.user_id)
        .order('created_at', { ascending: false });

      let csv = 'Section,Field,Value\n';
      csv += `Profile,ID,${user.user_id}\n`;
      csv += `Profile,Name,${user.full_name}\n`;
      csv += `Profile,Email,${user.email}\n`;
      csv += `Profile,Plan,${user.plan}\n`;
      csv += `Profile,Credits,${user.credits}\n`;
      csv += `Profile,Status,${user.status}\n`;
      csv += `Profile,Country,${user.country || ''}\n`;
      csv += `Profile,Joined,${user.created_at}\n`;
      csv += `Profile,Last Active,${user.last_sign_in_at || ''}\n`;
      csv += '\nGeneration Date,Model ID,Resolution,Credits Used,API Cost\n';
      for (const g of (gens || [])) {
        csv += `${g.created_at},${g.model_id || ''},${g.quality_tier || ''},${g.credits_used},${g.actual_api_cost}\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `takhayal_user_${user.user_id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Data exported for ${user.full_name}`);
    } catch (e: any) {
      toast.error('Export failed: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="typo-heading-page">Users</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform users and accounts</p>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total.toLocaleString(), icon: Users },
          { label: 'Active', value: stats.active.toLocaleString(), icon: UserCheck },
          { label: 'Paid', value: stats.paid.toLocaleString(), icon: CreditCard },
          { label: 'Suspended / Banned', value: stats.suspended.toLocaleString(), icon: UserX },
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

      {/* Search & Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by name or email..." className="pl-9 h-9 text-sm bg-muted/30" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? <X size={14} /> : <Filter size={14} />} Filters
        </Button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Plan:</span>
            <Select value={filterPlan} onValueChange={v => { setFilterPlan(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="creator">Creator</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <Select value={sortBy} onValueChange={v => { setSortBy(v); setPage(0); }}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="most_credits">Most Credits</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

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
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading users...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No users found</TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id} className="border-border/20 hover:bg-muted/20 cursor-pointer" onClick={() => openDrawer(u.user_id)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary shrink-0">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" /> : (u.full_name?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium">{u.full_name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] capitalize ${statusColor[u.status] || statusColor.active}`}>{u.status}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={u.plan !== 'free' ? 'default' : 'secondary'} className="text-[10px] capitalize">{u.plan}</Badge>
                </TableCell>
                <TableCell className="text-[13px] font-medium">{u.credits}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{u.total_generations.toLocaleString()}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{u.country || '—'}</TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{relativeTime(u.last_sign_in_at)}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal size={14} /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem className="text-xs" onClick={() => openDrawer(u.user_id)}>View Profile</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs" onClick={() => openDrawer(u.user_id, 'add_credits')}>Add Credits</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs" onClick={() => openDrawer(u.user_id, 'deduct_credits')}>Deduct Credits</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs" onClick={() => openDrawer(u.user_id, 'change_plan')}>Change Plan</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs" onClick={() => openDrawer(u.user_id, 'reset_password')}>Reset Password</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-yellow-400" onClick={() => openDrawer(u.user_id, 'suspend')}>Suspend</DropdownMenuItem>
                      <DropdownMenuItem className="text-xs text-destructive" onClick={() => openDrawer(u.user_id, 'ban')}>Ban User</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-xs" onClick={() => handleExportUser(u)}>Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="gap-1 text-xs">
              <ChevronLeft size={14} /> Previous
            </Button>
            <span className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="gap-1 text-xs">
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* User Profile Drawer */}
      {selectedUserId && (
        <UserProfileDrawer
          userId={selectedUserId}
          initialAction={drawerAction}
          onClose={() => { setSelectedUserId(null); setDrawerAction(null); }}
          onRefresh={() => { fetchUsers(); fetchStats(); }}
        />
      )}
    </div>
  );
}
