import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

export interface ToolProvider {
  id: string;
  tool_id: string;
  provider_name: string;
  provider_endpoint: string;
  display_name: string;
  description: string;
  credit_cost: number;
  internal_cost_usd: number;
  is_active: boolean;
  is_default: boolean;
  tier: string;
  sort_order: number;
  created_at: string;
}

export function useToolProviders(toolId?: string) {
  const queryClient = useQueryClient();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['tool-providers', toolId || 'all'],
    queryFn: async () => {
      let query = supabase.from('tool_providers').select('*').order('sort_order', { ascending: true });
      if (toolId) query = query.eq('tool_id', toolId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ToolProvider[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tool-providers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tool_providers' }, () => {
        queryClient.invalidateQueries({ queryKey: ['tool-providers'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const activeProviders = providers.filter(p => p.is_active);
  const defaultProvider = providers.find(p => p.is_default && p.is_active) || activeProviders[0] || null;

  const updateProvider = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ToolProvider> }) => {
      const { error } = await supabase.from('tool_providers').update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-providers'] }),
  });

  const addProvider = useMutation({
    mutationFn: async (provider: Partial<ToolProvider>) => {
      const { error } = await supabase.from('tool_providers').insert(provider as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-providers'] }),
  });

  const deleteProvider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tool_providers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-providers'] }),
  });

  const setDefault = useMutation({
    mutationFn: async ({ providerId, toolId: tId }: { providerId: string; toolId: string }) => {
      // Unset all defaults for this tool
      await supabase.from('tool_providers').update({ is_default: false } as any).eq('tool_id', tId);
      // Set the new default
      const { error } = await supabase.from('tool_providers').update({ is_default: true } as any).eq('id', providerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-providers'] }),
  });

  return { providers, activeProviders, defaultProvider, isLoading, updateProvider, addProvider, deleteProvider, setDefault };
}
