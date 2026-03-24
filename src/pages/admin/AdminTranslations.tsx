import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { translations } from '@/i18n/translations';
import {
  Search, Download, Upload, RefreshCw, Plus, Languages, CheckCircle2,
  AlertCircle, Clock, Edit2, Copy, Trash2, Eye, FileDown, FileUp, Globe
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Flatten nested translation object into dot-notation keys
function flattenObj(obj: Record<string, any>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObj(obj[key], fullKey));
    } else {
      result[fullKey] = String(obj[key] ?? '');
    }
  }
  return result;
}

function getSectionFromKey(key: string): string {
  const first = key.split('.')[0];
  const map: Record<string, string> = {
    nav: 'Navigation', landing: 'Home', portal: 'Portal', toolsDir: 'Tools',
    toolPage: 'Tool Pages', studio: 'Studio', gallery: 'Gallery',
    templates: 'Templates', community: 'Community', auth: 'Auth',
    pricing: 'Billing', credits: 'Billing', avatar: 'Navigation',
    upgrade: 'Billing', settings: 'Settings', notFound: 'System',
  };
  return map[first] || 'General';
}

type TranslationEntry = {
  key: string;
  section: string;
  en: string;
  ar: string;
  status: 'complete' | 'missing' | 'review';
  updatedAt: string;
};

const SECTIONS = ['All', 'Navigation', 'Home', 'Portal', 'Studio', 'Tools', 'Tool Pages', 'Templates', 'Community', 'Auth', 'Billing', 'Settings', 'System', 'General'];
const STATUSES = ['All', 'complete', 'missing', 'review'];

export default function AdminTranslations() {
  const enFlat = useMemo(() => flattenObj(translations.en), []);
  const arFlat = useMemo(() => flattenObj(translations.ar), []);

  const allKeys = useMemo(() => {
    const keys = new Set([...Object.keys(enFlat), ...Object.keys(arFlat)]);
    return Array.from(keys).sort();
  }, [enFlat, arFlat]);

  const entries: TranslationEntry[] = useMemo(() =>
    allKeys.map(key => {
      const en = enFlat[key] || '';
      const ar = arFlat[key] || '';
      let status: TranslationEntry['status'] = 'complete';
      if (!en || !ar) status = 'missing';
      return { key, section: getSectionFromKey(key), en, ar, status, updatedAt: '2026-03-24' };
    }), [allKeys, enFlat, arFlat]);

  const [search, setSearch] = useState('');
  const [sectionFilter, setSectionFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editEntry, setEditEntry] = useState<TranslationEntry | null>(null);
  const [editEn, setEditEn] = useState('');
  const [editAr, setEditAr] = useState('');
  const [previewLang, setPreviewLang] = useState<'en' | 'ar'>('en');

  const filtered = useMemo(() => {
    return entries.filter(e => {
      if (sectionFilter !== 'All' && e.section !== sectionFilter) return false;
      if (statusFilter !== 'All' && e.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.key.toLowerCase().includes(q) || e.en.toLowerCase().includes(q) || e.ar.toLowerCase().includes(q);
      }
      return true;
    });
  }, [entries, search, sectionFilter, statusFilter]);

  const totalKeys = entries.length;
  const completed = entries.filter(e => e.status === 'complete').length;
  const missingAr = entries.filter(e => !e.ar).length;
  const missingEn = entries.filter(e => !e.en).length;

  const openEdit = (entry: TranslationEntry) => {
    setEditEntry(entry);
    setEditEn(entry.en);
    setEditAr(entry.ar);
    setPreviewLang('en');
  };

  const handleExportCSV = () => {
    const header = 'key,section,en,ar,status\n';
    const rows = entries.map(e =>
      `"${e.key}","${e.section}","${e.en.replace(/"/g, '""')}","${e.ar.replace(/"/g, '""')}","${e.status}"`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: `${entries.length} keys exported as CSV` });
  };

  const handleExportJSON = () => {
    const data = { en: translations.en, ar: translations.ar };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'translations.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Exported', description: 'Translations exported as JSON' });
  };

  const handleSync = () => {
    toast({ title: 'Sync Complete', description: `${totalKeys} keys synced from codebase` });
  };

  const statusBadge = (status: string) => {
    if (status === 'complete') return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-[11px]">Complete</Badge>;
    if (status === 'missing') return <Badge className="bg-red-500/15 text-red-400 border-red-500/20 text-[11px]">Missing</Badge>;
    return <Badge className="bg-yellow-500/15 text-yellow-400 border-yellow-500/20 text-[11px]">Review</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Translations</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all app content in multiple languages</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync}>
            <RefreshCw size={14} className="mr-1.5" /> Re-sync
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <FileDown size={14} className="mr-1.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportJSON}>
            <Download size={14} className="mr-1.5" /> JSON
          </Button>
          <Button variant="outline" size="sm">
            <FileUp size={14} className="mr-1.5" /> Import
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus size={14} className="mr-1.5" /> Add Key
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><Languages size={18} className="text-primary" /></div>
            <div><p className="text-2xl font-bold">{totalKeys}</p><p className="text-xs text-muted-foreground">Total Keys</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10"><CheckCircle2 size={18} className="text-emerald-400" /></div>
            <div><p className="text-2xl font-bold">{completed}</p><p className="text-xs text-muted-foreground">Completed</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-500/10"><AlertCircle size={18} className="text-red-400" /></div>
            <div><p className="text-2xl font-bold">{missingAr}</p><p className="text-xs text-muted-foreground">Missing Arabic</p></div>
          </CardContent>
        </Card>
        <Card className="bg-card/60 border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-yellow-500/10"><Clock size={18} className="text-yellow-400" /></div>
            <div><p className="text-2xl font-bold">{missingEn}</p><p className="text-xs text-muted-foreground">Missing English</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search keys, English, or Arabic..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-card/60 border-border/40"
          />
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm bg-card/60 border-border/40">
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            {SECTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px] h-9 text-sm bg-card/60 border-border/40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s === 'All' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">{filtered.length} of {totalKeys} keys</p>
      </div>

      {/* Table */}
      <Card className="bg-card/60 border-border/40">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40 hover:bg-transparent">
              <TableHead className="text-xs w-[240px]">Key</TableHead>
              <TableHead className="text-xs w-[100px]">Section</TableHead>
              <TableHead className="text-xs">English</TableHead>
              <TableHead className="text-xs">Arabic</TableHead>
              <TableHead className="text-xs w-[90px]">Status</TableHead>
              <TableHead className="text-xs w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 50).map(entry => (
              <TableRow key={entry.key} className="border-border/20 hover:bg-muted/20">
                <TableCell className="font-mono text-xs text-muted-foreground py-2.5">{entry.key}</TableCell>
                <TableCell className="py-2.5">
                  <Badge variant="outline" className="text-[10px] font-normal border-border/40">{entry.section}</Badge>
                </TableCell>
                <TableCell className="text-sm py-2.5 max-w-[200px] truncate">{entry.en || <span className="text-red-400 italic text-xs">missing</span>}</TableCell>
                <TableCell className="text-sm py-2.5 max-w-[200px] truncate" dir="rtl">{entry.ar || <span className="text-red-400 italic text-xs">missing</span>}</TableCell>
                <TableCell className="py-2.5">{statusBadge(entry.status)}</TableCell>
                <TableCell className="py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(entry)} className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <Edit2 size={13} />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length > 50 && (
          <div className="p-3 text-center border-t border-border/20">
            <p className="text-xs text-muted-foreground">Showing 50 of {filtered.length} keys</p>
          </div>
        )}
      </Card>

      {/* Edit Drawer */}
      <Sheet open={!!editEntry} onOpenChange={open => !open && setEditEntry(null)}>
        <SheetContent className="w-[520px] sm:max-w-[520px] bg-background border-border/40 overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-lg">Edit Translation</SheetTitle>
          </SheetHeader>
          {editEntry && (
            <div className="space-y-5 mt-6">
              {/* Key */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Key</label>
                <Input value={editEntry.key} readOnly className="font-mono text-xs bg-muted/20 border-border/40" />
              </div>

              {/* Section */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Section</label>
                  <Badge variant="outline" className="text-xs">{editEntry.section}</Badge>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground font-medium mb-1 block">Status</label>
                  {statusBadge(editEntry.status)}
                </div>
              </div>

              {/* English */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground font-medium">English</label>
                  <span className="text-[10px] text-muted-foreground">{editEn.length} chars</span>
                </div>
                <Textarea value={editEn} onChange={e => setEditEn(e.target.value)} rows={3} className="text-sm bg-card/60 border-border/40" />
              </div>

              {/* Arabic */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-muted-foreground font-medium">Arabic</label>
                  <span className="text-[10px] text-muted-foreground">{editAr.length} chars</span>
                </div>
                <Textarea value={editAr} onChange={e => setEditAr(e.target.value)} rows={3} dir="rtl" className="text-sm bg-card/60 border-border/40 text-right font-[Cairo]" />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Notes</label>
                <Textarea placeholder="Add context or notes for translators..." rows={2} className="text-xs bg-card/60 border-border/40" />
              </div>

              {/* Live Preview */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                    <Eye size={12} /> Live Preview
                  </label>
                  <div className="flex items-center p-0.5 rounded-full bg-muted/30 border border-border/40">
                    <button
                      onClick={() => setPreviewLang('en')}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${previewLang === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >EN</button>
                    <button
                      onClick={() => setPreviewLang('ar')}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${previewLang === 'ar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                    >AR</button>
                  </div>
                </div>
                <div className={`p-4 rounded-lg bg-muted/20 border border-border/30 min-h-[60px] ${previewLang === 'ar' ? 'text-right font-[Cairo]' : ''}`} dir={previewLang === 'ar' ? 'rtl' : 'ltr'}>
                  <p className="text-sm">{previewLang === 'en' ? editEn : editAr || <span className="text-muted-foreground italic text-xs">No translation</span>}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => {
                  toast({ title: 'Saved', description: `Translation for "${editEntry.key}" updated` });
                  setEditEntry(null);
                }}>
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditEntry(null)}>Cancel</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
