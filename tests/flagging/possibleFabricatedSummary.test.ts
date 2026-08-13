import { describe, expect, it } from "vitest";

import { checkPossibleFabricatedSummary } from "@/lib/flagging/rules/possibleFabricatedSummary";

describe("checkPossibleFabricatedSummary", () => {
  it("flags a summary that mentions a name not present in the transcript", () => {
    const transcript = "Agent: How can I help? Caller: I need to cancel my visit tomorrow.";
    const summary = "Caller John Smith requested a visit cancellation for tomorrow.";
    const result = checkPossibleFabricatedSummary(summary, transcript);
    expect(result.triggered).toBe(true);
    expect(result.reason).toContain("John Smith");
  });

  it("does not flag a summary whose entities all appear in the transcript", () => {
    const transcript =
      "Agent: How can I help? Caller: This is Jane Doe, I need to cancel my visit in London.";
    const summary = "Jane Doe requested a visit cancellation in London.";
    expect(checkPossibleFabricatedSummary(summary, transcript).triggered).toBe(false);
  });

  it("does not flag when there is no summary", () => {
    expect(checkPossibleFabricatedSummary(null, "Agent: Hello.").triggered).toBe(false);
  });
});
