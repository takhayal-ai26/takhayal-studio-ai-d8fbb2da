import { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Upload, X, RefreshCw, ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';

interface DBTemplate {
  id?: string;
  title_en: string;
  title_ar: string;
  category: string;
  cover_image_url: string;
  ratio: string;
  width?: number | null;
  height?: number | null;
  prompt: string;
  prompt_ar: string;
  active: boolean;
  featured: boolean;
  show_on_studio: boolean;
  sort_order: number;
  default_model_id: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: DBTemplate | null;
  onSave: (t: DBTemplate) => void;
  categories: string[];
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function detectRatio(w: number, h: number): string {
  const r = w / h;
  if (Math.abs(r - 1) < 0.08) return '1:1';
  if (Math.abs(r - 4 / 5) < 0.08) return '4:5';
  if (Math.abs(r - 9 / 16) < 0.08) return '9:16';
  if (Math.abs(r - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(r - 3 / 2) < 0.08) return '3:2';
  if (Math.abs(r - 2 / 3) < 0.08) return '2:3';
  if (r < 0.7) return '9:16';
  if (r < 0.9) return '2:3';
  if (r < 1.1) return '1:1';
  if (r < 1.4) return '4:5';
  if (r < 1.6) return '3:2';
  return '16:9';
}

function emptyTemplate(): DBTemplate {
  return {
    title_en: '',
    title_ar: '',
    category: '',
    cover_image_url: '',
    ratio: '1:1',
    width: null,
    height: null,
    prompt: '',
    prompt_ar: '',
    active: true,
    featured: false,
    show_on_studio: false,
    sort_order: 0,
    default_model_id: null,
  };
}

export default function TemplateEditorDialog({ open, onOpenChange, template, onSave, categories }: Props) {
  const [form, setForm] = useState<DBTemplate>(emptyTemplate());
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEdit = !!template?.id;

  useEffect(() => {
    if (open) {
      setForm(template ? { ...template, prompt_ar: template.prompt_ar || '' } : emptyTemplate());
      setUploading(false);
      setUploadProgress(0);
    }
  }, [open, template]);

  const processFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: 'Invalid file type', description: 'Please upload JPG, PNG, or WebP', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: 'File too large', description: 'Maximum size is 10MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    const dims = await new Promise<{ w: number; h: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });

    setUploadProgress(30);
    const ratio = detectRatio(dims.w, dims.h);
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${ext}`;

    setUploadProgress(50);

    const { data, error } = await supabase.storage
      .from('template-covers')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    setUploadProgress(80);
    const { data: urlData } = supabase.storage.from('template-covers').getPublicUrl(data.path);
    setUploadProgress(100);

    setForm(prev => ({
      ...prev,
      cover_image_url: urlData.publicUrl,
      ratio,
      width: dims.w,
      height: dims.h,
    }));

    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
    toast({ title: 'Image uploaded', description: `Auto-detected ratio: ${ratio} (${dims.w}×${dims.h})` });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (e.target) e.target.value = '';
  };

  const removeImage = () => {
    setForm(prev => ({ ...prev, cover_image_url: '', width: null, height: null, ratio: '1:1' }));
  };

  const handleSave = async () => {
    if (!form.title_en.trim()) {
      toast({ title: 'Error', description: 'English title is required', variant: 'destructive' });
      return;
    }
    if (!form.cover_image_url) {
      toast({ title: 'Error', description: 'Please upload a cover image', variant: 'destructive' });
      return;
    }
    setSaving(true);
    await new Promise(r => setTimeout(r, 200));
    onSave(form);
    setSaving(false);
    onOpenChange(false);
    toast({ title: isEdit ? 'Template updated' : 'Template created' });
  };

  const set = (key: keyof DBTemplate, value: any) => setForm(p => ({ ...p, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 bg-card border-border/40">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-lg">{isEdit ? 'Edit Template' : 'Create Template'}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {isEdit ? 'Update template details' : 'Add a new template to the gallery'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-5 pb-4">
            {/* Title EN/AR */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Title (English)</Label>
                <Input value={form.title_en} onChange={e => set('title_en', e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40" placeholder="Template title" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title (Arabic)</Label>
                <Input dir="rtl" value={form.title_ar} onChange={e => set('title_ar', e.target.value)} className="h-9 text-sm bg-muted/30 border-border/40 text-right" placeholder="عنوان القالب" />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => set('category', v)}>
                <SelectTrigger className="h-9 text-xs bg-muted/30 border-border/40"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs">Cover Image</Label>
              {form.cover_image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20">
                  <div className="relative w-full" style={{ maxHeight: 280 }}>
                    <img src={form.cover_image_url} alt="Cover preview" className="w-full h-full object-contain max-h-[280px]" />
                  </div>
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full bg-background/80 backdrop-blur text-[11px] font-medium text-foreground border border-border/40">
                      {form.ratio} {form.width && form.height ? `• ${form.width}×${form.height}` : ''}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur border border-border/40 hover:bg-background" onClick={() => fileInputRef.current?.click()}>
                      <RefreshCw size={12} />
                    </Button>
                    <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur border border-border/40 hover:bg-destructive hover:text-destructive-foreground" onClick={removeImage}>
                      <X size={12} />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                    ${dragOver ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/40 bg-muted/10 hover:border-primary/50 hover:bg-muted/20'}
                    ${uploading ? 'pointer-events-none' : ''}
                  `}
                >
                  {uploading ? (
                    <>
                      <Loader2 size={28} className="text-primary animate-spin" />
                      <p className="text-xs text-muted-foreground">Uploading...</p>
                      <div className="w-48"><Progress value={uploadProgress} className="h-1.5" /></div>
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-xl bg-muted/30 border border-border/30"><ImageIcon size={24} className="text-muted-foreground" /></div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">Drag & drop image or click to upload</p>
                        <p className="text-[11px] text-muted-foreground mt-1">JPG, PNG, WebP • Max 10MB</p>
                        <p className="text-[11px] text-muted-foreground">Aspect ratio is auto-detected</p>
                      </div>
                    </>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Prompt EN */}
            <div className="space-y-1.5">
              <Label className="text-xs">Prompt (English) <span className="text-muted-foreground">— used when app language is English</span></Label>
              <Textarea value={form.prompt} onChange={e => set('prompt', e.target.value)} className="bg-muted/30 text-sm border-border/40 min-h-[80px]" placeholder="English generation prompt..." />
            </div>

            {/* Prompt AR */}
            <div className="space-y-1.5">
              <Label className="text-xs">Prompt (Arabic) <span className="text-muted-foreground">— used when app language is Arabic</span></Label>
              <Textarea dir="rtl" value={form.prompt_ar} onChange={e => set('prompt_ar', e.target.value)} className="bg-muted/30 text-sm border-border/40 min-h-[80px] text-right" placeholder="وصف التوليد بالعربية..." />
            </div>

            {/* Sort Order */}
            <div className="space-y-1.5 w-32">
              <Label className="text-xs">Sort Order</Label>
              <Input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value) || 0)} className="h-9 text-sm bg-muted/30 border-border/40" />
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div><Label className="text-xs">Active</Label><p className="text-[10px] text-muted-foreground">Template is visible on the gallery</p></div>
                <Switch checked={form.active} onCheckedChange={v => set('active', v)} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div><Label className="text-xs">Featured</Label><p className="text-[10px] text-muted-foreground">Show in featured section</p></div>
                <Switch checked={form.featured} onCheckedChange={v => set('featured', v)} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <div><Label className="text-xs">Show on Studio</Label><p className="text-[10px] text-muted-foreground">Include in Studio page template rotation</p></div>
                <Switch checked={form.show_on_studio} onCheckedChange={v => set('show_on_studio', v)} />
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 border-t border-border/20">
          <Button variant="outline" size="sm" className="text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="text-xs gap-1.5" onClick={handleSave} disabled={saving || uploading}>
            {saving && <Loader2 size={12} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
