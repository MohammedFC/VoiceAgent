import { CallForm } from "@/components/calls/call-form";

export default function NewCallPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">New call</h1>
        <p className="text-sm text-muted-foreground">
          Manually record an out-of-hours call. Auto-flagging rules run automatically once
          saved.
        </p>
      </div>
      <CallForm />
    </div>
  );
}
