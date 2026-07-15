import { describe, expect, it } from "vitest";
import { decodeNameFromHash, encodeNameToHash } from "../src/urlState";

describe("encodeNameToHash", () => {
  it("encodes a plain name", () => {
    expect(encodeNameToHash("Nike")).toBe("#name=Nike");
  });

  it("percent-encodes special characters", () => {
    expect(encodeNameToHash("Ben & Jerry's")).toBe(
      "#name=Ben%20%26%20Jerry's",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(encodeNameToHash("")).toBe("");
  });
});

describe("decodeNameFromHash", () => {
  it("decodes a plain name", () => {
    expect(decodeNameFromHash("#name=Nike")).toBe("Nike");
  });

  it("decodes percent-encoded characters", () => {
    expect(decodeNameFromHash("#name=Ben%20%26%20Jerry's")).toBe(
      "Ben & Jerry's",
    );
  });

  it("returns an empty string when there is no hash", () => {
    expect(decodeNameFromHash("")).toBe("");
  });

  it("returns an empty string when the hash has no name param", () => {
    expect(decodeNameFromHash("#other=value")).toBe("");
  });

  it("round-trips through encode then decode", () => {
    const name = "KUAFYQ";
    expect(decodeNameFromHash(encodeNameToHash(name))).toBe(name);
  });
});
