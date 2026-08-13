import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_BORDER = {
  default: "border-l-primary",
  warning: "border-l-warning",
  destructive: "border-l-destructive",
} as const;

export function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: keyof typeof TONE_BORDER;
}) {
  return (
    <Card className={cn("border-l-4", TONE_BORDER[tone])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}
