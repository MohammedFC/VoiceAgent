import { isUrgentFlagType } from "@/lib/alerts/sendUrgentAlert";
import type { FlagType, UrgencyLevel } from "@/lib/types/database";

const URGENCY_RANK: Record<UrgencyLevel, number> = {
  routine: 0,
  same_day_action_needed: 1,
  immediate_escalation: 2,
};

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
): "outline" | "secondary" | "destructive" {
  if (urgencyLevel === "immediate_escalation") return "destructive";
  if (urgencyLevel === "same_day_action_needed") return "secondary";
  return "outline";
}
