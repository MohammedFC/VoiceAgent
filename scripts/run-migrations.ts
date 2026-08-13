// Applies supabase/migrations/*.sql in order against a live Postgres
// database. Run with `npm run migrate`.
//
// Reads the connection string from SUPABASE_DB_URL in .env.local -- set
// it yourself directly in that file (never paste it into a chat/terminal
// argument, since command-line args and chat history can be logged).
// This script never prints the connection string, including in error
// output, so the password stays out of any transcript.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config as loadEnv } from "dotenv";
import { Client } from "pg";

loadEnv({ path: join(__dirname, "..", ".env.local") });

const MIGRATIONS_DIR = join(__dirname, "..", "supabase", "migrations");

function redact(message: string, connectionString: string): string {
  return message.split(connectionString).join("[REDACTED]");
}

async function main() {
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error(
      "SUPABASE_DB_URL is not set. Add it to .env.local yourself (Project Settings -> Database -> Connect -> Direct connection or Session pooler URI, with your real password) and re-run `npm run migrate`.",
    );
    process.exit(1);
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.error("No migration files found in supabase/migrations/.");
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("Connected to database.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Failed to connect:", redact(message, connectionString));
    process.exit(1);
  }

  try {
    await client.query("begin");
    for (const file of files) {
      const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
      console.log(`Applying ${file}...`);
      await client.query(sql);
    }
    await client.query("commit");
    console.log(`\nApplied ${files.length} migrations successfully.`);
  } catch (error) {
    await client.query("rollback");
    const message = error instanceof Error ? error.message : String(error);
    console.error("\nMigration failed, rolled back all changes:", redact(message, connectionString));
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
