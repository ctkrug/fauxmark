import { describe, expect, it } from "vitest";
import {
  analyzeBrandName,
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
});
