/**
 * Customer-facing product names.
 * ERP names carry supplier prefixes ("T AHT BAT BALL", "BAH DBT DOLL SILKI FAML"); cleanName strips them:
 *  - first word "T" and second word exactly 3 letters → drop both  ("T AHT BAT BALL" → "BAT BALL")
 *  - starts with "BAH DBT"                         → drop both  ("BAH DBT DOLL …" → "DOLL …")
 *  - else first word is a single letter            → drop it    ("P GANPATI ASAN" → "GANPATI ASAN")
 * Never returns empty: falls back to the ERP name.
 * Keep in sync with SHOWN_NAME_SQL in lib/catalog.ts (used for sorting).
 */
export function cleanName(erpName: string): string {
  const original = erpName.trim();
  const words = original.split(/\s+/);
  let rest = words;
  if (words[0] === "T" && words.length > 1 && /^[A-Za-z]{3}$/.test(words[1])) rest = words.slice(2);
  else if (words[0] === "BAH" && words[1] === "DBT") rest = words.slice(2);
  else if (/^[A-Za-z]$/.test(words[0] ?? "")) rest = words.slice(1);
  const cleaned = rest.join(" ").trim();
  return cleaned || original;
}

/** The name shown everywhere: the owner's display name, else the auto-cleaned ERP name. */
export function shownName(displayName: string | null | undefined, erpName: string): string {
  const d = displayName?.trim();
  return d ? d : cleanName(erpName);
}
