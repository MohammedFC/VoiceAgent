import { describe, expect, it } from "vitest";

import { runFlaggingRules } from "@/lib/flagging/engine";

describe("runFlaggingRules", () => {
  it("returns no flags for a clean, routine call", () => {
    const flags = runFlaggingRules({
      callId: "1",
      rawTranscript: [
        "Agent: Hello, this is Kath, how can I help?",
        "Caller: Hi, I need to cancel tomorrow's visit please.",
        "Agent: No problem, can I take your name and address?",
        "Caller: It's Jane Doe, 12 High Street, SW1A 1AA.",
        "Agent: Thanks Jane, can you confirm that postcode is correct?",
        "Caller: Yes, that's right.",
        "Agent: Great, that's cancelled, thanks for calling.",
      ].join("\n"),
      aiSummary: "Jane Doe requested a visit cancellation for tomorrow.",
      clientAddress: "12 High Street, SW1A 1AA",
      addressConfirmed: true,
    });

    expect(flags).toEqual([]);
  });

  it("returns multiple flags for a problematic call", () => {
    const flags = runFlaggingRules({
      callId: "2",
      rawTranscript: "Agent: Hello, this is Kath, how can I help?",
      aiSummary: "Caller Bob Jones reported a medical emergency in Manchester.",
      clientAddress: "somewhere near the church, not sure of the postcode",
      addressConfirmed: false,
    });

    const flagTypes = flags.map((f) => f.flagType);
    expect(flagTypes).toContain("incomplete_transcript");
    expect(flagTypes).toContain("low_confidence_address");
    expect(flagTypes).toContain("possible_fabricated_summary");
  });

  it("flags safeguarding keywords as a hard, isolated signal", () => {
    const flags = runFlaggingRules({
      callId: "3",
      rawTranscript: [
        "Agent: Hello, this is Kath, how can I help?",
        "Caller: I'm worried, my dad's carer hasn't come and I think he's being neglected.",
        "Agent: I understand, let me take some details.",
        "Caller: Okay, thank you.",
      ].join("\n"),
      aiSummary: "Caller raised a safeguarding concern about a missed care visit.",
      clientAddress: "12 High Street, SW1A 1AA",
      addressConfirmed: true,
    });

    const flagTypes = flags.map((f) => f.flagType);
    expect(flagTypes).toContain("safeguarding_keyword");
  });
});
