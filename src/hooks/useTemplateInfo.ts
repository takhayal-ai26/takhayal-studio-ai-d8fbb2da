import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GenerationJob } from '@/hooks/useGenerationJobs';

interface TemplateInfo {
  id: string;
  title_en: string;
  title_ar: string;
  category: string;
}

/**
 * Detects template-generated jobs and fetches their template titles.
 * Template jobs have tool_id = "template:{uuid}"
 */
export function isTemplateJob(job: GenerationJob): boolean {
  return !!job.tool_id && job.tool_id.startsWith('template:');
}

export function extractTemplateId(job: GenerationJob): string | null {
  if (!isTemplateJob(job)) return null;
  return job.tool_id!.replace('template:', '');
}

export function useTemplateInfo(jobs: GenerationJob[]) {
  const [templateMap, setTemplateMap] = useState<Map<string, TemplateInfo>>(new Map());

  // Collect unique template IDs from jobs
  const templateIds = useMemo(() => {
    const ids = new Set<string>();
    for (const job of jobs) {
      const tid = extractTemplateId(job);
      if (tid) ids.add(tid);
    }
    return Array.from(ids);
  }, [jobs]);

  useEffect(() => {
    if (templateIds.length === 0) return;

    // Only fetch IDs we don't already have
    const missing = templateIds.filter(id => !templateMap.has(id));
    if (missing.length === 0) return;

    (async () => {
      const { data } = await supabase
        .from('templates')
        .select('id, title_en, title_ar, category')
        .in('id', missing);

      if (data && data.length > 0) {
        setTemplateMap(prev => {
          const next = new Map(prev);
          for (const t of data) {
            next.set(t.id, t);
          }
          return next;
        });
      }
    })();
  }, [templateIds]); // eslint-disable-line react-hooks/exhaustive-deps

  return templateMap;
}

export function getTemplateTitle(
  job: GenerationJob,
  templateMap: Map<string, TemplateInfo>,
  isAr: boolean
): string | null {
  const tid = extractTemplateId(job);
  if (!tid) return null;
  const info = templateMap.get(tid);
  if (!info) return isAr ? 'قالب' : 'Template';
  return isAr && info.title_ar ? info.title_ar : info.title_en;
}
