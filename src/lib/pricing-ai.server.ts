import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const requestSchema = z.object({
  model: z.string().min(1),
  condition: z.string().min(1),
  battery: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  min: z.number().positive(),
  mid: z.number().positive(),
  max: z.number().positive(),
  passportPremium: z.number().nonnegative(),
});

export type PriceExplanationResult = {
  source: "llm" | "deterministic_template";
  summary: string;
  reasons: string[];
  min: number;
  max: number;
};

const fallback = (input: z.infer<typeof requestSchema>): PriceExplanationResult => ({
  source: "deterministic_template",
  summary: "Rentang dihitung dari data pasar sampel dan kondisi paspor.",
  reasons: [
    `Harga referensi untuk ${input.model} disesuaikan dengan kondisi ${input.condition}.`,
    `Baterai ${input.battery}% dan Trust Score ${input.trustScore} ikut memengaruhi rentang.`,
    `Premi paspor yang terhitung adalah Rp${Math.round(input.passportPremium).toLocaleString("id-ID")}.`,
  ],
  min: input.min,
  max: input.max,
});

function serverEnv(name: string): string {
  return typeof process !== "undefined" ? process.env[name] ?? "" : "";
}

export const explainPrice = createServerFn({ method: "POST" })
  .validator(requestSchema)
  .handler(async ({ data }) => {
    const input = requestSchema.parse(data);
    const apiKey = serverEnv("LOVABLE_API_KEY");
    if (!apiKey) return fallback(input);
    try {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.2,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "Jelaskan harga perangkat dalam JSON: summary string, reasons array maksimal 3 string, min number, max number. Jangan mengarang harga dasar." },
            { role: "user", content: JSON.stringify(input) },
          ],
        }),
      });
      if (!response.ok) return fallback(input);
      const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) return fallback(input);
      const parsed = JSON.parse(content) as { summary?: unknown; reasons?: unknown; min?: unknown; max?: unknown };
      const min = Number(parsed.min);
      const max = Number(parsed.max);
      const lowerBound = input.min * 0.85;
      const upperBound = input.max * 1.15;
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min || min < lowerBound || max > upperBound) return fallback(input);
      const reasons = Array.isArray(parsed.reasons) ? parsed.reasons.filter((item): item is string => typeof item === "string").slice(0, 3) : [];
      if (!reasons.length || typeof parsed.summary !== "string") return fallback(input);
      return { source: "llm", summary: parsed.summary, reasons, min: Math.round(min), max: Math.round(max) };
    } catch {
      return fallback(input);
    }
  });
