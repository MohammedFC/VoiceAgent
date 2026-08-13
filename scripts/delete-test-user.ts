// Deletes a throwaway staff account created by create-test-user.ts.
//
// Usage: tsx scripts/delete-test-user.ts <email>

import { join } from "node:path";
import { config as loadEnv } from "dotenv";

import { createAdminClient } from "../src/lib/supabase/admin";

loadEnv({ path: join(__dirname, "..", ".env.local") });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: tsx scripts/delete-test-user.ts <email>");
    process.exit(1);
  }

  const admin = createAdminClient();

  const { data: list, error: listError } = await admin.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  const match = list.users.find((u) => u.email === email);
  if (!match) {
    console.log(`No user found for ${email} (already deleted?).`);
    return;
  }

  const { error } = await admin.auth.admin.deleteUser(match.id);
  if (error) {
    console.error("Failed to delete user:", error.message);
    process.exit(1);
  }

  console.log(`Deleted test user ${email}.`);
}

main();
