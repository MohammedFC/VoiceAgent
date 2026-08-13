import type { FlagResult, TranscriptTurn } from "../types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
}

export function checkAgentLoopDetected(turns: TranscriptTurn[]): FlagResult {
  for (let i = 0; i < turns.length; i++) {
    if (turns[i].speaker !== "agent") continue;
    const normalizedQuestion = normalize(turns[i].text);
    if (!normalizedQuestion) continue;

    for (let j = i + 1; j < turns.length; j++) {
      if (turns[j].speaker === "caller") break; // a caller turn intervened -- not a loop
      if (turns[j].speaker === "agent" && normalize(turns[j].text) === normalizedQuestion) {
        return {
          flagType: "agent_loop_detected",
          triggered: true,
          reason: `The agent repeated "${turns[i].text}" without a new caller answer in between.`,
        };
      }
    }
  }

  return {
    flagType: "agent_loop_detected",
    triggered: false,
    reason: "No repeated agent questions found without an intervening caller answer.",
  };
}
