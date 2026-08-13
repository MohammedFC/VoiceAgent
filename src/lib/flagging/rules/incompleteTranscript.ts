import type { FlagResult, TranscriptTurn } from "../types";

const DEFAULT_MIN_TURNS = 4;

export function checkIncompleteTranscript(
  turns: TranscriptTurn[],
  minTurns = DEFAULT_MIN_TURNS,
): FlagResult {
  const endsAfterOpeningLine = turns.length === 1 && turns[0]?.speaker === "agent";
  const tooFewTurns = turns.length < minTurns;
  const triggered = endsAfterOpeningLine || tooFewTurns;

  return {
    flagType: "incomplete_transcript",
    triggered,
    reason: endsAfterOpeningLine
      ? "Transcript ends immediately after the agent's opening line."
      : tooFewTurns
        ? `Transcript has only ${turns.length} exchange turn(s), fewer than the minimum of ${minTurns}.`
        : "Transcript has a normal number of exchange turns.",
  };
}
