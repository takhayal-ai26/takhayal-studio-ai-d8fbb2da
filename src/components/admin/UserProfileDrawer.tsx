import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { X, Copy, Coins, Image as ImageIcon, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type DrawerAction = 'add_credits' | 'deduct_credits' | 'change_plan' | 'suspend' | 'ban' | 'reset_password' | null;

interface Props {
  userId: string;
  initialAction: DrawerAction;
  onClose: () => void;
  onRefresh: () => void;
}

interface UserProfile {
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
  suspended_reason: string | null;
  banned_reason: string | null;
}

interface GenLog {
  id: string;
  created_at: string;
  model_id: string | null;
  quality_tier: string | null;
  credits_used: number;
  image_url: string | null;
  actual_api_cost: number;
}

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  suspended: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  banned: 'bg-destructive/10 text-destructive border-destructive/20',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

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

export function UserProfileDrawer({ userId, initialAction, onClose, onRefresh }: Props) {
  const { user: adminUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generations, setGenerations] = useState<GenLog[]>([]);
  const [genStats, setGenStats] = useState({ total: 0, totalCredits: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<DrawerAction>(initialAction);

  // Action form state
  const [creditAmount, setCreditAmount] = useState(10);
  const [creditReason, setCreditReason] = useState('gift');
  const [creditNote, setCreditNote] = useState('');
  const [newPlan, setNewPlan] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('7d');
  const [banReason, setBanReason] = useState('');
  const [banConfirmEmail, setBanConfirmEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setProfile(data as any);
    if (error) toast.error('Failed to load profile');

    // Generations
    const { data: gens } = await supabase
      .from('generation_logs')
      .select('id, created_at, model_id, quality_tier, credits_used, image_url, actual_api_cost')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    setGenerations((gens as any[]) || []);

    // Stats
    const { data: allGens } = await supabase
      .from('generation_logs')
      .select('credits_used, actual_api_cost')
      .eq('user_id', userId);
    if (allGens) {
      setGenStats({
        total: allGens.length,
        totalCredits: allGens.reduce((s, g) => s + (g.credits_used || 0), 0),
        totalCost: allGens.reduce((s, g) => s + (g.actual_api_cost || 0), 0),
      });
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const logAudit = async (action: string, details: Record<string, any>) => {
    await supabase.from('admin_audit_log').insert({
      action,
      entity_type: 'user',
      entity_id: userId,
      admin_user_id: adminUser?.id || null,
      old_value: {},
      new_value: details,
    } as any);
  };

  const refreshAll = () => { fetchProfile(); onRefresh(); };

  // === ACTIONS ===
  const handleAddCredits = async () => {
    if (creditAmount < 1 || !profile) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: profile.credits + creditAmount } as any)
        .eq('user_id', userId);
      if (error) throw error;
      await logAudit('add_credits', { amount: creditAmount, reason: creditReason, note: creditNote, user_name: profile.full_name });
      toast.success(`Added ${creditAmount} credits to ${profile.full_name}`);
      setActiveAction(null);
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleDeductCredits = async () => {
    if (creditAmount < 1 || !profile) return;
    if (creditAmount > profile.credits) { toast.error('Cannot deduct more than current balance'); return; }
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ credits: Math.max(0, profile.credits - creditAmount) } as any)
        .eq('user_id', userId);
      if (error) throw error;
      await logAudit('deduct_credits', { amount: creditAmount, reason: creditReason, note: creditNote, user_name: profile.full_name });
      toast.success(`Deducted ${creditAmount} credits from ${profile.full_name}`);
      setActiveAction(null);
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleChangePlan = async () => {
    if (!profile || !newPlan || newPlan === profile.plan) return;
    setActionLoading(true);
    try {
      let bonusCredits = 0;
      if (newPlan === 'creator') bonusCredits = 300;
      if (newPlan === 'studio') bonusCredits = 1000;

      const updates: any = { plan: newPlan };
      if (bonusCredits > 0) updates.credits = profile.credits + bonusCredits;

      const { error } = await supabase.from('profiles').update(updates).eq('user_id', userId);
      if (error) throw error;
      await logAudit('change_plan', { old_plan: profile.plan, new_plan: newPlan, bonus_credits: bonusCredits, user_name: profile.full_name });
      toast.success(`Plan updated to ${newPlan} for ${profile.full_name}${bonusCredits > 0 ? ` (+${bonusCredits} credits)` : ''}`);
      setActiveAction(null);
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleSuspend = async () => {
    if (!profile || !suspendReason) return;
    setActionLoading(true);
    try {
      const durationMap: Record<string, number | null> = { '24h': 1, '3d': 3, '7d': 7, '30d': 30, indefinite: null };
      const days = durationMap[suspendDuration];
      const until = days ? new Date(Date.now() + days * 86400000).toISOString() : null;

      const { error } = await supabase.from('profiles').update({
        status: 'suspended',
        suspended_reason: suspendReason,
        suspended_until: until,
      } as any).eq('user_id', userId);
      if (error) throw error;
      await logAudit('suspend_user', { reason: suspendReason, duration: suspendDuration, user_name: profile.full_name });
      toast.success(`${profile.full_name} has been suspended`);
      setActiveAction(null);
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleBan = async () => {
    if (!profile || !banReason || banConfirmEmail !== profile.email) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('profiles').update({
        status: 'banned',
        banned_reason: banReason,
        banned_at: new Date().toISOString(),
      } as any).eq('user_id', userId);
      if (error) throw error;
      await logAudit('ban_user', { reason: banReason, user_name: profile.full_name, email: profile.email });
      toast.success(`${profile.full_name} has been permanently banned`);
      setActiveAction(null);
      refreshAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(profile.email);
      if (error) throw error;
      await logAudit('password_reset_sent', { email: profile.email, user_name: profile.full_name });
      toast.success(`Password reset email sent to ${profile.email}`);
      setActiveAction(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setActionLoading(false); }
  };

  if (!profile && loading) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
        <div className="absolute right-0 top-0 bottom-0 w-[480px] bg-card p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = (profile.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-foreground/50" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[480px] bg-card border-l border-border/30 flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border/20 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary shrink-0">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-foreground truncate">{profile.full_name}</p>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={`text-[10px] capitalize ${statusColor[profile.status] || statusColor.active}`}>{profile.status}</Badge>
              <Badge variant={profile.plan !== 'free' ? 'default' : 'secondary'} className="text-[10px] capitalize">{profile.plan}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onClose}><X size={16} /></Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Active Action Panel */}
          {activeAction && (
            <div className="rounded-lg border border-border/30 bg-muted/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveAction(null)}><ArrowLeft size={14} /></Button>
                <span className="text-sm font-semibold capitalize">{activeAction.replace('_', ' ')}</span>
              </div>

              {(activeAction === 'add_credits' || activeAction === 'deduct_credits') && (
                <>
                  <div>
                    <Label className="text-xs">Credits to {activeAction === 'add_credits' ? 'add' : 'deduct'}</Label>
                    <Input type="number" min={1} max={10000} value={creditAmount} onChange={e => setCreditAmount(+e.target.value)} className="mt-1" />
                    {activeAction === 'deduct_credits' && creditAmount > profile.credits && (
                      <p className="text-xs text-destructive mt-1">Cannot deduct more than current balance ({profile.credits})</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs">Reason</Label>
                    <Select value={creditReason} onValueChange={setCreditReason}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {activeAction === 'add_credits' ? (
                          <>
                            <SelectItem value="gift">Gift</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
                            <SelectItem value="promotional">Promotional</SelectItem>
                            <SelectItem value="compensation">Compensation</SelectItem>
                            <SelectItem value="manual">Manual Adjustment</SelectItem>
                          </>
                        ) : (
                          <>
                            <SelectItem value="error_correction">Error Correction</SelectItem>
                            <SelectItem value="policy_violation">Policy Violation</SelectItem>
                            <SelectItem value="manual">Manual Adjustment</SelectItem>
                            <SelectItem value="chargeback">Chargeback</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Note (optional)</Label>
                    <Textarea maxLength={200} value={creditNote} onChange={e => setCreditNote(e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <Button className="w-full" disabled={actionLoading || creditAmount < 1}
                    onClick={activeAction === 'add_credits' ? handleAddCredits : handleDeductCredits}>
                    {actionLoading ? 'Processing...' : `${activeAction === 'add_credits' ? 'Add' : 'Deduct'} ${creditAmount} Credits`}
                  </Button>
                </>
              )}

              {activeAction === 'change_plan' && (
                <>
                  <p className="text-xs text-muted-foreground">Current plan: <span className="font-medium capitalize">{profile.plan}</span></p>
                  <div>
                    <Label className="text-xs">New Plan</Label>
                    <Select value={newPlan} onValueChange={setNewPlan}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select plan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="creator">Creator (+300 credits)</SelectItem>
                        <SelectItem value="studio">Studio (+1000 credits)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" disabled={actionLoading || !newPlan || newPlan === profile.plan} onClick={handleChangePlan}>
                    {actionLoading ? 'Processing...' : `Change to ${newPlan || '...'}`}
                  </Button>
                </>
              )}

              {activeAction === 'suspend' && (
                <>
                  <div className="flex items-start gap-2 p-2 rounded bg-yellow-500/10 border border-yellow-500/20">
                    <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-yellow-400">Suspending {profile.full_name} will prevent them from logging in.</p>
                  </div>
                  <div>
                    <Label className="text-xs">Reason (required)</Label>
                    <Textarea value={suspendReason} onChange={e => setSuspendReason(e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs">Duration</Label>
                    <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24h">24 hours</SelectItem>
                        <SelectItem value="3d">3 days</SelectItem>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="30d">30 days</SelectItem>
                        <SelectItem value="indefinite">Indefinite</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setActiveAction(null)}>Cancel</Button>
                    <Button variant="destructive" className="flex-1 bg-yellow-600 hover:bg-yellow-700" disabled={actionLoading || !suspendReason} onClick={handleSuspend}>
                      {actionLoading ? 'Suspending...' : 'Suspend User'}
                    </Button>
                  </div>
                </>
              )}

              {activeAction === 'ban' && (
                <>
                  <div className="flex items-start gap-2 p-2 rounded bg-destructive/10 border border-destructive/20">
                    <AlertTriangle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">Banning {profile.full_name} is permanent. They will not be able to create a new account with this email.</p>
                  </div>
                  <div>
                    <Label className="text-xs">Reason (required)</Label>
                    <Textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <div>
                    <Label className="text-xs">Type the user's email to confirm: <span className="font-mono text-foreground">{profile.email}</span></Label>
                    <Input value={banConfirmEmail} onChange={e => setBanConfirmEmail(e.target.value)} className="mt-1" placeholder={profile.email} />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setActiveAction(null)}>Cancel</Button>
                    <Button variant="destructive" className="flex-1" disabled={actionLoading || !banReason || banConfirmEmail !== profile.email} onClick={handleBan}>
                      {actionLoading ? 'Banning...' : 'Permanently Ban User'}
                    </Button>
                  </div>
                </>
              )}

              {activeAction === 'reset_password' && (
                <>
                  <p className="text-sm text-muted-foreground">This will send a password reset email to <span className="font-medium text-foreground">{profile.email}</span>.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setActiveAction(null)}>Cancel</Button>
                    <Button className="flex-1" disabled={actionLoading} onClick={handleResetPassword}>
                      {actionLoading ? 'Sending...' : 'Send Reset Email'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Section 1: Account Details */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Account Details</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[
                { label: 'User ID', value: <span className="flex items-center gap-1 font-mono text-[11px]">{userId.slice(0, 8)}… <button onClick={() => { navigator.clipboard.writeText(userId); toast.success('Copied'); }}><Copy size={10} className="text-muted-foreground hover:text-foreground" /></button></span> },
                { label: 'Joined', value: formatDate(profile.created_at) },
                { label: 'Last Active', value: relativeTime(profile.last_sign_in_at) },
                { label: 'Country', value: profile.country || '—' },
                { label: 'Status', value: <span className="capitalize">{profile.status}</span> },
                { label: 'Plan', value: <span className="capitalize">{profile.plan}</span> },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[10px] text-muted-foreground">{r.label}</p>
                  <p className="text-[13px] text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Usage Stats */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Usage Stats</h3>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {[
                { label: 'Credits Remaining', value: <span className="flex items-center gap-1"><Coins size={12} className="text-primary" /> {profile.credits}</span> },
                { label: 'Total Generations', value: genStats.total.toLocaleString() },
                { label: 'Total Credits Spent', value: genStats.totalCredits.toLocaleString() },
                { label: 'Estimated API Cost', value: `$${genStats.totalCost.toFixed(2)}` },
                { label: 'Member Since', value: formatDate(profile.created_at) },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[10px] text-muted-foreground">{r.label}</p>
                  <p className="text-[13px] text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Generation History */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent Generations</h3>
            <div className="max-h-[280px] overflow-y-auto rounded-lg border border-border/20">
              {generations.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">No generations yet</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/20">
                      <th className="text-left p-2 text-muted-foreground font-medium">Image</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Resolution</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Credits</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generations.map(g => (
                      <tr key={g.id} className="border-b border-border/10">
                        <td className="p-2">
                          {g.image_url ? (
                            <img src={g.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-muted/20 flex items-center justify-center"><ImageIcon size={12} className="text-muted-foreground" /></div>
                          )}
                        </td>
                        <td className="p-2 text-muted-foreground">{g.quality_tier || '—'}</td>
                        <td className="p-2">{g.credits_used}</td>
                        <td className="p-2 text-muted-foreground">{relativeTime(g.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Section 4: Admin Actions */}
          {!activeAction && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Admin Actions</h3>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs justify-start" onClick={() => setActiveAction('add_credits')}>Add Credits</Button>
                <Button variant="outline" size="sm" className="text-xs justify-start" onClick={() => setActiveAction('deduct_credits')}>Deduct Credits</Button>
                <Button variant="outline" size="sm" className="text-xs justify-start" onClick={() => setActiveAction('change_plan')}>Change Plan</Button>
                <Button variant="outline" size="sm" className="text-xs justify-start" onClick={() => setActiveAction('reset_password')}>Reset Password</Button>
                <Button variant="outline" size="sm" className="text-xs justify-start text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10" onClick={() => setActiveAction('suspend')}>Suspend</Button>
                <Button variant="outline" size="sm" className="text-xs justify-start text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setActiveAction('ban')}>Ban User</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
