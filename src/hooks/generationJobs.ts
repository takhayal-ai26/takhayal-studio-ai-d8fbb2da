import type { GenerationJob, JobStatus } from "./useGenerationJobs";

export const IN_PROGRESS_STATUSES: JobStatus[] = ["queued", "generating", "processing"];
export const GENERATION_JOB_COLUMNS = "id, status, prompt, image_url, error_message, ratio, resolution, quality_tier, model_id, credits_used, created_at, tool_id, media_type, video_url, thumbnail_url, duration, source_mode, used_image_input, input_image_urls";

export type SupabaseFunctionError = {
  name?: string;
  message?: string;
  context?: Response | unknown;
};

export type GenerationLogRow = Partial<GenerationJob> & {
  status?: string | null;
  credits_used?: number | null;
  input_image_urls?: unknown;
};

type GenerationLogsClient = {
  from: (table: string) => any;
};

export function normalizeStatus(status: string | null | undefined): JobStatus {
  if (status === "queued" || status === "generating" || status === "processing" || status === "failed") {
    return status;
  }

  return "completed";
}

export function mapGenerationLogToJob(row: GenerationLogRow): GenerationJob {
  return {
    id: String(row.id),
    status: normalizeStatus(row.status),
    prompt: row.prompt || "",
    image_url: row.image_url ?? null,
    error_message: row.error_message ?? null,
    ratio: row.ratio ?? null,
    resolution: row.resolution || row.quality_tier || null,
    quality_tier: row.quality_tier ?? null,
    model_id: row.model_id ?? null,
    credits_used: row.credits_used || 0,
    created_at: row.created_at || new Date().toISOString(),
    tool_id: row.tool_id || null,
    media_type: row.media_type,
    video_url: row.video_url ?? null,
    thumbnail_url: row.thumbnail_url ?? null,
    duration: row.duration ?? null,
    source_mode: row.source_mode ?? null,
    used_image_input: row.used_image_input,
    input_image_urls: Array.isArray(row.input_image_urls) ? row.input_image_urls as string[] : [],
  };
}

type OptimisticJobParams = {
  id: string;
  prompt: string;
  ratio: string;
  qualityTier: string;
  modelId: string | null;
  creditCost: number;
  createdAt?: string;
} & (
  | {
      kind: "image";
      sourceTag?: string;
    }
  | {
      kind: "video";
      duration: string;
      sourceMode: string;
      inputImageUrls?: string[];
    }
);

export function buildOptimisticJob(params: OptimisticJobParams): GenerationJob {
  const baseJob: GenerationJob = {
    id: params.id,
    status: "queued",
    prompt: params.prompt,
    image_url: null,
    error_message: null,
    ratio: params.ratio,
    resolution: params.qualityTier,
    quality_tier: params.qualityTier,
    model_id: params.modelId,
    credits_used: params.creditCost,
    created_at: params.createdAt || new Date().toISOString(),
    tool_id: params.kind === "image" ? params.sourceTag || null : null,
    media_type: params.kind,
    input_image_urls: [],
  };

  if (params.kind === "video") {
    return {
      ...baseJob,
      video_url: null,
      thumbnail_url: null,
      duration: params.duration,
      source_mode: params.sourceMode,
      input_image_urls: params.inputImageUrls || [],
    };
  }

  return baseJob;
}

export async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== "object") {
    return "Unknown generation error";
  }

  const fnError = error as SupabaseFunctionError;
  const response = fnError.context;
  if (fnError.name === "FunctionsHttpError" && response instanceof Response) {
    const status = response.status;
    const body = await response.clone().json().catch(async () => {
      const text = await response.clone().text().catch(() => "");
      return text ? { error: text } : null;
    });

    const bodyMessage = typeof body?.error === "string"
      ? body.error
      : typeof body?.message === "string"
        ? body.message
        : null;

    return bodyMessage ? `${bodyMessage} (${status})` : `${fnError.message || "Edge Function failed"} (${status})`;
  }

  return "message" in error && typeof fnError.message === "string"
    ? fnError.message
    : "Unknown generation error";
}

export async function fetchGenerationJobs(
  supabaseClient: GenerationLogsClient,
  userId: string,
): Promise<{ jobs: GenerationJob[] | null; error: unknown | null }> {
  const { data, error } = await supabaseClient
    .from("generation_logs")
    .select(GENERATION_JOB_COLUMNS)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return { jobs: null, error };
  }

  return { jobs: (data || []).map((row: GenerationLogRow) => mapGenerationLogToJob(row)), error: null };
}

export async function createGenerationLog(
  supabaseClient: GenerationLogsClient,
  params: {
    userId: string;
    prompt: string;
    ratio: string;
    qualityTier: string;
    modelId: string | null;
    creditCost: number;
    sourceTag?: string;
  },
): Promise<{ id: string | null; modelId: string | null; error: unknown | null }> {
  const baseInsert = {
    user_id: params.userId,
    status: "queued" as string,
    prompt: params.prompt.slice(0, 500),
    ratio: params.ratio,
    resolution: params.qualityTier,
    requested_ratio: params.ratio,
    quality_tier: params.qualityTier,
    requested_quality_tier: params.qualityTier,
    credits_used: params.creditCost,
    tool_id: params.sourceTag || null,
  };

  let insertedModelId = params.modelId || null;

  let { data, error } = await supabaseClient
    .from("generation_logs")
    .insert({
      ...baseInsert,
      model_id: insertedModelId,
    })
    .select("id")
    .single();

  if ((error || !data) && error?.code === "23503" && params.modelId) {
    insertedModelId = null;

    const retryResult = await supabaseClient
      .from("generation_logs")
      .insert({
        ...baseInsert,
        model_id: null,
      })
      .select("id")
      .single();

    data = retryResult.data;
    error = retryResult.error;
  }

  return {
    id: data?.id || null,
    modelId: insertedModelId,
    error: error || null,
  };
}

export async function markGenerationJobFailed(
  supabaseClient: GenerationLogsClient,
  jobId: string,
  errorMessage?: string | null,
): Promise<unknown | null> {
  const { error } = await supabaseClient
    .from("generation_logs")
    .update({ status: "failed" as string, error_message: errorMessage ?? null })
    .eq("id", jobId);

  return error || null;
}
