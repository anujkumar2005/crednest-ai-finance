import { supabase } from "@/integrations/supabase/client";

export type SupabaseResponse<T> = { data: T | null; error: any };

// PostgREST error when a request includes an expired access token.
export function isJwtExpiredError(err: any) {
  const code = err?.code ?? err?.error?.code;
  const message = String(err?.message ?? err?.error?.message ?? "");
  return code === "PGRST303" || /jwt\s+expired/i.test(message);
}

/**
 * Retries a Supabase PostgREST request once if the session JWT is expired.
 * Works with Supabase query builders (PromiseLike), not just Promises.
 */
export async function retryOnJwtExpired<T>(
  request: () => PromiseLike<SupabaseResponse<T>>
): Promise<SupabaseResponse<T>> {
  const first = await request();

  if (!first.error || !isJwtExpiredError(first.error)) {
    return first;
  }

  const { error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError) {
    return first;
  }

  return await request();
}
