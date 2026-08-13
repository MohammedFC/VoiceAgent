import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { URGENT_FLAG_TYPES } from "@/lib/types/database";
import { FLAG_TYPE_LABELS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";

// Independent of the sendUrgentAlert() stub -- queries unresolved urgent
// flags directly on every render, so this banner is reliable today even
// though real off-device SMS/voice alerting isn't wired up yet.
export async function UrgentAlertBanner() {
  const supabase = await createClient();

  const { data: flags } = await supabase
    .from("review_flags")
    .select("flag_id, flag_type, call_id")
    .in("flag_type", URGENT_FLAG_TYPES)
    .eq("resolved", false);

  if (!flags || flags.length === 0) return null;

  return (
    <div className="flex items-center gap-3 border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        {flags.length} urgent {flags.length === 1 ? "flag needs" : "flags need"} review:{" "}
        {[...new Set(flags.map((f) => FLAG_TYPE_LABELS[f.flag_type]))].join(", ")}.
      </span>
      <Link href="/review-queue" className="ml-auto shrink-0 font-medium underline">
        Go to review queue
      </Link>
    </div>
  );
}
