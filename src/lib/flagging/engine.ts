import { parseTranscriptTurns } from "./transcriptParser";
import { checkIncompleteTranscript } from "./rules/incompleteTranscript";
import { checkAmbiguousSafetyAnswer } from "./rules/ambiguousSafetyAnswer";
import { checkLowConfidenceAddress } from "./rules/lowConfidenceAddress";
import { checkSafeguardingKeyword } from "./rules/safeguardingKeyword";
import { checkAgentLoopDetected } from "./rules/agentLoopDetected";
import { checkPossibleFabricatedSummary } from "./rules/possibleFabricatedSummary";
import { checkHumanRequested } from "./rules/humanRequested";
import type { CallForFlagging, FlagResult } from "./types";

export function runFlaggingRules(call: CallForFlagging): FlagResult[] {
  const turns = parseTranscriptTurns(call.rawTranscript);

  const results: FlagResult[] = [
    checkIncompleteTranscript(turns),
    checkAmbiguousSafetyAnswer(turns),
    checkLowConfidenceAddress(call.clientAddress, call.addressConfirmed),
    checkSafeguardingKeyword(call.rawTranscript),
    checkAgentLoopDetected(turns),
    checkPossibleFabricatedSummary(call.aiSummary, call.rawTranscript),
    checkHumanRequested(call.rawTranscript),
  ];

  return results.filter((result) => result.triggered);
}
