import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Mail, MessageSquare, RefreshCw, Search, User, CheckCircle2, Clock, Archive } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type ContactMessage = Database['public']['Tables']['contact_messages']['Row'];
type MessageStatus = 'new' | 'in_progress' | 'resolved' | 'archived';
type StatusFilter = MessageStatus | 'all';

const STATUS_LABELS: Record<MessageStatus, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved',
  archived: 'Archived',
};

const STATUS_STYLES: Record<MessageStatus, string> = {
  new: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  in_progress: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
  resolved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
  archived: 'border-border/40 bg-muted/30 text-muted-foreground',
};

const FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'archived', label: 'Archived' },
];

function normalizeStatus(status: string): MessageStatus {
  return ['new', 'in_progress', 'resolved', 'archived'].includes(status) ? (status as MessageStatus) : 'new';
}

function relativeDate(value: string) {
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

function buildGmailReplyUrl(message: ContactMessage) {
  const subject = `Re: Takhayal support`;
  const body = [
    `Hi ${message.first_name},`,
    '',
    '',
    'Best,',
    'Takhayal Support',
  ].join('\n');
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: message.email,
    su: subject,
    body,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

export default function AdminSupport() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const selectedMessage = messages.find((message) => message.id === selectedId) || messages[0] || null;

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      toast({
        title: 'Could not load support messages',
        description: error.message,
        variant: 'destructive',
      });
      setMessages([]);
    } else {
      const nextMessages = data || [];
      setMessages(nextMessages);
      setSelectedId((current) => {
        if (current && nextMessages.some((message) => message.id === current)) return current;
        return nextMessages[0]?.id || null;
      });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const counts = useMemo(() => {
    return messages.reduce(
      (acc, message) => {
        const status = normalizeStatus(message.status);
        acc.all += 1;
        acc[status] += 1;
        return acc;
      },
      { all: 0, new: 0, in_progress: 0, resolved: 0, archived: 0 } as Record<StatusFilter, number>,
    );
  }, [messages]);

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return messages.filter((message) => {
      const status = normalizeStatus(message.status);
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (!query) return true;
      return [message.first_name, message.email, message.message, message.language]
        .some((value) => value?.toLowerCase().includes(query));
    });
  }, [messages, search, statusFilter]);

  const updateStatus = async (message: ContactMessage, status: MessageStatus) => {
    setUpdatingId(message.id);
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', message.id);

    if (error) {
      toast({ title: 'Status update failed', description: error.message, variant: 'destructive' });
    } else {
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, status } : item)));
      toast({ title: 'Support message updated' });
    }
    setUpdatingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="typo-heading-page">Support Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review contact-form submissions and track follow-up status.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMessages} disabled={loading} className="w-fit gap-2">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'New', value: counts.new, icon: MessageSquare },
          { label: 'In progress', value: counts.in_progress, icon: Clock },
          { label: 'Resolved', value: counts.resolved, icon: CheckCircle2 },
          { label: 'Archived', value: counts.archived, icon: Archive },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-border/40 bg-card/60">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={17} />
              </div>
              <div>
                <p className="text-xl font-semibold leading-none">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <CardTitle className="text-sm font-semibold">Messages</CardTitle>
              <div className="relative w-full lg:max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, or message..."
                  className="h-9 bg-muted/30 pl-9 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {FILTERS.map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setStatusFilter(filter.key)}
                  className={cn(
                    'min-h-9 shrink-0 rounded-full px-3 text-[12px] font-medium transition-colors',
                    statusFilter === filter.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                >
                  {filter.label} {counts[filter.key] > 0 ? counts[filter.key] : ''}
                </button>
              ))}
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Sender</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Message</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Status</TableHead>
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Received</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-sm text-muted-foreground">
                      Loading support messages...
                    </TableCell>
                  </TableRow>
                ) : filteredMessages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-sm text-muted-foreground">
                      No support messages match this view.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMessages.map((message) => {
                    const status = normalizeStatus(message.status);
                    const active = selectedMessage?.id === message.id;
                    return (
                      <TableRow
                        key={message.id}
                        className={cn('cursor-pointer border-border/20 hover:bg-muted/20', active && 'bg-primary/5')}
                        onClick={() => setSelectedId(message.id)}
                      >
                        <TableCell className="min-w-[220px]">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {message.first_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-foreground">{message.first_name}</p>
                              <p className="truncate text-[12px] text-muted-foreground">{message.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[360px]">
                          <p className="line-clamp-2 text-[12px] leading-5 text-muted-foreground">{message.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[status])}>
                            {STATUS_LABELS[status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-[12px] text-muted-foreground">
                          {relativeDate(message.created_at)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="border-border/40 bg-card/60">
          {selectedMessage ? (
            <>
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-semibold">{selectedMessage.first_name}</CardTitle>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Mail size={13} />
                      {selectedMessage.email}
                    </a>
                  </div>
                  <Badge variant="outline" className={cn('text-[10px]', STATUS_STYLES[normalizeStatus(selectedMessage.status)])}>
                    {STATUS_LABELS[normalizeStatus(selectedMessage.status)]}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-muted-foreground">Language</p>
                    <p className="mt-1 font-medium uppercase text-foreground">{selectedMessage.language || 'en'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-muted-foreground">Received</p>
                    <p className="mt-1 font-medium text-foreground">{relativeDate(selectedMessage.created_at)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-xl border border-border/40 bg-background/60 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <User size={13} />
                    Message
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{selectedMessage.message}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="support-message-status">
                    Follow-up status
                  </label>
                  <Select
                    value={normalizeStatus(selectedMessage.status)}
                    onValueChange={(value) => updateStatus(selectedMessage, value as MessageStatus)}
                    disabled={updatingId === selectedMessage.id}
                  >
                    <SelectTrigger id="support-message-status" className="h-10 bg-muted/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button asChild className="w-full gap-2">
                  <a href={buildGmailReplyUrl(selectedMessage)} target="_blank" rel="noreferrer">
                    <Mail size={14} />
                    Reply by email
                  </a>
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex min-h-[360px] flex-col items-center justify-center text-center">
              <MessageSquare size={28} className="mb-3 text-muted-foreground/30" />
              <p className="text-sm font-medium text-foreground">No message selected</p>
              <p className="mt-1 text-xs text-muted-foreground">New contact-form submissions will appear here.</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
