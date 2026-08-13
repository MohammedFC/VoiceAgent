import { describe, expect, it } from "vitest";

import { checkLowConfidenceAddress } from "@/lib/flagging/rules/lowConfidenceAddress";

describe("checkLowConfidenceAddress", () => {
  it("flags a missing address", () => {
    expect(checkLowConfidenceAddress(null, true).triggered).toBe(true);
    expect(checkLowConfidenceAddress("", true).triggered).toBe(true);
  });

  it("flags an address without a valid UK postcode", () => {
    expect(checkLowConfidenceAddress("12 High Street, somewhere in town", true).triggered).toBe(
      true,
    );
  });

  it("flags an address with uncertainty filler language", () => {
    expect(
      checkLowConfidenceAddress("12 High Street, SW1A 1AA, I think", true).triggered,
    ).toBe(true);
  });

  it("flags an address that was never confirmed even with a valid postcode", () => {
    expect(checkLowConfidenceAddress("12 High Street, SW1A 1AA", false).triggered).toBe(true);
  });

  it("does not flag a confirmed address with a valid postcode", () => {
    expect(checkLowConfidenceAddress("12 High Street, SW1A 1AA", true).triggered).toBe(false);
  });
});
