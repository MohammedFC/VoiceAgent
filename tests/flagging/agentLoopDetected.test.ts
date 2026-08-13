import { describe, expect, it } from "vitest";

import { checkAgentLoopDetected } from "@/lib/flagging/rules/agentLoopDetected";
import { parseTranscriptTurns } from "@/lib/flagging/transcriptParser";

describe("checkAgentLoopDetected", () => {
  it("flags the same agent question repeated with no caller turn in between", () => {
    const turns = parseTranscriptTurns(
      [
        "Agent: Can you confirm your address?",
        "Agent: Can you confirm your address?",
        "Caller: Sorry, yes, 12 High Street.",
      ].join("\n"),
    );
    expect(checkAgentLoopDetected(turns).triggered).toBe(true);
  });

  it("does not flag a repeated question when a caller turn intervenes", () => {
    const turns = parseTranscriptTurns(
      [
        "Agent: Can you confirm your address?",
        "Caller: Sorry, could you repeat that?",
        "Agent: Can you confirm your address?",
        "Caller: 12 High Street.",
      ].join("\n"),
    );
    expect(checkAgentLoopDetected(turns).triggered).toBe(false);
  });

  it("does not flag a normal conversation with no repeats", () => {
    const turns = parseTranscriptTurns(
      [
        "Agent: How can I help?",
        "Caller: I need to cancel my visit.",
        "Agent: Can I take your name?",
        "Caller: Jane Doe.",
      ].join("\n"),
    );
    expect(checkAgentLoopDetected(turns).triggered).toBe(false);
  });
});
