import type { TranscriptTurn } from "./types";

// Transcripts are keyed line-by-line as "Agent: ..." / "Caller: ..."
// (the voice agent is named "Kath", also recognised as an agent label).
// This matches both the seed data convention and the 4-part email
// template's transcript field.
const AGENT_LABELS = new Set(["agent", "kath"]);
const CALLER_LABELS = new Set(["caller", "customer", "client"]);

export function parseTranscriptTurns(rawTranscript: string): TranscriptTurn[] {
  const turns: TranscriptTurn[] = [];

  for (const rawLine of rawTranscript.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const match = line.match(/^([A-Za-z][A-Za-z ]*?):\s*(.*)$/);
    if (!match) continue;

    const label = match[1].trim().toLowerCase();
    const text = match[2].trim();
    if (!text) continue;

    if (AGENT_LABELS.has(label)) {
      turns.push({ speaker: "agent", text });
    } else if (CALLER_LABELS.has(label)) {
      turns.push({ speaker: "caller", text });
    }
  }

  return turns;
}
