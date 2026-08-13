import type { FlagResult } from "../types";

// Naive proper-noun extraction (no ML, per spec): find runs of
// Title-Case words, skipping each sentence's first word since
// sentence-initial capitalisation doesn't indicate a proper noun.
function extractEntities(summary: string): string[] {
  const entities: string[] = [];

  for (const sentence of summary.split(/(?<=[.!?])\s+/)) {
    const words = sentence.trim().split(/\s+/).filter(Boolean);
    let currentRun: string[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^A-Za-z']/g, "");
      const isTitleCase = /^[A-Z][a-z']+$/.test(word);
      const isSentenceInitial = i === 0;

      if (isTitleCase && !isSentenceInitial) {
        currentRun.push(word);
      } else {
        if (currentRun.length > 0) entities.push(currentRun.join(" "));
        currentRun = [];
      }
    }
    if (currentRun.length > 0) entities.push(currentRun.join(" "));
  }

  return [...new Set(entities)];
}

function normalizeWhitespace(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ");
}

export function checkPossibleFabricatedSummary(
  aiSummary: string | null,
  rawTranscript: string,
): FlagResult {
  if (!aiSummary || !aiSummary.trim()) {
    return {
      flagType: "possible_fabricated_summary",
      triggered: false,
      reason: "No AI summary to check.",
    };
  }

  const entities = extractEntities(aiSummary);
  const normalizedTranscript = normalizeWhitespace(rawTranscript);

  const unverified = entities.filter(
    (entity) => !normalizedTranscript.includes(normalizeWhitespace(entity)),
  );

  if (unverified.length > 0) {
    return {
      flagType: "possible_fabricated_summary",
      triggered: true,
      reason: `Summary mentions "${unverified.join('", "')}" which does not appear anywhere in the transcript. Any unverified entity is treated as a hard flag.`,
    };
  }

  return {
    flagType: "possible_fabricated_summary",
    triggered: false,
    reason: "Every named entity in the summary is traceable to the transcript.",
  };
}
