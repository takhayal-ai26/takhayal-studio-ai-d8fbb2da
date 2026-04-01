import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export type ToolRunStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';

interface ToolRunResult {
  success: boolean;
  output_url: string | null;
  output_images: Array<{ url: string }>;
  credits_charged: number;
  run_id: string;
}

export function useToolRunner() {
  const [status, setStatus] = useState<ToolRunStatus>('idle');
  const [result, setResult] = useState<ToolRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('You must be logged in to upload files');
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('tool-files').upload(path, file);
    if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
    const { data: urlData } = supabase.storage.from('tool-files').getPublicUrl(path);
    return urlData.publicUrl;
  }, []);

  const runTool = useCallback(async (params: {
    toolSlug: string;
    prompt?: string;
    imageFile?: File;
    imageUrl?: string;
    options?: Record<string, any>;
  }) => {
    setStatus('idle');
    setResult(null);
    setError(null);

    try {
      let inputImageUrl = params.imageUrl || null;

      // Upload image if file provided
      if (params.imageFile) {
        setStatus('uploading');
        inputImageUrl = await uploadImage(params.imageFile);
      }

      setStatus('processing');

      const { data, error: fnError } = await supabase.functions.invoke('run-tool', {
        body: {
          tool_slug: params.toolSlug,
          prompt: params.prompt || null,
          image_url: inputImageUrl,
          options: params.options || {},
        },
      });

      if (fnError) throw new Error(fnError.message || 'Tool execution failed');
      if (data?.error) throw new Error(data.error);

      const runResult: ToolRunResult = {
        success: true,
        output_url: data.output_url,
        output_images: data.output_images || [],
        credits_charged: data.credits_charged || 0,
        run_id: data.run_id,
      };

      setResult(runResult);
      setStatus('completed');
      return runResult;

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatus('failed');
      toast({ title: 'Tool Error', description: msg, variant: 'destructive' });
      return null;
    }
  }, [uploadImage]);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, runTool, reset, uploadImage };
}
