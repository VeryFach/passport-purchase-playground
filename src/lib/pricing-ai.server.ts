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
  const runtimeValue = typeof process !== "undefined" ? process.env[name] ?? "" : "";
  return runtimeValue || import.meta.env[name] || "";
}

export const explainPrice = createServerFn({ method: "POST" })
  .validator(requestSchema)
  .handler(async ({ data }) => {
    const input = requestSchema.parse(data);
    const apiKey = serverEnv("GEMINI_API_KEY");
    console.info("[paspor] Gemini pricing explanation requested", { configured: Boolean(apiKey) });
    if (!apiKey) {
      console.warn("[paspor] GEMINI_API_KEY is not available to the server runtime");
      return fallback(input);
    }
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: "Jelaskan harga perangkat dalam JSON: summary string, reasons array maksimal 3 string, min number, max number. Jangan mengarang harga dasar." }],
          },
          contents: [{ role: "user", parts: [{ text: JSON.stringify(input) }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        }),
        },
      );
      if (!response.ok) {
        console.warn("[paspor] Gemini request failed", response.status, response.statusText);
        return fallback(input);
      }
      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        console.warn("[paspor] Gemini returned no text candidate");
        return fallback(input);
      }
      const parsed = JSON.parse(content) as { summary?: unknown; reasons?: unknown; min?: unknown; max?: unknown };
      const min = Number(parsed.min);
      const max = Number(parsed.max);
      const lowerBound = input.min * 0.85;
      const upperBound = input.max * 1.15;
      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min || min < lowerBound || max > upperBound) {
        console.warn("[paspor] Gemini response failed pricing guardrail");
        return fallback(input);
      }
      const reasons = Array.isArray(parsed.reasons) ? parsed.reasons.filter((item): item is string => typeof item === "string").slice(0, 3) : [];
      if (!reasons.length || typeof parsed.summary !== "string") {
        console.warn("[paspor] Gemini response did not match explanation schema");
        return fallback(input);
      }
      return { source: "llm", summary: parsed.summary, reasons, min: Math.round(min), max: Math.round(max) };
    } catch (error) {
      console.warn("[paspor] Gemini explanation exception", error instanceof Error ? error.message : error);
      return fallback(input);
    }
  });
