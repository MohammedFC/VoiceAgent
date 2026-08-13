import type { FlagResult } from "../types";
import { containsAddressFillerPhrase, containsValidUkPostcode } from "../ukPostcode";

export function checkLowConfidenceAddress(
  address: string | null,
  addressConfirmed: boolean,
): FlagResult {
  if (!address || !address.trim()) {
    return {
      flagType: "low_confidence_address",
      triggered: true,
      reason: "No address was recorded for this call.",
    };
  }

  const hasValidPostcode = containsValidUkPostcode(address);
  const hasFillerPhrase = containsAddressFillerPhrase(address);

  if (!hasValidPostcode) {
    return {
      flagType: "low_confidence_address",
      triggered: true,
      reason: "Address does not contain a recognisable UK postcode.",
    };
  }

  if (hasFillerPhrase) {
    return {
      flagType: "low_confidence_address",
      triggered: true,
      reason: "Address contains uncertainty filler language (e.g. \"not sure\", \"I think\").",
    };
  }

  if (!addressConfirmed) {
    return {
      flagType: "low_confidence_address",
      triggered: true,
      reason: "Address was not read back/confirmed during the call.",
    };
  }

  return {
    flagType: "low_confidence_address",
    triggered: false,
    reason: "Address contains a valid postcode and was confirmed during the call.",
  };
}
