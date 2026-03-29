import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Shield, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Policy {
  id: string;
  type: string;
  content_en: string;
  content_ar: string;
  last_updated: string;
}

const POLICY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  terms: { label: 'Terms & Conditions', icon: <FileText size={16} /> },
  privacy: { label: 'Privacy Policy', icon: <Shield size={16} /> },
  refund: { label: 'Refund Policy', icon: <RefreshCw size={16} /> },
};

function PolicyEditor({ policy, onSaved }: { policy: Policy; onSaved: () => void }) {
  const [en, setEn] = useState(policy.content_en);
  const [ar, setAr] = useState(policy.content_ar);
  const [saving, setSaving] = useState(false);
  const [langTab, setLangTab] = useState('en');

  useEffect(() => {
    setEn(policy.content_en);
    setAr(policy.content_ar);
  }, [policy]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('legal_policies')
      .update({ content_en: en, content_ar: ar, last_updated: new Date().toISOString() })
      .eq('id', policy.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: `${POLICY_META[policy.type]?.label} updated successfully.` });
      onSaved();
    }
  };

  const meta = POLICY_META[policy.type];
  const lastUp = new Date(policy.last_updated).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Card className="border-border/40 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">{meta?.icon}</div>
            <CardTitle className="text-base">{meta?.label}</CardTitle>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              Updated: {lastUp}
            </Badge>
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs">
              <Save size={13} />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={langTab} onValueChange={setLangTab}>
          <TabsList className="bg-muted/30 mb-3">
            <TabsTrigger value="en" className="text-xs">English</TabsTrigger>
            <TabsTrigger value="ar" className="text-xs">العربية</TabsTrigger>
          </TabsList>
          <TabsContent value="en">
            <Textarea
              value={en}
              onChange={e => setEn(e.target.value)}
              className="min-h-[280px] text-[13px] font-mono leading-relaxed bg-background"
              placeholder="HTML content for English..."
            />
            <p className="text-[10px] text-muted-foreground mt-2">Supports HTML: &lt;h1&gt;, &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, &lt;a&gt;</p>
          </TabsContent>
          <TabsContent value="ar">
            <Textarea
              value={ar}
              onChange={e => setAr(e.target.value)}
              className="min-h-[280px] text-[13px] font-mono leading-relaxed bg-background"
              dir="rtl"
              placeholder="محتوى HTML بالعربية..."
            />
            <p className="text-[10px] text-muted-foreground mt-2">If empty, English content will be used as fallback.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function AdminLegalPolicies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data } = await supabase.from('legal_policies').select('*').order('type');
    if (data) setPolicies(data);
    setLoading(false);
  };

  useEffect(() => { fetchPolicies(); }, []);

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading policies...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Legal & Policies</h2>
        <p className="text-[12px] text-muted-foreground mt-0.5">
          Edit legal pages displayed at /terms, /privacy, and /refund. Content supports HTML formatting.
        </p>
      </div>
      {['terms', 'privacy', 'refund'].map(type => {
        const p = policies.find(pol => pol.type === type);
        if (!p) return null;
        return <PolicyEditor key={p.id} policy={p} onSaved={fetchPolicies} />;
      })}
    </div>
  );
}
