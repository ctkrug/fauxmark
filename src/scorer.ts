/**
 * BrandCheck heuristic scorer.
 *
 * Each metric returns a 0-100 "suspicion" score: higher means the string
 * looks more like an invented Amazon pseudo-brand, lower means it reads
 * like an ordinary English word or name.
 */

export interface MetricResult {
  key: string;
  label: string;
  score: number;
  detail: string;
}

export interface ScoreResult {
  input: string;
  metrics: MetricResult[];
  overallScore: number;
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

export function normalizeInput(raw: string): string {
  return raw.trim();
}

function letters(name: string): string[] {
  return name.toLowerCase().split("").filter((ch) => /[a-z]/.test(ch));
}

/**
 * Real English words average roughly 38-42% vowels. Pseudo-brands generated
 * to be keyword-dense or "unique" often drift far from that band in either
 * direction, so we score distance from the ideal midpoint rather than a
 * simple threshold.
 */
export function scoreVowelDensity(name: string): MetricResult {
  const chars = letters(name);
  const vowelCount = chars.filter((ch) => VOWELS.has(ch)).length;
  const density = chars.length === 0 ? 0 : vowelCount / chars.length;
  const idealMin = 0.32;
  const idealMax = 0.48;
  let distance = 0;
  if (density < idealMin) distance = idealMin - density;
  else if (density > idealMax) distance = density - idealMax;
  const score = Math.min(100, Math.round(distance * 250));

  return {
    key: "vowelDensity",
    label: "Vowel density",
    score,
    detail: `${Math.round(density * 100)}% vowels (typical English words: 32-48%)`,
  };
}

export function analyzeBrandName(raw: string): ScoreResult {
  const input = normalizeInput(raw);
  const metrics: MetricResult[] = [scoreVowelDensity(input)];

  return {
    input,
    metrics,
    overallScore: 0,
  };
}

export { letters, VOWELS };
