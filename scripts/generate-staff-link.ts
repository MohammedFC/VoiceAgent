// Generates a direct action link for a staff account instead of relying
// on Supabase's outbound email (which is rate-limited/unreliable on the
// default dev sender). Prints a one-time URL that lets the user set
// their password immediately, no email delivery involved.
//
// Usage: tsx scripts/generate-staff-link.ts someone@example.com
//
// Reads SUPABASE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL from .env.local.
// Never prints the secret key, including in error output. The generated
// link itself is a one-time credential -- treat it like a password and
// don't share it beyond the intended recipient.

import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";

loadEnv({ path: join(__dirname, "..", ".env.local") });

function redact(message: string, secret: string): string {
  return secret ? message.split(secret).join("[REDACTED]") : message;
}

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/generate-staff-link.ts <email>");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local.",
    );
    process.exit(1);
  }

  const admin = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // "invite" only works for brand-new users; this account was already
  // created by the earlier email-based invite, so fall back to "recovery"
  // (a password-set/reset link) if invite reports the user exists.
  let { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
  });

  if (error?.message.includes("already been registered")) {
    ({ data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    }));
  }

  if (error) {
    console.error("Failed to generate link:", redact(error.message, secretKey));
    process.exit(1);
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    console.error("No action link returned.");
    process.exit(1);
  }

  console.log(`Link for ${email} (open in a browser to set your password):\n`);
  console.log(actionLink);
}

main();
