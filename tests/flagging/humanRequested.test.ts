import { describe, expect, it } from "vitest";

import { checkHumanRequested } from "@/lib/flagging/rules/humanRequested";

describe("checkHumanRequested", () => {
  it("flags a request to speak to a person", () => {
    expect(
      checkHumanRequested("Caller: I don't want a robot, let me speak to a person.").triggered,
    ).toBe(true);
  });

  it("flags a caller saying 'not a robot'", () => {
    expect(checkHumanRequested("Caller: Are you even a real person, not a robot?").triggered).toBe(
      true,
    );
  });

  it("does not flag an ordinary transcript", () => {
    expect(checkHumanRequested("Caller: I'd like to cancel my visit please.").triggered).toBe(
      false,
    );
  });
});
