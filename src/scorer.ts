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

export function analyzeBrandName(raw: string): ScoreResult {
  const input = normalizeInput(raw);
  const metrics: MetricResult[] = [];

  return {
    input,
    metrics,
    overallScore: 0,
  };
}

export { letters, VOWELS };
