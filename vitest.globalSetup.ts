import { disposeDatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/repository";
import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import { TEST_DATABASE_NAME } from "@/lib/test/db";

/**
 * Runs once in Vitest's main process before any test file executes. Creates the
 * persistent test Database Perusahaan through the same idempotent path as production
 * (`createDatabasePerusahaan`) — first run creates it and applies every migration, later runs are
 * a fast no-op. A failure here (e.g. MariaDB down) rejects and aborts the whole test run
 * with the underlying error, instead of letting individual tests fail against a missing
 * database.
 */
export async function setup(): Promise<void> {
  await createDatabasePerusahaan(TEST_DATABASE_NAME);
}

export async function teardown(): Promise<void> {
  await disposeDatabasePerusahaanClient(TEST_DATABASE_NAME);
}
