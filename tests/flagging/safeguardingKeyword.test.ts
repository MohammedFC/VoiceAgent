import { describe, expect, it } from "vitest";

import { checkSafeguardingKeyword } from "@/lib/flagging/rules/safeguardingKeyword";

describe("checkSafeguardingKeyword", () => {
  it("flags a transcript mentioning neglect", () => {
    expect(
      checkSafeguardingKeyword("Caller: I think my mum is being neglected by her carer.")
        .triggered,
    ).toBe(true);
  });

  it("flags a transcript mentioning the carer hasn't come", () => {
    expect(
      checkSafeguardingKeyword("Caller: The carer hasn't come and it's been 3 hours.").triggered,
    ).toBe(true);
  });

  it("does not flag an ordinary transcript", () => {
    expect(
      checkSafeguardingKeyword("Caller: I'd like to cancel tomorrow's visit please.").triggered,
    ).toBe(false);
  });
});
