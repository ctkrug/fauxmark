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

export type Verdict = "checking" | "green" | "yellow" | "red";

export interface ScoreResult {
  input: string;
  metrics: MetricResult[];
  overallScore: number;
  verdict: Verdict;
}

// Relative weight of each metric in the overall suspicion score. Consonant
// clustering and pronounceability are the strongest tells, so they carry
// more weight than caps ratio (which real all-lowercase names can dodge).
const METRIC_WEIGHTS: Record<string, number> = {
  vowelDensity: 0.15,
  consonantClustering: 0.25,
  allCapsRatio: 0.25,
  pronounceability: 0.35,
};

export function verdictFromScore(score: number): Verdict {
  if (score >= 60) return "red";
  if (score >= 30) return "yellow";
  return "green";
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

/**
 * The longest run of consecutive consonants is one of the sharpest tells:
 * real English words rarely exceed a 3-consonant cluster ("strength"),
 * while generated pseudo-brands frequently string together 4+ ("Vlkzor").
 */
export function scoreConsonantClustering(name: string): MetricResult {
  const chars = letters(name);
  let longest = 0;
  let current = 0;
  for (const ch of chars) {
    if (VOWELS.has(ch)) {
      current = 0;
    } else {
      current += 1;
      longest = Math.max(longest, current);
    }
  }
  const score = longest <= 2 ? 0 : longest === 3 ? 20 : Math.min(100, 20 + (longest - 3) * 40);

  return {
    key: "consonantClustering",
    label: "Consonant clustering",
    score,
    detail:
      longest <= 1
        ? "no consecutive consonants"
        : `longest consonant run: ${longest} letters`,
  };
}

/**
 * Ordinary brand names capitalize only their first letter ("Nike"). Fully
 * or mostly capitalized strings ("KUAFYQ") are common among keyword-stuffed
 * Amazon listings, so we score the uppercase ratio excluding the first
 * character (a normal capitalized brand name would otherwise always trip
 * this metric).
 */
export function scoreAllCapsRatio(name: string): MetricResult {
  const alpha = name.split("").filter((ch) => /[a-zA-Z]/.test(ch));
  const rest = alpha.slice(1);
  const upperCount = rest.filter((ch) => ch === ch.toUpperCase() && /[A-Z]/.test(ch)).length;
  const ratio = rest.length === 0 ? 0 : upperCount / rest.length;
  const score = Math.round(ratio * 100);

  return {
    key: "allCapsRatio",
    label: "All-caps ratio",
    score,
    detail:
      score === 0
        ? "standard capitalization"
        : `${score}% of trailing letters are uppercase`,
  };
}

// Consonant-consonant bigrams that occur as legitimate onsets/codas/digraphs
// in common English words. A consonant pair outside this set is a good
// proxy for "hard to pronounce on the first try".
const PRONOUNCEABLE_BIGRAMS = new Set([
  "ch", "sh", "th", "ph", "wh", "gh", "ck", "ng", "nk", "st", "sp", "sk",
  "nd", "nt", "mp", "ct", "pt", "ld", "lt", "rd", "rt", "ft", "xt", "mb",
  "lm", "lp", "ls", "lf", "rk", "rm", "rn", "rp", "rs", "lk", "sm", "sn",
  "sw", "tr", "dr", "br", "cr", "fr", "gr", "pr", "kr", "cl", "bl", "fl",
  "gl", "pl", "sl", "tw", "dw", "qu", "wr", "kn", "gn", "ps", "pn", "mn",
  "rf", "rv", "lv", "rc", "lc", "nc", "rg", "lg",
]);

/**
 * Flags consonant-consonant bigrams that don't match a known-pronounceable
 * English onset/coda/digraph. A high hit rate means an English speaker is
 * likely to stumble reading the name aloud.
 */
export function scorePronounceability(name: string): MetricResult {
  const chars = letters(name);
  let consonantPairs = 0;
  let awkwardPairs = 0;
  for (let i = 0; i < chars.length - 1; i += 1) {
    const a = chars[i];
    const b = chars[i + 1];
    if (VOWELS.has(a) || VOWELS.has(b)) continue;
    consonantPairs += 1;
    if (!PRONOUNCEABLE_BIGRAMS.has(a + b)) awkwardPairs += 1;
  }
  const ratio = consonantPairs === 0 ? 0 : awkwardPairs / consonantPairs;
  const score = Math.round(ratio * 100);

  return {
    key: "pronounceability",
    label: "Pronounceability",
    score,
    detail:
      consonantPairs === 0
        ? "no consonant clusters to evaluate"
        : `${awkwardPairs}/${consonantPairs} consonant pairs are awkward to say`,
  };
}

export function analyzeBrandName(raw: string): ScoreResult {
  const input = normalizeInput(raw);
  const metrics: MetricResult[] = [
    scoreVowelDensity(input),
    scoreConsonantClustering(input),
    scoreAllCapsRatio(input),
    scorePronounceability(input),
  ];

  const hasLetters = letters(input).length > 0;
  const overallScore = hasLetters
    ? Math.round(
        metrics.reduce((sum, m) => sum + m.score * (METRIC_WEIGHTS[m.key] ?? 0), 0),
      )
    : 0;

  return {
    input,
    metrics,
    overallScore,
    verdict: hasLetters ? verdictFromScore(overallScore) : "checking",
  };
}

export { letters, VOWELS };
