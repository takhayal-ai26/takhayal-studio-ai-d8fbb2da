import { useState, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Search, Upload, Image, Filter, Copy, Trash2, Eye, Edit2, Download,
  X, Check, Calendar, HardDrive, FileImage, MoreVertical, Tag
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { useAdminMediaStore, MediaAsset, generateMediaId } from '@/stores/adminMediaStore';

const ASSET_TYPES: MediaAsset['type'][] = ['Banner', 'Tool Cover', 'Template', 'Brand', 'Background', 'Community', 'Other'];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AdminMedia() {
  const { assets, addAsset, removeAsset, updateAsset } = useAdminMediaStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [editAsset, setEditAsset] = useState<MediaAsset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Upload form state
  const [uploadType, setUploadType] = useState<MediaAsset['type']>('Other');
  const [uploadUsage, setUploadUsage] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<MediaAsset['type']>('Other');
  const [editUsage, setEditUsage] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editAlt, setEditAlt] = useState('');

  // Filtered assets
  const filtered = useMemo(() => {
    let result = assets;
    if (filterType !== 'all') {
      result = result.filter(a => a.type === filterType);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.type.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q)) ||
        a.usage.toLowerCase().includes(q) ||
        a.alt.toLowerCase().includes(q)
      );
    }
    return result;
  }, [assets, filterType, search]);

  // Stats
  const totalSize = useMemo(() => {
    const bytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
    return formatFileSize(bytes);
  }, [assets]);

  const recentCount = useMemo(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return assets.filter(a => new Date(a.dateAdded) >= sevenDaysAgo).length;
  }, [assets]);

  // Handle file selection
  const handleFilesSelected = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/') || f.type === 'image/svg+xml');
    if (fileArray.length === 0) {
      toast.error('Please select image files only');
      return;
    }
    setPendingFiles(fileArray);
    setUploadOpen(true);
  }, []);

  // Process upload
  const processUpload = useCallback(() => {
    if (pendingFiles.length === 0) return;

    let processed = 0;
    pendingFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const asset: MediaAsset = {
          id: generateMediaId(),
          name: file.name,
          type: uploadType,
          size: formatFileSize(file.size),
          sizeBytes: file.size,
          dateAdded: new Date().toISOString().split('T')[0],
          usage: uploadUsage || 'Unassigned',
          url: dataUrl,
          mimeType: file.type,
          tags: uploadTags.split(',').map(t => t.trim()).filter(Boolean),
          alt: uploadAlt || file.name.replace(/\.[^.]+$/, ''),
        };
        addAsset(asset);
        processed++;
        if (processed === pendingFiles.length) {
          toast.success(`${processed} asset${processed > 1 ? 's' : ''} uploaded successfully`);
          setUploadOpen(false);
          setPendingFiles([]);
          setUploadType('Other');
          setUploadUsage('');
          setUploadTags('');
          setUploadAlt('');
        }
      };
      reader.readAsDataURL(file);
    });
  }, [pendingFiles, uploadType, uploadUsage, uploadTags, uploadAlt, addAsset]);

  // Copy URL
  const handleCopyUrl = useCallback((asset: MediaAsset) => {
    if (asset.url) {
      navigator.clipboard.writeText(asset.url);
      toast.success('URL copied to clipboard');
    } else {
      toast.error('No URL available');
    }
  }, []);

  // Delete
  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    removeAsset(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  }, [deleteTarget, removeAsset]);

  // Open edit
  const openEdit = useCallback((asset: MediaAsset) => {
    setEditAsset(asset);
    setEditName(asset.name);
    setEditType(asset.type);
    setEditUsage(asset.usage);
    setEditTags(asset.tags.join(', '));
    setEditAlt(asset.alt);
  }, []);

  // Save edit
  const saveEdit = useCallback(() => {
    if (!editAsset) return;
    updateAsset(editAsset.id, {
      name: editName,
      type: editType,
      usage: editUsage,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
      alt: editAlt,
    });
    toast.success('Asset updated successfully');
    setEditAsset(null);
  }, [editAsset, editName, editType, editUsage, editTags, editAlt, updateAsset]);

  // Download
  const handleDownload = useCallback((asset: MediaAsset) => {
    if (!asset.url) {
      toast.error('No file to download');
      return;
    }
    const a = document.createElement('a');
    a.href = asset.url;
    a.download = asset.name;
    a.click();
    toast.success('Download started');
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Centralized asset management for the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFilesSelected(e.target.files)}
          />
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} /> Upload Asset
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Assets', value: String(assets.length), icon: FileImage },
          { label: 'Storage Used', value: totalSize, icon: HardDrive },
          { label: 'Recent Uploads', value: String(recentCount), icon: Calendar },
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
          <Input
            placeholder="Search assets by name, tag, type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-muted/30"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <Filter size={14} className="mr-1.5" />
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {ASSET_TYPES.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <Image size={40} className="mx-auto text-muted-foreground/20 mb-3" />
          <p className="text-muted-foreground text-sm">No assets found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filtered.map(item => (
            <Card
              key={item.id}
              className="border-border/40 bg-card/50 overflow-hidden group hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer"
              onClick={() => setPreviewAsset(item)}
            >
              <div className="aspect-square bg-muted/20 flex items-center justify-center relative overflow-hidden">
                {item.url ? (
                  <img src={item.url} alt={item.alt} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Image size={32} className="text-muted-foreground/30" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-foreground hover:bg-white/10"
                    onClick={e => { e.stopPropagation(); setPreviewAsset(item); }}
                  >
                    <Eye size={14} />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-foreground hover:bg-white/10"
                    onClick={e => { e.stopPropagation(); handleCopyUrl(item); }}
                  >
                    <Copy size={14} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground hover:bg-white/10">
                        <MoreVertical size={14} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => openEdit(item)}>
                        <Edit2 size={13} className="mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(item)}>
                        <Download size={13} className="mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleCopyUrl(item)}>
                        <Copy size={13} className="mr-2" /> Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(item)}>
                        <Trash2 size={13} className="mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="text-[12px] font-medium truncate">{item.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="outline" className="text-[9px]">{item.type}</Badge>
                  <span className="text-[10px] text-muted-foreground">{item.size}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={o => { if (!o) { setUploadOpen(false); setPendingFiles([]); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Assets</DialogTitle>
            <DialogDescription>
              {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''} selected
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview thumbnails */}
            {pendingFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {pendingFiles.slice(0, 6).map((f, i) => (
                  <div key={i} className="w-16 h-16 rounded-md bg-muted/30 border border-border/40 overflow-hidden flex items-center justify-center">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                {pendingFiles.length > 6 && (
                  <div className="w-16 h-16 rounded-md bg-muted/30 border border-border/40 flex items-center justify-center text-[11px] text-muted-foreground">
                    +{pendingFiles.length - 6}
                  </div>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Asset Type</Label>
              <Select value={uploadType} onValueChange={v => setUploadType(v as MediaAsset['type'])}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Usage / Location</Label>
              <Input value={uploadUsage} onChange={e => setUploadUsage(e.target.value)} placeholder="e.g. Home, Tools, Templates" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input value={uploadTags} onChange={e => setUploadTags(e.target.value)} placeholder="e.g. banner, hero, seasonal" className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alt Text</Label>
              <Input value={uploadAlt} onChange={e => setUploadAlt(e.target.value)} placeholder="Describe the image" className="h-9 text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setUploadOpen(false); setPendingFiles([]); }}>Cancel</Button>
            <Button size="sm" onClick={processUpload} className="gap-1.5">
              <Check size={14} /> Upload {pendingFiles.length} file{pendingFiles.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewAsset} onOpenChange={o => { if (!o) setPreviewAsset(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm">{previewAsset?.name}</DialogTitle>
            <DialogDescription>Asset preview and details</DialogDescription>
          </DialogHeader>
          {previewAsset && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/20 border border-border/30 overflow-hidden flex items-center justify-center max-h-[400px]">
                {previewAsset.url ? (
                  <img src={previewAsset.url} alt={previewAsset.alt} className="max-w-full max-h-[400px] object-contain" />
                ) : (
                  <div className="py-20"><Image size={48} className="text-muted-foreground/20" /></div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="text-[10px] ml-1">{previewAsset.type}</Badge></div>
                <div><span className="text-muted-foreground">Size:</span> <span className="ml-1">{previewAsset.size}</span></div>
                <div><span className="text-muted-foreground">Usage:</span> <span className="ml-1">{previewAsset.usage}</span></div>
                <div><span className="text-muted-foreground">Added:</span> <span className="ml-1">{previewAsset.dateAdded}</span></div>
                <div><span className="text-muted-foreground">MIME:</span> <span className="ml-1">{previewAsset.mimeType}</span></div>
                <div><span className="text-muted-foreground">Alt:</span> <span className="ml-1">{previewAsset.alt}</span></div>
                {previewAsset.tags.length > 0 && (
                  <div className="col-span-2 flex items-center gap-1 flex-wrap">
                    <Tag size={11} className="text-muted-foreground" />
                    {previewAsset.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handleCopyUrl(previewAsset)}>
                  <Copy size={12} /> Copy URL
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handleDownload(previewAsset)}>
                  <Download size={12} /> Download
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => { setPreviewAsset(null); openEdit(previewAsset); }}>
                  <Edit2 size={12} /> Edit
                </Button>
                <Button variant="outline" size="sm" className="text-xs gap-1.5 text-destructive" onClick={() => { setPreviewAsset(null); setDeleteTarget(previewAsset); }}>
                  <Trash2 size={12} /> Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editAsset} onOpenChange={o => { if (!o) setEditAsset(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Edit Asset</DialogTitle>
            <DialogDescription>Update asset metadata</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">File Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Asset Type</Label>
              <Select value={editType} onValueChange={v => setEditType(v as MediaAsset['type'])}>
                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Usage / Location</Label>
              <Input value={editUsage} onChange={e => setEditUsage(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Tags (comma-separated)</Label>
              <Input value={editTags} onChange={e => setEditTags(e.target.value)} className="h-9 text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Alt Text</Label>
              <Input value={editAlt} onChange={e => setEditAlt(e.target.value)} className="h-9 text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditAsset(null)}>Cancel</Button>
            <Button size="sm" onClick={saveEdit} className="gap-1.5"><Check size={14} /> Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
