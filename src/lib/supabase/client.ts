import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requireSupabaseBrowserEnv } from "./env";

let browserClient: SupabaseClient | undefined;

/**
 * Single browser Supabase client for the whole app.
 * Safe to call from effects and event handlers. Do not call during SSR.
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, publishableKey } = requireSupabaseBrowserEnv();
    browserClient = createBrowserClient(url, publishableKey);
  }
  return browserClient;
}

export function getSupabaseBrowserClient(): SupabaseClient {
  return createClient();
}
