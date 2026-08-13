import { isUrgentFlagType } from "@/lib/alerts/sendUrgentAlert";
import type { CallRow, FlagType, UrgencyLevel } from "@/lib/types/database";

export const URGENCY_RANK: Record<UrgencyLevel, number> = {
  routine: 0,
  same_day_action_needed: 1,
  immediate_escalation: 2,
};

// A call needs real-world follow-up if a callback was requested or its
// urgency is above routine. Derived rather than a separate stored flag,
// so it can never drift out of sync with the data that determines it.
export function callNeedsAction(
  call: Pick<CallRow, "callback_requested" | "urgency_level">,
): boolean {
  return call.callback_requested || call.urgency_level !== "routine";
}

// Higher = needs attention sooner. Any unresolved urgent flag type
// outranks urgency_level alone, since a fabricated summary or
// safeguarding keyword on a "routine" call still needs immediate review.
export function severityRank(urgencyLevel: UrgencyLevel, flagTypes: FlagType[]): number {
  const hasUrgentFlag = flagTypes.some(isUrgentFlagType);
  const urgencyScore = URGENCY_RANK[urgencyLevel];
  return hasUrgentFlag ? urgencyScore + 10 : urgencyScore;
}

export function urgencyBadgeVariant(
  urgencyLevel: UrgencyLevel,
): "outline" | "warning" | "destructive" {
  if (urgencyLevel === "immediate_escalation") return "destructive";
  if (urgencyLevel === "same_day_action_needed") return "warning";
  return "outline";
}
