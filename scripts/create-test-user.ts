// Creates (or resets the password of) a throwaway staff account for
// automated UI testing, so we never need real user credentials in a
// test script. Delete it afterward with delete-test-user.ts.
//
// Usage: tsx scripts/create-test-user.ts <email> <password>

import { join } from "node:path";
import { config as loadEnv } from "dotenv";

import { createAdminClient } from "../src/lib/supabase/admin";

loadEnv({ path: join(__dirname, "..", ".env.local") });

async function main() {
  const [email, password] = process.argv.slice(2);
  if (!email || !password) {
    console.error("Usage: tsx scripts/create-test-user.ts <email> <password>");
    process.exit(1);
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  console.log(`Test user ready: ${email} (id: ${data.user.id})`);
}

main();
