import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Star, Eye, EyeOff, Flag, Shield, Clock } from 'lucide-react';

const submissions = [
  { id: '1', creator: 'Ahmed K.', prompt: 'Cinematic desert scene at sunset', tool: 'Generate', date: '2h ago', status: 'pending', likes: 0 },
  { id: '2', creator: 'Sara M.', prompt: 'Luxury watch product shot', tool: 'Generate', date: '3h ago', status: 'pending', likes: 0 },
  { id: '3', creator: 'Omar H.', prompt: 'Modern Arabic calligraphy art', tool: 'Generate', date: '5h ago', status: 'pending', likes: 0 },
  { id: '4', creator: 'Layla I.', prompt: 'Fashion portrait, editorial lighting', tool: 'Generate', date: '8h ago', status: 'approved', likes: 24 },
  { id: '5', creator: 'Karim S.', prompt: 'Restaurant interior, warm tones', tool: 'Generate', date: '12h ago', status: 'approved', likes: 18 },
  { id: '6', creator: 'Noor A.', prompt: 'Inappropriate content attempt', tool: 'Generate', date: '1d ago', status: 'rejected', likes: 0 },
];

const statusStyle: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
  featured: 'bg-primary/10 text-primary border-primary/20',
  reported: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function AdminCommunity() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="typo-heading-page">Community Moderation</h1>
          <p className="text-sm text-muted-foreground mt-1">Review submissions, moderate content, and manage community</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Pending Review', value: '3', icon: Clock },
          { label: 'Approved', value: '1,842', icon: CheckCircle },
          { label: 'Featured', value: '24', icon: Star },
          { label: 'Reported', value: '7', icon: Flag },
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

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-muted/30">
          <TabsTrigger value="pending" className="text-xs">Pending (3)</TabsTrigger>
          <TabsTrigger value="approved" className="text-xs">Approved</TabsTrigger>
          <TabsTrigger value="featured" className="text-xs">Featured</TabsTrigger>
          <TabsTrigger value="reported" className="text-xs">Reported</TabsTrigger>
          <TabsTrigger value="rejected" className="text-xs">Rejected</TabsTrigger>
        </TabsList>

        {['pending', 'approved', 'featured', 'reported', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card className="border-border/40 bg-card/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/40">
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Creator</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Prompt</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Tool</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Submitted</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Likes</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions
                    .filter(s => tab === 'pending' ? s.status === 'pending' : tab === 'approved' ? s.status === 'approved' : tab === 'rejected' ? s.status === 'rejected' : true)
                    .map(s => (
                    <TableRow key={s.id} className="border-border/20 hover:bg-muted/20">
                      <TableCell className="text-[13px] font-medium">{s.creator}</TableCell>
                      <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate">{s.prompt}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.tool}</Badge></TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">{s.date}</TableCell>
                      <TableCell><Badge variant="outline" className={`text-[10px] capitalize ${statusStyle[s.status]}`}>{s.status}</Badge></TableCell>
                      <TableCell className="text-[13px]">{s.likes}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400 hover:text-emerald-300"><CheckCircle size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive/80"><XCircle size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:text-primary/80"><Star size={14} /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground"><EyeOff size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
