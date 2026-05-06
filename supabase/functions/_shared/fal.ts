export type FalHeaders = Record<string, string>;
export type FalPayload = Record<string, unknown>;

export interface FalQueueSubmit {
  status_url?: string;
  response_url?: string;
  request_id?: string;
  [key: string]: unknown;
}

export interface FalQueueResult {
  data: unknown;
  error?: string;
}

interface FalQueueOptions {
  fetchFn?: typeof fetch;
  wait?: (ms: number) => Promise<unknown>;
  maxAttempts?: number;
  intervalMs?: number;
  label?: string;
  logEvery?: number;
  failureMessagePrefix?: string;
  timeoutMessage?: string;
}

const waitFor = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function readErrorText(response: Response) {
  try {
    return await response.text();
  } catch {
    return "Unable to read error response";
  }
}

export async function submitFalQueue(
  endpoint: string,
  payload: FalPayload,
  falHeaders: FalHeaders,
  options: Pick<FalQueueOptions, "fetchFn"> = {},
): Promise<{ submit?: FalQueueSubmit; error?: string }> {
  const fetchFn = options.fetchFn ?? fetch;
  const submitRes = await fetchFn(`https://queue.fal.run/${endpoint}`, {
    method: "POST",
    headers: falHeaders,
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errorText = await readErrorText(submitRes);
    console.error(`fal.ai submit error for ${endpoint}:`, submitRes.status, errorText);
    return { error: `fal.ai API error ${submitRes.status}: ${errorText}` };
  }

  return { submit: await submitRes.json() };
}

export async function pollFalQueueUntilDone(
  submit: FalQueueSubmit,
  falHeaders: FalHeaders,
  options: FalQueueOptions = {},
): Promise<FalQueueResult> {
  const { status_url, response_url } = submit || {};
  if (!status_url || !response_url) return { data: submit };

  const fetchFn = options.fetchFn ?? fetch;
  const wait = options.wait ?? waitFor;
  const maxAttempts = options.maxAttempts ?? 180;
  const intervalMs = options.intervalMs ?? 3000;
  const label = options.label || "poll";
  const logEvery = options.logEvery ?? 5;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (intervalMs > 0) {
      await wait(intervalMs);
    }

    const statusRes = await fetchFn(status_url, { headers: falHeaders });
    const statusData = await statusRes.json();
    if (logEvery > 0 && attempt % logEvery === 0) {
      console.log(`[${label}] Poll ${attempt + 1}: ${statusData.status}`);
    }

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetchFn(response_url, { headers: falHeaders });
      return { data: await resultRes.json() };
    }

    if (statusData.status === "FAILED") {
      const prefix = options.failureMessagePrefix ?? "Generation failed";
      return { data: null, error: `${prefix}: ${JSON.stringify(statusData)}` };
    }
  }

  return { data: null, error: options.timeoutMessage ?? `Generation timed out after ${(maxAttempts * intervalMs) / 1000}s` };
}

export async function runFalQueue(
  endpoint: string,
  payload: FalPayload,
  falHeaders: FalHeaders,
  options: FalQueueOptions = {},
): Promise<FalQueueResult> {
  const submitResult = await submitFalQueue(endpoint, payload, falHeaders, options);
  if (submitResult.error) return { data: null, error: submitResult.error };
  return pollFalQueueUntilDone(submitResult.submit || {}, falHeaders, {
    maxAttempts: options.maxAttempts ?? 60,
    intervalMs: options.intervalMs ?? 2000,
    label: options.label ?? endpoint,
    fetchFn: options.fetchFn,
    wait: options.wait,
    logEvery: options.logEvery,
    failureMessagePrefix: options.failureMessagePrefix,
    timeoutMessage: options.timeoutMessage,
  });
}

export async function submitFalQueueWebhook(
  endpoint: string,
  payload: FalPayload,
  falHeaders: FalHeaders,
  webhookUrl: string,
  options: Pick<FalQueueOptions, "fetchFn"> = {},
): Promise<FalQueueResult> {
  const fetchFn = options.fetchFn ?? fetch;
  const submitRes = await fetchFn(`https://queue.fal.run/${endpoint}?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: falHeaders,
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errorText = await readErrorText(submitRes);
    console.error(`fal.ai queue submit error for ${endpoint}:`, submitRes.status, errorText);
    return { data: null, error: `fal.ai API error ${submitRes.status}: ${errorText}` };
  }

  return { data: await submitRes.json() };
}

export function getFalImageResultUrl(resultData: unknown): string | null {
  const result = resultData as {
    images?: Array<{ url?: string }>;
    image?: { url?: string };
    output?: string | { url?: string } | Array<string | { url?: string }>;
  } | null | undefined;

  return result?.images?.[0]?.url
    || result?.image?.url
    || (typeof result?.output === "object" && !Array.isArray(result.output) ? result.output?.url : null)
    || (typeof result?.output === "string" ? result.output : null)
    || (Array.isArray(result?.output)
      ? (typeof result.output[0] === "string" ? result.output[0] : result.output[0]?.url || null)
      : null)
    || null;
}
