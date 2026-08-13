import { URGENT_FLAG_TYPES, type FlagType } from "@/lib/types/database";

export function isUrgentFlagType(flagType: FlagType): boolean {
  return (URGENT_FLAG_TYPES as FlagType[]).includes(flagType);
}

export interface UrgentAlertPayload {
  callId: string;
  flagType: FlagType;
  reason: string;
  raisedAt: string;
}

/**
 * TODO(real-integration): wire this to a real SMS/voice provider (e.g.
 * Twilio) to notify the on-call manager for urgent flag types
 * (ambiguous_safety_answer, safeguarding_keyword, possible_fabricated_summary).
 * For v1 this only logs -- the in-app urgent alert banner
 * (components/layout/urgent-alert-banner.tsx) is what actually surfaces
 * these to staff today, and it queries unresolved urgent flags directly
 * rather than depending on this function having "worked". Keep this
 * function's signature stable so a provider can be dropped in later
 * without touching any caller.
 */
export async function sendUrgentAlert(payload: UrgentAlertPayload): Promise<void> {
  console.warn("[URGENT ALERT - STUB, not yet wired to a real SMS/voice provider]", payload);
}
