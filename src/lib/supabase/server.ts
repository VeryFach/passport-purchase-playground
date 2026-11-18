import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { deleteCookie, getCookies, setCookie } from "@tanstack/react-start/server";

import { requireSupabaseBrowserEnv } from "./env";

function readServerEnv() {
  const runtimeEnv =
    typeof process !== "undefined" && process.env ? process.env : ({} as Record<string, string>);
  // Server-side fallbacks keep the same values available outside the Vite client bundle.
  const url =
    runtimeEnv["SUPABASE_URL"] ??
    runtimeEnv["VITE_SUPABASE_URL"] ??
    import.meta.env["VITE_SUPABASE_URL"];
  const publishableKey =
    runtimeEnv["SUPABASE_PUBLISHABLE_KEY"] ??
    runtimeEnv["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
    import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !publishableKey) {
    return requireSupabaseBrowserEnv();
  }
  return { url, publishableKey };
}

/**
 * Supabase client for server functions and loaders.
 * Sessions are carried in cookies so SSR and the browser share auth state.
 */
export function createServerSupabaseClient(): SupabaseClient {
  const { url, publishableKey } = readServerEnv();
  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          const serialized = options as Record<string, unknown> | undefined;
          if (!value && serialized?.["maxAge"] === 0) {
            deleteCookie(name);
            continue;
          }
          setCookie(name, value, options as Parameters<typeof setCookie>[2]);
        }
      },
    },
  });
}
