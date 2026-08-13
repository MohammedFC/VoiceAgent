import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <span className="text-3xl font-semibold tabular-nums">{value}</span>
      </CardContent>
    </Card>
  );
}
