import { disposeTenantClient } from "@/lib/server/provisioning/repository";
import { provisionDatabase } from "@/lib/server/provisioning/service";
import { TEST_DATABASE_NAME } from "@/lib/test/db";

/**
 * Runs once in Vitest's main process before any test file executes. Provisions the
 * persistent test Database Perusahaan through the same idempotent path as production
 * (`provisionDatabase`) — first run creates it and applies every migration, later runs are
 * a fast no-op. A failure here (e.g. MariaDB down) rejects and aborts the whole test run
 * with the underlying error, instead of letting individual tests fail against a missing
 * database.
 */
export async function setup(): Promise<void> {
  await provisionDatabase(TEST_DATABASE_NAME);
}

export async function teardown(): Promise<void> {
  await disposeTenantClient(TEST_DATABASE_NAME);
}
