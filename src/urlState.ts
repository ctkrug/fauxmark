/**
 * Encodes/decodes the typed brand name to and from the URL hash so a scored
 * result is linkable and bookmarkable without any server-side routing.
 */

const PARAM = "name";

export function encodeNameToHash(name: string): string {
  return name ? `#${PARAM}=${encodeURIComponent(name)}` : "";
}

export function decodeNameFromHash(hash: string): string {
  if (!hash.startsWith("#")) return "";
  const params = new URLSearchParams(hash.slice(1));
  return params.get(PARAM) ?? "";
}
