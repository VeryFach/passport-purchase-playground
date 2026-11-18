// Typed, browser-safe Supabase configuration.
// Only VITE_* variables are exposed to the client bundle by Vite.
// Never put a service_role / secret key here.

export type SupabaseBrowserEnv = {
  url: string;
  publishableKey: string;
  configured: boolean;
};

export function readSupabaseBrowserEnv(): SupabaseBrowserEnv {
  const url = import.meta.env["VITE_SUPABASE_URL"];
  const publishableKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  return {
    url: url ?? "",
    publishableKey: publishableKey ?? "",
    configured: Boolean(url && publishableKey),
  };
}

export function requireSupabaseBrowserEnv(): { url: string; publishableKey: string } {
  const env = readSupabaseBrowserEnv();
  if (!env.configured) {
    throw new Error(
      "Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }
  return { url: env.url, publishableKey: env.publishableKey };
}

// Demo shortcuts are optional. They only perform a normal email/password login,
// so they can never grant the restricted mitra role on their own.
export type DemoAccountConfig = {
  email: string;
  password: string;
  label: string;
};

export function readDemoAccounts(): DemoAccountConfig[] {
  const accounts: DemoAccountConfig[] = [
    {
      label: "Penjual",
      email: import.meta.env["VITE_DEMO_SELLER_EMAIL"] ?? "",
      password: import.meta.env["VITE_DEMO_SELLER_PASSWORD"] ?? "",
    },
    {
      label: "Pembeli",
      email: import.meta.env["VITE_DEMO_BUYER_EMAIL"] ?? "",
      password: import.meta.env["VITE_DEMO_BUYER_PASSWORD"] ?? "",
    },
    {
      label: "Mitra",
      email: import.meta.env["VITE_DEMO_MITRA_EMAIL"] ?? "",
      password: import.meta.env["VITE_DEMO_MITRA_PASSWORD"] ?? "",
    },
  ];
  return accounts.filter((account) => account.email && account.password);
}
