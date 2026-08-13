import type { FlagResult } from "../types";

const HUMAN_REQUESTED_PHRASES = [
  "speak to a person",
  "speak to someone",
  "not a robot",
  "real person",
  "speak to a human",
  "human, please",
];

export function checkHumanRequested(rawTranscript: string): FlagResult {
  const lower = rawTranscript.toLowerCase();
  const matched = HUMAN_REQUESTED_PHRASES.find((phrase) => lower.includes(phrase));

  return {
    flagType: "human_requested",
    triggered: Boolean(matched),
    reason: matched
      ? `Caller said "${matched}".`
      : "No request to speak to a human found in the transcript.",
  };
}
