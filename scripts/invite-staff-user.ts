// Invites a staff member by email using the Supabase admin API. The
// invitee sets their own password via the emailed link, so no password
// ever passes through this script, this terminal, or chat.
//
// Usage: tsx scripts/invite-staff-user.ts someone@example.com
//
// Reads SUPABASE_SECRET_KEY / NEXT_PUBLIC_SUPABASE_URL from .env.local.
// Never prints the secret key, including in error output.

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
    console.error("Usage: tsx scripts/invite-staff-user.ts <email>");
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

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email);

  if (error) {
    console.error("Failed to invite user:", redact(error.message, secretKey));
    process.exit(1);
  }

  console.log(`Invite sent to ${email} (user id: ${data.user.id}).`);
  console.log("They'll receive an email with a link to set their password and sign in.");
}

main();
