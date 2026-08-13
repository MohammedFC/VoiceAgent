export function TranscriptView({ transcript }: { transcript: string }) {
  return (
    <pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-4 font-mono text-sm">
      {transcript}
    </pre>
  );
}
