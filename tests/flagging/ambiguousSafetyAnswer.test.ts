import { describe, expect, it } from "vitest";

import { checkAmbiguousSafetyAnswer } from "@/lib/flagging/rules/ambiguousSafetyAnswer";
import { parseTranscriptTurns } from "@/lib/flagging/transcriptParser";

describe("checkAmbiguousSafetyAnswer", () => {
  it("flags a contradictory yes/no answer near a safety question", () => {
    const turns = parseTranscriptTurns(
      [
        "Agent: Is anyone hurt?",
        "Caller: Yes, well, no, I mean yes I think so.",
      ].join("\n"),
    );
    expect(checkAmbiguousSafetyAnswer(turns).triggered).toBe(true);
  });

  it("does not flag a clear, unambiguous answer", () => {
    const turns = parseTranscriptTurns(
      ["Agent: Is anyone hurt?", "Caller: No, everyone is fine."].join("\n"),
    );
    expect(checkAmbiguousSafetyAnswer(turns).triggered).toBe(false);
  });

  it("does not flag when there is no safety question at all", () => {
    const turns = parseTranscriptTurns(
      ["Agent: Can I take your name?", "Caller: Yes, it's John."].join("\n"),
    );
    expect(checkAmbiguousSafetyAnswer(turns).triggered).toBe(false);
  });
});
