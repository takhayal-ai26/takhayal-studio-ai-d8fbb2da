import { useState } from 'react';
import { Plus, Film, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { useVideoModels, type VideoModel } from '@/hooks/useVideoModels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const EMPTY_MODEL: Partial<VideoModel> = {
  name: '', display_name: '', fal_endpoint: '', provider: '',
  preview_image_url: '', supports_audio: false, supports_start_frame: true,
  start_frame_required: false, supports_end_frame: false, supports_reference_images: false,
  aspect_ratios: ['16:9', '9:16', '1:1'], resolutions: ['720p', '1080p'], durations: [5, 10],
  credit_cost_per_second_no_audio: 5, credit_cost_per_second_with_audio: 0,
  badge: null, is_active: true, sort_order: 0,
};

function ChipInput({ label, values, onChange, type = 'text' }: {
  label: string; values: (string | number)[]; onChange: (v: (string | number)[]) => void; type?: 'text' | 'number';
}) {
  const [input, setInput] = useState('');
  const add = () => {
    const val = type === 'number' ? Number(input) : input.trim();
    if (!val && val !== 0) return;
    if (!values.includes(val)) onChange([...values, val]);
    setInput('');
  };
  return (
    <div>
      <Label className="text-xs mb-1.5 block">{label}</Label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-medium">
            {String(v)}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <Input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={`Add ${label.toLowerCase()}`}
          className="h-8 text-xs"
          type={type}
        />
        <Button size="sm" variant="outline" onClick={add} className="h-8 text-xs px-3">Add</Button>
      </div>
    </div>
  );
}

export default function AdminVideoModels({ embedded }: { embedded?: boolean }) {
  const { models, loading, refetch } = useVideoModels(false);
  const [editModel, setEditModel] = useState<Partial<VideoModel> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    if (!editModel?.name || !editModel.display_name || !editModel.fal_endpoint) {
      toast.error('Name, display name, and endpoint are required');
      return;
    }
    setSaving(true);
    const payload = {
      name: editModel.name,
      display_name: editModel.display_name,
      fal_endpoint: editModel.fal_endpoint,
      provider: editModel.provider || '',
      preview_image_url: editModel.preview_image_url || '',
      supports_audio: editModel.supports_audio ?? false,
      supports_start_frame: editModel.supports_start_frame ?? true,
      start_frame_required: editModel.start_frame_required ?? false,
      supports_end_frame: editModel.supports_end_frame ?? false,
      supports_reference_images: editModel.supports_reference_images ?? false,
      aspect_ratios: editModel.aspect_ratios || [],
      resolutions: editModel.resolutions || [],
      durations: editModel.durations || [],
      credit_cost_per_second_no_audio: editModel.credit_cost_per_second_no_audio ?? 5,
      credit_cost_per_second_with_audio: editModel.credit_cost_per_second_with_audio ?? 0,
      badge: editModel.badge || null,
      is_active: editModel.is_active ?? true,
      sort_order: editModel.sort_order ?? 0,
    };

    let error: any;
    if (editModel.id) {
      ({ error } = await supabase.from('video_models' as any).update(payload as any).eq('id', editModel.id));
    } else {
      ({ error } = await supabase.from('video_models' as any).insert(payload as any));
    }

    if (error) { toast.error('Save failed: ' + error.message); }
    else { toast.success('Saved'); setEditModel(null); refetch(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this video model?')) return;
    const { error } = await supabase.from('video_models' as any).delete().eq('id', id);
    if (error) toast.error('Delete failed');
    else { toast.success('Deleted'); refetch(); }
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const path = `video-models/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from('model-guide-images').upload(path, file);
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('model-guide-images').getPublicUrl(path);
    setEditModel(prev => prev ? { ...prev, preview_image_url: publicUrl } : prev);
    setUploading(false);
  };

  const handleToggleActive = async (model: VideoModel) => {
    await supabase.from('video_models' as any).update({ is_active: !model.is_active } as any).eq('id', model.id);
    refetch();
  };

  return (
    <div className={cn("space-y-4", !embedded && "p-6")}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Video Models</h2>
          <p className="text-sm text-muted-foreground">Manage video generation models and their capabilities</p>
        </div>
        <Button size="sm" onClick={() => setEditModel({ ...EMPTY_MODEL })} className="gap-1.5">
          <Plus size={14} /> Add Model
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {models.map(model => (
            <div key={model.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border/40">
              <GripVertical size={14} className="text-muted-foreground/30 cursor-grab" />
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/20 flex-shrink-0 flex items-center justify-center">
                {model.preview_image_url ? (
                  <img src={model.preview_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Film size={16} className="text-muted-foreground/30" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{model.display_name}</span>
                  {model.badge && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{model.badge}</Badge>}
                  <span className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">{model.provider}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {model.durations.join('/')}s · {model.resolutions.join(', ')} · {model.credit_cost_per_second_no_audio} cr/s
                  {model.supports_audio && ` · audio ${model.credit_cost_per_second_with_audio} cr/s`}
                </p>
              </div>
              <Switch checked={model.is_active} onCheckedChange={() => handleToggleActive(model)} />
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditModel({ ...model })}>
                <Pencil size={14} />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(model.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          ))}
          {models.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No video models yet</p>}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editModel} onOpenChange={open => { if (!open) setEditModel(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editModel?.id ? 'Edit Video Model' : 'Add Video Model'}</DialogTitle>
          </DialogHeader>
          {editModel && (
            <div className="space-y-5 pt-2">
              {/* Preview Image */}
              <div>
                <Label className="text-xs mb-1.5 block">Preview Image</Label>
                <div
                  className="relative w-full aspect-[2.4/1] rounded-xl overflow-hidden border border-dashed border-border/40 cursor-pointer group"
                  onClick={() => document.getElementById('vm-img-upload')?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) handleImageUpload(e.dataTransfer.files[0]); }}
                >
                  {editModel.preview_image_url ? (
                    <img src={editModel.preview_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                      <span className="text-white/40 text-sm font-medium">{editModel.display_name || 'Preview'}</span>
                    </div>
                  )}
                  {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" /></div>}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="text-white text-xs font-medium">Click or drag to upload</span>
                  </div>
                </div>
                <input id="vm-img-upload" type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Name (slug)</Label><Input value={editModel.name || ''} onChange={e => setEditModel({ ...editModel, name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Display Name</Label><Input value={editModel.display_name || ''} onChange={e => setEditModel({ ...editModel, display_name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">FAL Endpoint</Label><Input value={editModel.fal_endpoint || ''} onChange={e => setEditModel({ ...editModel, fal_endpoint: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Provider</Label><Input value={editModel.provider || ''} onChange={e => setEditModel({ ...editModel, provider: e.target.value })} className="mt-1" /></div>
              </div>

              {/* Feature Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <Label className="text-xs">Supports Audio</Label>
                  <Switch checked={editModel.supports_audio ?? false} onCheckedChange={v => setEditModel({ ...editModel, supports_audio: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <Label className="text-xs">Supports Start Frame</Label>
                  <Switch checked={editModel.supports_start_frame ?? false} onCheckedChange={v => setEditModel({ ...editModel, supports_start_frame: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <Label className="text-xs">Start Frame Required</Label>
                  <Switch checked={editModel.start_frame_required ?? false} onCheckedChange={v => setEditModel({ ...editModel, start_frame_required: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <Label className="text-xs">Supports End Frame</Label>
                  <Switch checked={editModel.supports_end_frame ?? false} onCheckedChange={v => setEditModel({ ...editModel, supports_end_frame: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <Label className="text-xs">Supports Reference Images</Label>
                  <Switch checked={editModel.supports_reference_images ?? false} onCheckedChange={v => setEditModel({ ...editModel, supports_reference_images: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                  <Label className="text-xs">Active</Label>
                  <Switch checked={editModel.is_active ?? true} onCheckedChange={v => setEditModel({ ...editModel, is_active: v })} />
                </div>
              </div>

              {/* Chip Inputs */}
              <div className="grid grid-cols-3 gap-4">
                <ChipInput label="Aspect Ratios" values={editModel.aspect_ratios || []} onChange={v => setEditModel({ ...editModel, aspect_ratios: v as string[] })} />
                <ChipInput label="Resolutions" values={editModel.resolutions || []} onChange={v => setEditModel({ ...editModel, resolutions: v as string[] })} />
                <ChipInput label="Durations (seconds)" values={editModel.durations || []} onChange={v => setEditModel({ ...editModel, durations: v as number[] })} type="number" />
              </div>

              {/* Credit Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Credits/sec (no audio)</Label>
                  <Input type="number" value={editModel.credit_cost_per_second_no_audio ?? 5} onChange={e => setEditModel({ ...editModel, credit_cost_per_second_no_audio: Number(e.target.value) })} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Credits/sec (with audio)</Label>
                  <Input type="number" value={editModel.credit_cost_per_second_with_audio ?? 0} onChange={e => setEditModel({ ...editModel, credit_cost_per_second_with_audio: Number(e.target.value) })} className="mt-1" disabled={!editModel.supports_audio} />
                </div>
              </div>

              {/* Badge & Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Badge</Label>
                  <Select value={editModel.badge || 'none'} onValueChange={v => setEditModel({ ...editModel, badge: v === 'none' ? null : v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="NEW">NEW</SelectItem>
                      <SelectItem value="EXCLUSIVE">EXCLUSIVE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sort Order</Label>
                  <Input type="number" value={editModel.sort_order ?? 0} onChange={e => setEditModel({ ...editModel, sort_order: Number(e.target.value) })} className="mt-1" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditModel(null)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
