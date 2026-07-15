import { describe, expect, it } from "vitest";
import {
  analyzeBrandName,
  classifyLetters,
  scoreAllCapsRatio,
  scoreConsonantClustering,
  scorePronounceability,
  scoreVowelDensity,
  verdictFromScore,
} from "../src/scorer";

describe("scoreVowelDensity", () => {
  it("scores a normal word low", () => {
    expect(scoreVowelDensity("umbrella").score).toBeLessThan(20);
  });

  it("scores a vowel-starved string high", () => {
    expect(scoreVowelDensity("kzvblqm").score).toBeGreaterThan(50);
  });
});

describe("scoreConsonantClustering", () => {
  it("does not penalize short clusters", () => {
    expect(scoreConsonantClustering("strong").score).toBeLessThanOrEqual(20);
  });

  it("penalizes long consonant runs", () => {
    expect(scoreConsonantClustering("vlkzor").score).toBeGreaterThan(50);
  });
});

describe("scoreAllCapsRatio", () => {
  it("does not penalize standard capitalization", () => {
    expect(scoreAllCapsRatio("Nike").score).toBe(0);
  });

  it("penalizes shouty strings", () => {
    expect(scoreAllCapsRatio("KUAFYQ").score).toBeGreaterThan(80);
  });
});

describe("scorePronounceability", () => {
  it("scores a pronounceable word low", () => {
    expect(scorePronounceability("wonderful").score).toBeLessThan(30);
  });

  it("scores an awkward consonant pileup high", () => {
    expect(scorePronounceability("vxqz").score).toBeGreaterThan(50);
  });
});

describe("verdictFromScore", () => {
  it("maps low scores to green", () => {
    expect(verdictFromScore(10)).toBe("green");
  });

  it("maps mid scores to yellow", () => {
    expect(verdictFromScore(45)).toBe("yellow");
  });

  it("maps high scores to red", () => {
    expect(verdictFromScore(85)).toBe("red");
  });
});

describe("classifyLetters", () => {
  it("classifies vowels and consonants for a normal word", () => {
    expect(classifyLetters("Nike").map((l) => l.cls)).toEqual([
      "consonant",
      "vowel",
      "consonant",
      "vowel",
    ]);
  });

  it("flags a run of 3+ consonants as cluster, not shorter runs", () => {
    expect(classifyLetters("Vlkzor").map((l) => l.cls)).toEqual([
      "cluster",
      "cluster",
      "cluster",
      "cluster",
      "vowel",
      "consonant",
    ]);
  });

  it("marks non-alphabetic characters as other and preserves them", () => {
    const result = classifyLetters("K7!x");
    expect(result.map((l) => l.char)).toEqual(["K", "7", "!", "x"]);
    expect(result.map((l) => l.cls)).toEqual([
      "consonant",
      "other",
      "other",
      "consonant",
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(classifyLetters("")).toEqual([]);
  });
});

describe("analyzeBrandName", () => {
  it("returns a checking verdict for empty input", () => {
    const result = analyzeBrandName("");
    expect(result.verdict).toBe("checking");
    expect(result.overallScore).toBe(0);
  });

  it("returns four metrics for a real input", () => {
    const result = analyzeBrandName("Patagonia");
    expect(result.metrics).toHaveLength(4);
    expect(result.verdict).not.toBe("checking");
  });

  it("scores an obvious pseudo-brand as red", () => {
    const result = analyzeBrandName("KUAFYQ");
    expect(result.verdict).toBe("red");
  });

  it("flags 1-2 letter input as insufficient signal, not a color verdict", () => {
    expect(analyzeBrandName("a").verdict).toBe("insufficient");
    expect(analyzeBrandName("ab").verdict).toBe("insufficient");
  });

  it("gives a confident verdict once input reaches 3 letters", () => {
    expect(analyzeBrandName("abc").verdict).not.toBe("insufficient");
  });

  it("ignores non-alphabetic characters when counting letters for the threshold", () => {
    expect(analyzeBrandName("7!7").verdict).toBe("checking");
    expect(analyzeBrandName("a7!").verdict).toBe("insufficient");
  });
});
