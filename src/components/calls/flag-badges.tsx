import { Badge } from "@/components/ui/badge";
import { isUrgentFlagType } from "@/lib/alerts/sendUrgentAlert";
import { FLAG_TYPE_LABELS } from "@/lib/labels";
import type { FlagType } from "@/lib/types/database";

export interface FlagBadgeData {
  flagType: FlagType;
  resolved: boolean;
}

export function FlagBadges({ flags }: { flags: FlagBadgeData[] }) {
  if (flags.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {flags.map((flag, index) => (
        <Badge
          key={`${flag.flagType}-${index}`}
          variant={flag.resolved ? "success" : isUrgentFlagType(flag.flagType) ? "destructive" : "secondary"}
        >
          {FLAG_TYPE_LABELS[flag.flagType]}
        </Badge>
      ))}
    </div>
  );
}
