"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Invite/recovery links land here with the session tokens in the URL
  // fragment (never sent to the server, so middleware can't redirect on
  // it). @supabase/ssr's browser client hard-codes flowType: "pkce",
  // which only auto-detects a `?code=` query param, not this implicit-flow
  // `#access_token=` fragment -- so we parse it ourselves and set the
  // session directly rather than relying on automatic URL detection.
  const [isRecovery, setIsRecovery] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("access_token")) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const type = params.get("type");

    if (!accessToken || !refreshToken) return;

    // Strip the tokens out of the address bar/history immediately, regardless
    // of outcome -- they're sensitive and only need to exist for this call.
    window.history.replaceState(null, "", window.location.pathname);

    supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error: setSessionError }) => {
      if (!setSessionError && type === "recovery") {
        setIsRecovery(true);
      }
    });
  }, [supabase]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace("/calls");
    router.refresh();
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecoveryError(null);

    if (newPassword !== confirmPassword) {
      setRecoveryError("Passwords don't match.");
      return;
    }

    setIsSettingPassword(true);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setIsSettingPassword(false);

    if (updateError) {
      setRecoveryError(updateError.message);
      return;
    }

    router.replace("/calls");
    router.refresh();
  }

  if (isRecovery) {
    return (
      <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Set your password</CardTitle>
            <CardDescription>Choose a password for your staff account.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSetPassword}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              {recoveryError && <p className="text-sm text-destructive">{recoveryError}</p>}
              <Button type="submit" disabled={isSettingPassword}>
                {isSettingPassword ? "Setting password..." : "Set password and sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Out-of-Hours Call Log</CardTitle>
          <CardDescription>
            Sign in with your staff account. Access is restricted to authorised Jewel Home
            Support staff -- there is no self-service sign-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
