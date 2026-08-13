import type { FlagResult, TranscriptTurn } from "../types";

const SAFETY_QUESTION_CUES = [
  "are you safe",
  "is anyone hurt",
  "is anyone injured",
  "do you need an ambulance",
  "conscious and breathing",
  "is she conscious",
  "is he conscious",
  "do you need emergency",
];

const AFFIRMATIVE_TOKENS = ["yes", "yeah", "yep", "ok", "okay"];
const NEGATIVE_TOKENS = ["no", "not", "never", "nope"];

function containsToken(text: string, tokens: string[]): boolean {
  const words = text.toLowerCase().split(/\W+/);
  return tokens.some((token) => words.includes(token));
}

export function checkAmbiguousSafetyAnswer(turns: TranscriptTurn[]): FlagResult {
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    if (turn.speaker !== "agent") continue;

    const lowerAgentText = turn.text.toLowerCase();
    const isSafetyQuestion = SAFETY_QUESTION_CUES.some((cue) =>
      lowerAgentText.includes(cue),
    );
    if (!isSafetyQuestion) continue;

    const followingCallerTurn = turns
      .slice(i + 1, i + 3)
      .find((t) => t.speaker === "caller");
    if (!followingCallerTurn) continue;

    const hasAffirmative = containsToken(followingCallerTurn.text, AFFIRMATIVE_TOKENS);
    const hasNegative = containsToken(followingCallerTurn.text, NEGATIVE_TOKENS);

    if (hasAffirmative && hasNegative) {
      return {
        flagType: "ambiguous_safety_answer",
        triggered: true,
        reason: `Contradictory answer near a safety question: agent asked "${turn.text}", caller replied "${followingCallerTurn.text}".`,
      };
    }
  }

  return {
    flagType: "ambiguous_safety_answer",
    triggered: false,
    reason: "No contradictory answers found near safety/triage questions.",
  };
}
