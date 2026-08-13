import { describe, expect, it } from "vitest";

import { checkIncompleteTranscript } from "@/lib/flagging/rules/incompleteTranscript";
import { parseTranscriptTurns } from "@/lib/flagging/transcriptParser";

describe("checkIncompleteTranscript", () => {
  it("flags a transcript that ends after the agent's opening line", () => {
    const turns = parseTranscriptTurns("Agent: Hello, this is Kath, how can I help?");
    expect(checkIncompleteTranscript(turns).triggered).toBe(true);
  });

  it("flags a transcript with fewer than the minimum turns", () => {
    const turns = parseTranscriptTurns(
      "Agent: Hello, this is Kath.\nCaller: Hi, I need to cancel my visit.",
    );
    expect(checkIncompleteTranscript(turns).triggered).toBe(true);
  });

  it("does not flag a transcript with a normal back-and-forth", () => {
    const turns = parseTranscriptTurns(
      [
        "Agent: Hello, this is Kath, how can I help?",
        "Caller: I need to cancel tomorrow's visit.",
        "Agent: No problem, can I take your name?",
        "Caller: It's Jane Doe.",
        "Agent: Thanks Jane, that's cancelled.",
      ].join("\n"),
    );
    expect(checkIncompleteTranscript(turns).triggered).toBe(false);
  });
});
