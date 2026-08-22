import { getTenantClient } from "@/lib/server/provisioning/repository";
import type { TenantClient } from "@/lib/server/provisioning/types";

export const TEST_DATABASE_NAME = process.env.TEST_DATABASE_NAME ?? "pos_test_perusahaan";

export function getTestDb(): TenantClient {
  return getTenantClient(TEST_DATABASE_NAME);
}

export async function resetTables(db: TenantClient, namaTabel: string[]): Promise<void> {
  if (namaTabel.length === 0) {
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const table of namaTabel) {
        await tx.$executeRawUnsafe(`DELETE FROM \`${table}\``);
      }
    } finally {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }
  });
}
