import type { FlagType } from "@/lib/types/database";

export interface CallForFlagging {
  callId: string;
  rawTranscript: string;
  aiSummary: string | null;
  clientAddress: string | null;
  addressConfirmed: boolean;
}

export interface FlagResult {
  flagType: FlagType;
  triggered: boolean;
  reason: string;
}

export interface TranscriptTurn {
  speaker: "agent" | "caller";
  text: string;
}
