export interface GenerationJobRow {
  id: string;
  user_id: string | null;
  status: string | null;
  credits_charged_at?: string | null;
}

export interface DeductCreditsResult {
  success?: boolean;
  error?: string;
}

type QueryResult<T> = Promise<{ data: T | null; error?: unknown }>;

export interface SupabaseLike {
  from: (table: string) => {
    select?: (columns: string) => {
      eq: (column: string, value: unknown) => {
        single: () => QueryResult<unknown>;
      };
    };
    update?: (payload: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => Promise<{ error?: unknown }>;
    };
  };
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data?: unknown; error?: unknown }>;
}

export class GenerationJobError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GenerationJobError";
    this.status = status;
  }
}

export async function loadGenerationJob(supabase: SupabaseLike, jobId: string): Promise<GenerationJobRow | null> {
  const table = supabase.from("generation_logs");
  const query = table.select?.("id, user_id, status, credits_charged_at");
  if (!query) return null;

  const { data, error } = await query.eq("id", jobId).single();

  if (error || !data) return null;
  return data as GenerationJobRow;
}

export function assertUsableGenerationJob(job: GenerationJobRow | null, userId: string): asserts job is GenerationJobRow {
  if (!job) {
    throw new GenerationJobError("Generation job not found", 404);
  }
  if (job.user_id !== userId) {
    throw new GenerationJobError("Forbidden", 403);
  }
  if (job.status === "completed") {
    throw new GenerationJobError("Generation job already completed", 409);
  }
}

export async function deductCredits(
  supabase: Pick<SupabaseLike, "rpc">,
  params: {
    userId: string;
    amount: number;
    modelId?: string | null;
    resolution?: string | null;
    toolId?: string | null;
  },
): Promise<DeductCreditsResult | null> {
  const { data } = await supabase.rpc("deduct_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_model_id: params.modelId ?? null,
    p_resolution: params.resolution ?? null,
    p_tool_id: params.toolId ?? null,
  });

  return data as DeductCreditsResult | null;
}

export function makeCreditRefunder() {
  let chargedUserId: string | null = null;
  let chargedCredits = 0;

  return {
    trackCharge(userId: string, credits: number) {
      chargedUserId = userId;
      chargedCredits = credits;
    },
    clear() {
      chargedUserId = null;
      chargedCredits = 0;
    },
    async refund(supabase: Pick<SupabaseLike, "rpc">) {
      if (!chargedUserId || chargedCredits <= 0) return;
      const userId = chargedUserId;
      const credits = chargedCredits;
      chargedUserId = null;
      chargedCredits = 0;
      await supabase.rpc("refund_credits", { p_user_id: userId, p_amount: credits });
    },
  };
}

export async function markJobGenerating(
  supabase: SupabaseLike,
  jobId: string | null | undefined,
  updates: Record<string, unknown> = {},
) {
  if (!jobId) return;
  const table = supabase.from("generation_logs");
  if (!table.update) return;
  await table.update({ status: "generating", ...updates }).eq("id", jobId);
}

export async function markJobFailed(
  supabase: SupabaseLike,
  jobId: string | null | undefined,
  errorMessage?: string | null,
  updates: Record<string, unknown> = {},
) {
  if (!jobId) return;
  const table = supabase.from("generation_logs");
  if (!table.update) return;
  await table.update({
    status: "failed",
    ...(errorMessage !== undefined ? { error_message: errorMessage } : {}),
    ...updates,
  }).eq("id", jobId);
}

export async function markJobCompleted(
  supabase: SupabaseLike,
  jobId: string | null | undefined,
  updates: Record<string, unknown> = {},
) {
  if (!jobId) return;
  const table = supabase.from("generation_logs");
  if (!table.update) return;
  await table.update({ status: "completed", ...updates }).eq("id", jobId);
}
