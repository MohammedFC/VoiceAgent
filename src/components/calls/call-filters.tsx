"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CALL_REASON_CATEGORY_LABELS, FLAG_TYPE_LABELS, URGENCY_LEVEL_LABELS } from "@/lib/labels";

const ALL_VALUE = "all";

export function CallFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_VALUE || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/calls?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Search</label>
        <Input
          className="w-56"
          placeholder="Phone, caller, or client name"
          defaultValue={searchParams.get("q") ?? ""}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              setParam("q", (event.target as HTMLInputElement).value);
            }
          }}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Category</label>
        <Select
          value={searchParams.get("category") ?? ALL_VALUE}
          onValueChange={(v) => setParam("category", v ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All categories</SelectItem>
            {Object.entries(CALL_REASON_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Urgency</label>
        <Select
          value={searchParams.get("urgency") ?? ALL_VALUE}
          onValueChange={(v) => setParam("urgency", v ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All urgency levels</SelectItem>
            {Object.entries(URGENCY_LEVEL_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Flag</label>
        <Select
          value={searchParams.get("flag") ?? ALL_VALUE}
          onValueChange={(v) => setParam("flag", v ?? ALL_VALUE)}
        >
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All flags</SelectItem>
            {Object.entries(FLAG_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
