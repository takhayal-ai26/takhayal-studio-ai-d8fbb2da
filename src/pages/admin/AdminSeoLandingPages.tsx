import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import {
  seoConfigToRecordInput,
  useDeleteSeoLandingPage,
  useSaveSeoLandingPage,
  useSeoLandingPages,
  type SeoLandingPageRecord,
} from '@/hooks/useCmsData';
import {
  SEO_LANDING_LAST_UPDATED,
  seoLandingPages,
  type SeoLandingPageConfig,
} from '@/data/seoLandingPages';
import { Edit, Plus, Trash2 } from 'lucide-react';

type SeoPageRow = Partial<SeoLandingPageRecord> & {
  slug: string;
  source: 'database' | 'fallback';
};

const JSON_FIELDS = [
  'title',
  'description',
  'eyebrow',
  'h1',
  'direct_answer',
  'table_headings',
  'table_rows',
  'use_cases',
  'limitations',
  'faqs',
] as const;

type JsonField = (typeof JSON_FIELDS)[number];

function fallbackRecord(config: SeoLandingPageConfig): SeoPageRow {
  return {
    ...seoConfigToRecordInput(config, true, SEO_LANDING_LAST_UPDATED),
    id: undefined,
    source: 'fallback',
  };
}

function stringifyJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function SeoLandingPageEditor({ page, onClose }: { page: SeoPageRow; onClose: () => void }) {
  const savePage = useSaveSeoLandingPage();
  const [slug, setSlug] = useState(page.slug);
  const [active, setActive] = useState(page.active ?? true);
  const [dateModified, setDateModified] = useState(page.date_modified || new Date().toISOString().slice(0, 10));
  const [jsonText, setJsonText] = useState<Record<JsonField, string>>(() => ({
    title: stringifyJson(page.title),
    description: stringifyJson(page.description),
    eyebrow: stringifyJson(page.eyebrow),
    h1: stringifyJson(page.h1),
    direct_answer: stringifyJson(page.direct_answer),
    table_headings: stringifyJson(page.table_headings),
    table_rows: stringifyJson(page.table_rows),
    use_cases: stringifyJson(page.use_cases),
    limitations: stringifyJson(page.limitations),
    faqs: stringifyJson(page.faqs),
  }));

  const save = async () => {
    if (!slug.trim()) {
      toast({ title: 'Missing slug', description: 'SEO pages need a stable slug.', variant: 'destructive' });
      return;
    }

    const parsed = {} as Record<JsonField, unknown>;
    try {
      for (const field of JSON_FIELDS) parsed[field] = JSON.parse(jsonText[field]);
    } catch (error: any) {
      toast({ title: 'Invalid JSON', description: error.message || 'One of the SEO fields is not valid JSON.', variant: 'destructive' });
      return;
    }

    try {
      await savePage.mutateAsync({
        id: page.id,
        slug: slug.trim(),
        title: parsed.title as SeoLandingPageRecord['title'],
        description: parsed.description as SeoLandingPageRecord['description'],
        eyebrow: parsed.eyebrow as SeoLandingPageRecord['eyebrow'],
        h1: parsed.h1 as SeoLandingPageRecord['h1'],
        direct_answer: parsed.direct_answer as SeoLandingPageRecord['direct_answer'],
        table_headings: parsed.table_headings as SeoLandingPageRecord['table_headings'],
        table_rows: parsed.table_rows as SeoLandingPageRecord['table_rows'],
        use_cases: parsed.use_cases as SeoLandingPageRecord['use_cases'],
        limitations: parsed.limitations as SeoLandingPageRecord['limitations'],
        faqs: parsed.faqs as SeoLandingPageRecord['faqs'],
        active,
        date_modified: dateModified,
      });
      toast({ title: 'Saved', description: `"${slug}" is now admin-managed.` });
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save SEO landing page', variant: 'destructive' });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{page.id ? 'Edit SEO Landing Page' : 'Create SEO Landing Page'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_180px_120px] gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={(event) => setSlug(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Date Modified</Label>
            <Input type="date" value={dateModified} onChange={(event) => setDateModified(event.target.value)} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={active} onCheckedChange={setActive} />
            <Label className="text-xs">Active</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4">
          {JSON_FIELDS.map((field) => (
            <div key={field} className={field === 'table_rows' || field === 'faqs' ? 'space-y-1.5 col-span-2' : 'space-y-1.5'}>
              <Label className="text-xs capitalize">{field.replace(/_/g, ' ')}</Label>
              <Textarea
                className="min-h-[140px] font-mono text-xs"
                value={jsonText[field]}
                onChange={(event) => setJsonText((current) => ({ ...current, [field]: event.target.value }))}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={savePage.isPending}>{savePage.isPending ? 'Saving...' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminSeoLandingPages() {
  const { data: dbPages = [], isLoading } = useSeoLandingPages();
  const deletePage = useDeleteSeoLandingPage();
  const [editing, setEditing] = useState<SeoPageRow | null>(null);

  const rows = useMemo<SeoPageRow[]>(() => {
    const bySlug = new Map<string, SeoPageRow>();
    for (const record of dbPages) bySlug.set(record.slug, { ...record, source: 'database' });
    for (const config of Object.values(seoLandingPages)) {
      if (!bySlug.has(config.slug)) bySlug.set(config.slug, fallbackRecord(config));
    }
    return Array.from(bySlug.values()).sort((a, b) => a.slug.localeCompare(b.slug));
  }, [dbPages]);

  const remove = async (page: SeoPageRow) => {
    if (!page.id || !confirm(`Delete database override for "${page.slug}"? The code fallback will remain.`)) return;
    try {
      await deletePage.mutateAsync(page.id);
      toast({ title: 'Deleted', description: `"${page.slug}" now uses the code fallback again.` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to delete SEO page', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Manage programmatic SEO landing pages. Fallback rows come from code until saved here.</p>
        <Button size="sm" className="gap-1.5 text-xs" onClick={() => setEditing(fallbackRecord({
          slug: 'new-page' as SeoLandingPageConfig['slug'],
          title: { en: '', ar: '' },
          description: { en: '', ar: '' },
          eyebrow: { en: '', ar: '' },
          h1: { en: '', ar: '' },
          directAnswer: { en: '', ar: '' },
          tableHeadings: { en: [], ar: [] },
          tableRows: [],
          useCases: { en: [], ar: [] },
          limitations: { en: [], ar: [] },
          faqs: [],
        }))}>
          <Plus size={14} /> Add SEO Page
        </Button>
      </div>

      <Card className="border-border/40 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">SEO Landing Pages</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="text-[11px] uppercase text-muted-foreground">Slug</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">H1</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Source</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Modified</TableHead>
              <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((page) => (
              <TableRow key={page.slug} className="border-border/20 hover:bg-muted/20">
                <TableCell className="text-[13px] font-medium">{page.slug}</TableCell>
                <TableCell className="text-[13px] text-muted-foreground">{page.h1?.en || page.title?.en || '-'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">{page.source === 'database' ? 'Admin' : 'Fallback'}</Badge>
                </TableCell>
                <TableCell className="text-[12px] text-muted-foreground">{page.date_modified || SEO_LANDING_LAST_UPDATED}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${page.active !== false ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                    {page.active !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(page)}><Edit size={12} /></Button>
                    {page.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(page)}><Trash2 size={12} /></Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  {isLoading ? 'Loading SEO pages...' : 'No SEO landing pages found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {editing && <SeoLandingPageEditor page={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
