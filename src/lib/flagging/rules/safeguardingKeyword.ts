import type { FlagResult } from "../types";

const SAFEGUARDING_KEYWORDS = [
  "neglect",
  "unsafe",
  "hasn't come",
  "hasnt come",
  "hurt",
  "abuse",
  "safeguarding",
];

export function checkSafeguardingKeyword(rawTranscript: string): FlagResult {
  const lower = rawTranscript.toLowerCase();
  const matched = SAFEGUARDING_KEYWORDS.find((keyword) => lower.includes(keyword));

  return {
    flagType: "safeguarding_keyword",
    triggered: Boolean(matched),
    reason: matched
      ? `Transcript contains the safeguarding keyword "${matched}".`
      : "No safeguarding keywords found in the transcript.",
  };
}
