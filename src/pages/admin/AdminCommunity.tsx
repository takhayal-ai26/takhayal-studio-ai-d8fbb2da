import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useModels } from '@/hooks/useModels';
import { toast } from 'sonner';
import {
  Search, Check, X, Eye, RotateCcw, Upload,
  Loader2, Image as ImageIcon, AlertTriangle, Star, StarOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';

interface CommunityPostRow {
  id: string;
  user_id: string | null;
  username: string;
  avatar_url: string | null;
  image_url: string;
  prompt: string;
  model: string;
  ratio: string;
  quality_or_resolution: string;
  source_generation_id: string | null;
  source_type: string;
  status: string;
  rejection_reason: string | null;
  is_featured: boolean;
  created_at: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
}

interface SavedCreator {
  username: string;
  avatar_url: string | null;
}

type Tab = 'pending' | 'approved' | 'rejected' | 'add';

const TABS: { id: Tab; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'add', label: 'Add Test Post' },
];

function detectRatio(w: number, h: number): string {
  const r = w / h;
  const candidates: [number, string][] = [
    [1,       '1:1'],
    [16 / 9,  '16:9'],
    [9 / 16,  '9:16'],
    [4 / 3,   '4:3'],
    [3 / 4,   '3:4'],
    [4 / 5,   '4:5'],
    [5 / 4,   '5:4'],
    [2 / 3,   '2:3'],
    [3 / 2,   '3:2'],
  ];
  let best = '1:1';
  let bestDiff = Infinity;
  for (const [target, label] of candidates) {
    const diff = Math.abs(r - target);
    if (diff < bestDiff) { bestDiff = diff; best = label; }
  }
  return best;
}

export default function AdminCommunity() {
  const { userName } = useApp();
  const { activeModels } = useModels();
  const [tab, setTab] = useState<Tab>('pending');
  const [posts, setPosts] = useState<CommunityPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailPost, setDetailPost] = useState<CommunityPostRow | null>(null);
  const [rejectPost, setRejectPost] = useState<CommunityPostRow | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [testForm, setTestForm] = useState({
    image_url: '',
    username: 'Takhayal Team',
    avatar_url: '',
    prompt: '',
    model: '',
    ratio: '1:1',
    quality_or_resolution: '1K',
    status: 'approved',
    is_featured: false,
  });
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testPreview, setTestPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savedCreators, setSavedCreators] = useState<SavedCreator[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isNewCreator, setIsNewCreator] = useState(false);
  const [newCreatorName, setNewCreatorName] = useState('');
  const dropRef = useRef<HTMLLabelElement>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const statusFilter = tab === 'add' ? 'pending' : tab;
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })
      .limit(200);

    if (!error && data) setPosts(data as unknown as CommunityPostRow[]);
    setLoading(false);
  }, [tab]);

  // Fetch saved creators (unique usernames from previous posts)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('community_posts')
        .select('username, avatar_url')
        .order('created_at', { ascending: false })
        .limit(500);
      if (data) {
        const map = new Map<string, string | null>();
        (data as any[]).forEach(d => {
          if (d.username && !map.has(d.username)) map.set(d.username, d.avatar_url);
        });
        setSavedCreators(Array.from(map, ([username, avatar_url]) => ({ username, avatar_url })));
      }
    })();
  }, [tab]);

  useEffect(() => {
    if (tab !== 'add') fetchPosts();
  }, [tab, fetchPosts]);

  const filteredPosts = posts.filter(p => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.username.toLowerCase().includes(q) || p.prompt.toLowerCase().includes(q) || p.model.toLowerCase().includes(q);
  });

  const handleApprove = async (post: CommunityPostRow) => {
    setActionLoading(post.id);
    const { error } = await supabase
      .from('community_posts')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: userName || 'admin',
        rejection_reason: null,
        rejected_at: null,
        rejected_by: null,
      } as any)
      .eq('id', post.id);
    if (!error) {
      toast.success('Approved successfully');
      fetchPosts();
    } else toast.error('Failed to approve');
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectPost) return;
    setActionLoading(rejectPost.id);
    const { error } = await supabase
      .from('community_posts')
      .update({
        status: 'rejected',
        rejected_at: new Date().toISOString(),
        rejected_by: userName || 'admin',
        rejection_reason: rejectReason || null,
        approved_at: null,
        approved_by: null,
      } as any)
      .eq('id', rejectPost.id);
    if (!error) {
      toast.success('Rejected successfully');
      setRejectPost(null);
      setRejectReason('');
      fetchPosts();
    } else toast.error('Failed to reject');
    setActionLoading(null);
  };

  const handleRestore = async (post: CommunityPostRow) => {
    setActionLoading(post.id);
    await supabase
      .from('community_posts')
      .update({ status: 'pending', rejection_reason: null, rejected_at: null, rejected_by: null, approved_at: null, approved_by: null } as any)
      .eq('id', post.id);
    toast.success('Restored to pending');
    fetchPosts();
    setActionLoading(null);
  };

  const handleRemove = async (post: CommunityPostRow) => {
    setActionLoading(post.id);
    await supabase
      .from('community_posts')
      .update({ status: 'rejected', rejected_at: new Date().toISOString(), rejected_by: userName || 'admin' } as any)
      .eq('id', post.id);
    toast.success('Removed from community');
    fetchPosts();
    setActionLoading(null);
  };

  const handleToggleFeatured = async (post: CommunityPostRow) => {
    await supabase.from('community_posts').update({ is_featured: !post.is_featured } as any).eq('id', post.id);
    toast.success(post.is_featured ? 'Unfeatured' : 'Featured');
    fetchPosts();
  };

  const processImageFile = (file: File) => {
    setTestFile(file);
    const url = URL.createObjectURL(file);
    setTestPreview(url);
    // Auto-detect ratio
    const img = new window.Image();
    img.onload = () => {
      const ratio = detectRatio(img.naturalWidth, img.naturalHeight);
      setTestForm(prev => ({ ...prev, ratio }));
    };
    img.src = url;
  };

  const handleTestFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) processImageFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmitTest = async () => {
    if (!testFile && !testForm.image_url) { toast.error('Please provide an image'); return; }
    setSubmitting(true);
    let imageUrl = testForm.image_url;
    if (testFile) {
      const ext = testFile.name.split('.').pop();
      const path = `community-test/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('tool-covers').upload(path, testFile, { contentType: testFile.type });
      if (uploadErr) { toast.error('Upload failed'); setSubmitting(false); return; }
      const { data: urlData } = supabase.storage.from('tool-covers').getPublicUrl(path);
      imageUrl = urlData.publicUrl;
    }
    let avatarUrl = testForm.avatar_url;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const path = `community-avatars/${Date.now()}.${ext}`;
      const { error: avatarErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { contentType: avatarFile.type });
      if (!avatarErr) {
        const { data: avatarData } = supabase.storage.from('avatars').getPublicUrl(path);
        avatarUrl = avatarData.publicUrl;
      }
    }
    const { error } = await supabase.from('community_posts').insert({
      image_url: imageUrl,
      username: testForm.username,
      avatar_url: avatarUrl || null,
      prompt: testForm.prompt,
      model: testForm.model,
      ratio: testForm.ratio,
      quality_or_resolution: testForm.quality_or_resolution,
      source_type: 'admin_manual',
      status: testForm.status,
      is_featured: testForm.is_featured,
      ...(testForm.status === 'approved' ? { approved_at: new Date().toISOString(), approved_by: userName || 'admin' } : {}),
    } as any);
    if (!error) {
      toast.success('Test post created successfully');
      setTestForm({ image_url: '', username: 'Takhayal Team', avatar_url: '', prompt: '', model: '', ratio: '1:1', quality_or_resolution: '1K', status: 'approved', is_featured: false });
      setTestFile(null);
      setTestPreview('');
      setAvatarFile(null);
      setAvatarPreview('');
    } else toast.error('Failed to create post');
    setSubmitting(false);
  };

  const PostCard = ({ post }: { post: CommunityPostRow }) => (
    <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors">
      <div className="aspect-square relative overflow-hidden bg-muted/20">
        <img src={post.image_url} alt="" className="w-full h-full object-cover" />
        {post.is_featured && <span className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">Featured</span>}
        {post.source_type === 'admin_manual' && <span className="absolute top-2 left-2 bg-muted/80 backdrop-blur-sm text-foreground text-[10px] font-medium px-2 py-0.5 rounded-full">Test</span>}
      </div>
      <div className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">{post.username?.charAt(0)?.toUpperCase() || '?'}</span>
          <span className="text-xs text-foreground font-medium truncate flex-1">{post.username || 'Unknown'}</span>
        </div>
        {post.prompt && <p className="text-[11px] text-muted-foreground line-clamp-2">{post.prompt}</p>}
        <div className="flex flex-wrap gap-1">
          {post.model && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{post.model}</span>}
          {post.ratio && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">{post.ratio}</span>}
        </div>
        <p className="text-[10px] text-muted-foreground/50">{formatDate(post.created_at, false)}</p>
        {tab === 'rejected' && post.rejection_reason && <p className="text-[10px] text-destructive bg-destructive/5 rounded px-2 py-1">Reason: {post.rejection_reason}</p>}
        <div className="flex gap-1.5 pt-1">
          <button onClick={() => setDetailPost(post)} className="flex-1 h-7 rounded-lg bg-muted/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-1 transition-colors"><Eye size={12} /> View</button>
          {tab === 'pending' && (
            <>
              <button onClick={() => handleApprove(post)} disabled={actionLoading === post.id} className="flex-1 h-7 rounded-lg bg-green-500/10 text-green-600 text-[11px] font-medium hover:bg-green-500/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-50">{actionLoading === post.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Approve</button>
              <button onClick={() => { setRejectPost(post); setRejectReason(''); }} disabled={actionLoading === post.id} className="flex-1 h-7 rounded-lg bg-destructive/10 text-destructive text-[11px] font-medium hover:bg-destructive/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"><X size={12} /> Reject</button>
            </>
          )}
          {tab === 'approved' && (
            <>
              <button onClick={() => handleToggleFeatured(post)} className="h-7 px-2 rounded-lg bg-muted/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-1 transition-colors">{post.is_featured ? <StarOff size={12} /> : <Star size={12} />}</button>
              <button onClick={() => handleRemove(post)} disabled={actionLoading === post.id} className="flex-1 h-7 rounded-lg bg-destructive/10 text-destructive text-[11px] font-medium hover:bg-destructive/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"><X size={12} /> Remove</button>
            </>
          )}
          {tab === 'rejected' && (
            <>
              <button onClick={() => handleRestore(post)} disabled={actionLoading === post.id} className="flex-1 h-7 rounded-lg bg-muted/30 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"><RotateCcw size={12} /> Restore</button>
              <button onClick={() => handleApprove(post)} disabled={actionLoading === post.id} className="flex-1 h-7 rounded-lg bg-green-500/10 text-green-600 text-[11px] font-medium hover:bg-green-500/20 flex items-center justify-center gap-1 transition-colors disabled:opacity-50"><Check size={12} /> Approve</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Community Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage user-submitted community posts before they appear publicly</p>
      </div>

      <div className="flex gap-1 bg-muted/30 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all ${tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
        ))}
      </div>

      {tab !== 'add' && (
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by username, prompt, or model..." className="pl-9 h-9 text-sm" />
        </div>
      )}

      {tab === 'add' ? (
        <div className="max-w-2xl space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Image *</label>
            <div className="flex items-start gap-4">
              <label
                ref={dropRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-40 h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors overflow-hidden bg-muted/10 ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/40'}`}
              >
                {testPreview ? (
                  <img src={testPreview} className="w-full h-full object-cover" alt="" />
                ) : (
                  <>
                    <Upload size={22} className="text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground font-medium">Drop or click</span>
                    <span className="text-[9px] text-muted-foreground/50">to upload image</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleTestFileChange} />
              </label>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted-foreground">Or paste image URL</label>
                <Input value={testForm.image_url} onChange={e => {
                  const url = e.target.value;
                  setTestForm(prev => ({ ...prev, image_url: url }));
                  if (url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i)) {
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => {
                      const ratio = detectRatio(img.naturalWidth, img.naturalHeight);
                      setTestForm(prev => ({ ...prev, ratio }));
                    };
                    img.src = url;
                  }
                }} placeholder="https://..." className="h-9 text-sm" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Creator Profile</label>
            <div className="flex items-center gap-4">
              <label className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors overflow-hidden bg-muted/10 shrink-0">
                {avatarPreview || testForm.avatar_url ? (
                  <img src={avatarPreview || testForm.avatar_url} className="w-full h-full object-cover" alt="" />
                ) : (
                  <Upload size={16} className="text-muted-foreground" />
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFileChange} />
              </label>
              <div className="flex-1 grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Username</label>
                  {isNewCreator ? (
                    <div className="flex gap-1.5">
                      <Input
                        autoFocus
                        value={newCreatorName}
                        onChange={e => setNewCreatorName(e.target.value)}
                        placeholder="Type new username..."
                        className="h-9 text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newCreatorName.trim()) {
                            setTestForm(prev => ({ ...prev, username: newCreatorName.trim() }));
                          }
                          setIsNewCreator(false);
                          setNewCreatorName('');
                        }}
                        className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium"
                      >
                        {newCreatorName.trim() ? 'Set' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <Select
                      value={savedCreators.some(c => c.username === testForm.username) ? testForm.username : undefined}
                      onValueChange={v => {
                        if (v === '__new__') {
                          setIsNewCreator(true);
                          return;
                        }
                        const creator = savedCreators.find(c => c.username === v);
                        setTestForm(prev => ({
                          ...prev,
                          username: v,
                          avatar_url: creator?.avatar_url || prev.avatar_url,
                        }));
                        if (creator?.avatar_url) {
                          setAvatarPreview(creator.avatar_url);
                          setAvatarFile(null);
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder={testForm.username || 'Select creator...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {savedCreators.map(c => (
                          <SelectItem key={c.username} value={c.username}>
                            <span className="flex items-center gap-2">
                              {c.avatar_url ? (
                                <img src={c.avatar_url} className="w-4 h-4 rounded-full object-cover" alt="" />
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary">{c.username.charAt(0).toUpperCase()}</span>
                              )}
                              {c.username}
                            </span>
                          </SelectItem>
                        ))}
                        <SelectItem value="__new__">+ New creator...</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Avatar URL <span className="text-muted-foreground/60">(or upload)</span></label>
                  <Input value={testForm.avatar_url} onChange={e => setTestForm({ ...testForm, avatar_url: e.target.value })} placeholder="https://..." className="h-9 text-sm" />
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-foreground">Model</label>
              <Select value={testForm.model} onValueChange={v => setTestForm({ ...testForm, model: v })}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select model..." /></SelectTrigger><SelectContent>{activeModels.map(m => (<SelectItem key={m.id} value={m.model_name}>{m.model_name}</SelectItem>))}</SelectContent></Select>
            </div>
          </div>
          <div className="space-y-1"><label className="text-sm font-medium text-foreground">Prompt</label><Textarea value={testForm.prompt} onChange={e => setTestForm({ ...testForm, prompt: e.target.value })} placeholder="Enter the generation prompt..." rows={4} className="text-sm" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1"><label className="text-sm font-medium text-foreground">Ratio</label>
              <Select value={testForm.ratio} onValueChange={v => setTestForm({ ...testForm, ratio: v })}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1:1">1:1</SelectItem><SelectItem value="16:9">16:9</SelectItem><SelectItem value="9:16">9:16</SelectItem><SelectItem value="4:3">4:3</SelectItem><SelectItem value="3:4">3:4</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium text-foreground">Quality</label>
              <Select value={testForm.quality_or_resolution} onValueChange={v => setTestForm({ ...testForm, quality_or_resolution: v })}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1K">1K</SelectItem><SelectItem value="2K">2K</SelectItem><SelectItem value="4K">4K</SelectItem><SelectItem value="HD">HD</SelectItem></SelectContent></Select>
            </div>
            <div className="space-y-1"><label className="text-sm font-medium text-foreground">Status</label>
              <Select value={testForm.status} onValueChange={v => setTestForm({ ...testForm, status: v })}><SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="approved">Approved (live)</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="rejected">Rejected</SelectItem></SelectContent></Select>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={testForm.is_featured} onChange={e => setTestForm({ ...testForm, is_featured: e.target.checked })} className="rounded border-border" /><span className="text-sm text-foreground">Mark as Featured</span></label>
          <button onClick={handleSubmitTest} disabled={submitting} className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2">{submitting ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />} Create Test Post</button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 size={24} className="text-primary animate-spin" /></div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-20"><ImageIcon size={28} className="text-muted-foreground/30 mx-auto mb-3" /><p className="text-sm text-muted-foreground">{tab === 'pending' ? 'No pending posts' : tab === 'approved' ? 'No approved posts' : 'No rejected posts'}</p></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{filteredPosts.map(p => <PostCard key={p.id} post={p} />)}</div>
      )}

      {/* Detail modal */}
      <Dialog open={!!detailPost} onOpenChange={v => !v && setDetailPost(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Post Details</DialogTitle><DialogDescription>Full details of the community submission</DialogDescription></DialogHeader>
          {detailPost && (
            <div className="space-y-4">
              <img src={detailPost.image_url} alt="" className="w-full rounded-xl max-h-[400px] object-contain bg-muted/10" />
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Username:</span> <span className="font-medium text-foreground">{detailPost.username}</span></div>
                <div><span className="text-muted-foreground">Model:</span> <span className="font-medium text-foreground">{detailPost.model || '—'}</span></div>
                <div><span className="text-muted-foreground">Ratio:</span> <span className="font-medium text-foreground">{detailPost.ratio || '—'}</span></div>
                <div><span className="text-muted-foreground">Quality:</span> <span className="font-medium text-foreground">{detailPost.quality_or_resolution || '—'}</span></div>
                <div><span className="text-muted-foreground">Source:</span> <span className="font-medium text-foreground">{detailPost.source_type}</span></div>
                <div><span className="text-muted-foreground">Status:</span> <span className={`font-medium ${detailPost.status === 'approved' ? 'text-green-600' : detailPost.status === 'rejected' ? 'text-destructive' : 'text-yellow-600'}`}>{detailPost.status}</span></div>
                <div><span className="text-muted-foreground">Submitted:</span> <span className="font-medium text-foreground">{formatDate(detailPost.created_at, false)}</span></div>
                {detailPost.approved_at && <div><span className="text-muted-foreground">Approved:</span> <span className="font-medium text-foreground">{formatDate(detailPost.approved_at, false)}</span></div>}
              </div>
              {detailPost.prompt && <div><h4 className="text-sm font-medium text-foreground mb-1">Prompt</h4><p className="text-sm text-muted-foreground bg-muted/20 rounded-lg p-3 whitespace-pre-wrap">{detailPost.prompt}</p></div>}
              {detailPost.rejection_reason && <div><h4 className="text-sm font-medium text-destructive mb-1">Rejection Reason</h4><p className="text-sm text-destructive/80 bg-destructive/5 rounded-lg p-3">{detailPost.rejection_reason}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject modal */}
      <Dialog open={!!rejectPost} onOpenChange={v => { if (!v) { setRejectPost(null); setRejectReason(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle size={16} className="text-destructive" /> Reject Post</DialogTitle><DialogDescription>This post will be hidden from the public community feed.</DialogDescription></DialogHeader>
          <div className="space-y-3">
            {rejectPost?.image_url && <img src={rejectPost.image_url} alt="" className="w-full h-32 object-cover rounded-lg" />}
            <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Optional rejection reason..." rows={3} className="text-sm" />
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => { setRejectPost(null); setRejectReason(''); }} className="h-9 px-4 rounded-lg bg-muted/30 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">Cancel</button>
            <button onClick={handleReject} disabled={actionLoading === rejectPost?.id} className="h-9 px-4 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2">{actionLoading === rejectPost?.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
