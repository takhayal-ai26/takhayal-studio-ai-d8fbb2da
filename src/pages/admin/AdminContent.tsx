import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContentBlocks, useDeleteContentBlock, useSaveContentBlock, type ContentBlock, type ContentBlockInput } from '@/hooks/useCmsData';
import { Plus, Edit, Layers, Calendar, Eye, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const statusStyle: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  draft: 'bg-muted/30 text-muted-foreground border-border/40',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  archived: 'bg-destructive/10 text-destructive border-destructive/20',
};

const emptyBlock: ContentBlockInput = {
  key: '',
  location: 'home',
  type: 'section_intro',
  title_en: '',
  title_ar: '',
  body_en: '',
  body_ar: '',
  media_url: '',
  cta_label_en: '',
  cta_label_ar: '',
  cta_url: '',
  visible: true,
  status: 'draft',
  start_at: null,
  end_at: null,
  sort_order: 0,
  metadata_json: {},
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromDateTimeLocal(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function blockDateRange(block: ContentBlock) {
  if (!block.start_at && !block.end_at) return 'Always';
  const start = block.start_at ? new Date(block.start_at).toLocaleDateString() : 'Now';
  const end = block.end_at ? new Date(block.end_at).toLocaleDateString() : 'No end';
  return `${start} - ${end}`;
}

function ContentBlockEditor({ block, onClose }: { block: Partial<ContentBlockInput> | null; onClose: () => void }) {
  const [form, setForm] = useState<ContentBlockInput>({ ...emptyBlock, ...(block || {}) });
  const [metadataText, setMetadataText] = useState(() => JSON.stringify(block?.metadata_json || {}, null, 2));
  const saveBlock = useSaveContentBlock();

  const setField = <K extends keyof ContentBlockInput>(key: K, value: ContentBlockInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    if (!form.key.trim()) {
      toast({ title: 'Missing key', description: 'Content blocks need a stable key.', variant: 'destructive' });
      return;
    }

    let metadata: Record<string, unknown>;
    try {
      metadata = metadataText.trim() ? JSON.parse(metadataText) : {};
    } catch {
      toast({ title: 'Invalid metadata JSON', description: 'Metadata must be valid JSON.', variant: 'destructive' });
      return;
    }

    try {
      await saveBlock.mutateAsync({
        ...form,
        key: form.key.trim(),
        metadata_json: metadata,
      });
      toast({ title: 'Saved', description: `"${form.key}" is now persisted in the CMS.` });
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save content block', variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? 'Edit Content Block' : 'New Content Block'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Key</Label>
            <Input value={form.key} onChange={(event) => setField('key', event.target.value)} placeholder="home.tools.intro" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={form.location} onChange={(event) => setField('location', event.target.value)} placeholder="home" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Input value={form.type} onChange={(event) => setField('type', event.target.value)} placeholder="banner, hero, section_intro" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={(value) => setField('status', value as ContentBlock['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Title (EN)</Label>
            <Input value={form.title_en} onChange={(event) => setField('title_en', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Title (AR)</Label>
            <Input dir="rtl" value={form.title_ar} onChange={(event) => setField('title_ar', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body (EN)</Label>
            <Textarea value={form.body_en} onChange={(event) => setField('body_en', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body (AR)</Label>
            <Textarea dir="rtl" value={form.body_ar} onChange={(event) => setField('body_ar', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Media URL</Label>
            <Input value={form.media_url} onChange={(event) => setField('media_url', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CTA URL</Label>
            <Input value={form.cta_url} onChange={(event) => setField('cta_url', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CTA Label (EN)</Label>
            <Input value={form.cta_label_en} onChange={(event) => setField('cta_label_en', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">CTA Label (AR)</Label>
            <Input dir="rtl" value={form.cta_label_ar} onChange={(event) => setField('cta_label_ar', event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Start At</Label>
            <Input type="datetime-local" value={toDateTimeLocal(form.start_at)} onChange={(event) => setField('start_at', fromDateTimeLocal(event.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">End At</Label>
            <Input type="datetime-local" value={toDateTimeLocal(form.end_at)} onChange={(event) => setField('end_at', fromDateTimeLocal(event.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Sort Order</Label>
            <Input type="number" value={form.sort_order} onChange={(event) => setField('sort_order', Number(event.target.value))} />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch checked={form.visible} onCheckedChange={(value) => setField('visible', value)} />
            <Label className="text-xs">Visible</Label>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <Label className="text-xs">Metadata JSON</Label>
          <Textarea className="min-h-[120px] font-mono text-xs" value={metadataText} onChange={(event) => setMetadataText(event.target.value)} />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saveBlock.isPending}>{saveBlock.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminContent({ embedded }: { embedded?: boolean } = {}) {
  const { data: contentBlocks = [], isLoading } = useContentBlocks();
  const saveBlock = useSaveContentBlock();
  const deleteBlock = useDeleteContentBlock();
  const [editing, setEditing] = useState<Partial<ContentBlockInput> | null | 'new'>(null);

  const stats = useMemo(() => {
    return {
      active: contentBlocks.filter((block) => block.status === 'active' && block.visible).length,
      scheduled: contentBlocks.filter((block) => block.status === 'scheduled').length,
      visible: contentBlocks.filter((block) => block.visible).length,
    };
  }, [contentBlocks]);

  const toggleVisible = async (block: ContentBlock, visible: boolean) => {
    try {
      await saveBlock.mutateAsync({ id: block.id, visible });
      toast({ title: visible ? 'Visible' : 'Hidden', description: `"${block.key}" updated.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update visibility', variant: 'destructive' });
    }
  };

  const remove = async (block: ContentBlock) => {
    if (!confirm(`Delete "${block.key}"?`)) return;
    try {
      await deleteBlock.mutateAsync(block.id);
      toast({ title: 'Deleted', description: `"${block.key}" removed.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete content block', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={embedded ? 'text-lg font-semibold' : 'typo-heading-page'}>Content Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage CMS-backed banners, section intros, seasonal blocks, and lightweight page content</p>
        </div>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditing('new')}><Plus size={14} /> Add Content Block</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Blocks', value: stats.active, icon: Layers },
          { label: 'Scheduled', value: stats.scheduled, icon: Calendar },
          { label: 'Visible Blocks', value: stats.visible, icon: Eye },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/40 bg-card/50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><stat.icon size={16} className="text-primary" /></div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Content Blocks</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Content Block</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Location</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Type</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Date Range</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Visible</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {contentBlocks.map((block) => (
              <TableRow key={block.id} className="border-border/20 hover:bg-muted/20">
                <TableCell>
                  <p className="text-[13px] font-medium">{block.title_en || block.key}</p>
                  <p className="text-[11px] text-muted-foreground">{block.key}</p>
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px]">{block.location}</Badge></TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{block.type}</TableCell>
                <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusStyle[block.status]}`}>{block.status}</Badge></TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{blockDateRange(block)}</TableCell>
                <TableCell><Switch checked={block.visible} onCheckedChange={(value) => toggleVisible(block, value)} className="scale-75" /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(block)}><Edit size={12} /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(block)}><Trash2 size={12} /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {contentBlocks.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  {isLoading ? 'Loading content blocks...' : 'No content blocks yet. Add one to make this tab live.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {editing && (
        <ContentBlockEditor
          block={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
