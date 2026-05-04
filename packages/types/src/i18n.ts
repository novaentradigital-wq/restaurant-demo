import { z } from "zod";

export const LanguageCodeSchema = z.enum(["TR", "EN"]);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

/** Çok dilli alan: { TR: "...", EN: "..." } */
export const LocalizedTextSchema = z.record(LanguageCodeSchema, z.string());
export type LocalizedText = z.infer<typeof LocalizedTextSchema>;

export function pickLocale(
  text: LocalizedText | null | undefined,
  lang: LanguageCode,
  fallback: LanguageCode = "TR"
): string {
  if (!text) return "";
  return text[lang] ?? text[fallback] ?? "";
}
