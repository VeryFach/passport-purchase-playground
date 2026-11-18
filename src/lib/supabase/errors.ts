export type SupabaseErrorLike = {
  message?: string;
  details?: string | null;
  hint?: string | null;
  code?: string;
};

const FRIENDLY: Record<string, string> = {
  "23505": "Data sudah ada. Periksa kembali nomor serial / IMEI.",
  "23503": "Data terkait tidak ditemukan.",
  "42501": "Anda tidak memiliki izin untuk tindakan ini.",
  "PGRST116": "Data tidak ditemukan.",
  "PGRST202": "Fungsi database belum tersedia. Jalankan migrasi terbaru.",
  "42P01": "Tabel database belum tersedia. Jalankan migrasi terbaru.",
};

export function errorMessage(error: unknown, fallback = "Terjadi kesalahan."): string {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  const candidate = error as SupabaseErrorLike;
  if (candidate.code && FRIENDLY[candidate.code]) return FRIENDLY[candidate.code];
  if (candidate.message) return candidate.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function isMissingSchemaError(error: unknown): boolean {
  const candidate = error as SupabaseErrorLike | null;
  return Boolean(
    candidate &&
      (candidate.code === "42P01" ||
        candidate.code === "PGRST202" ||
        candidate.code === "42883" ||
        /does not exist|not found/i.test(candidate.message ?? "")),
  );
}

export class AppError extends Error {
  readonly code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}
