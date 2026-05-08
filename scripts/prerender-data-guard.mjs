export function requirePrerenderRows(result, routeLabel) {
  if (result.status === "fulfilled") return result.value;

  const reason = result.reason instanceof Error
    ? result.reason.message
    : String(result.reason || "Unknown error");

  throw new Error(`Unable to prerender ${routeLabel} routes: ${reason}`);
}
