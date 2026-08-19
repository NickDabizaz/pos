import {
  disposeTenantClient,
  dropTenantDatabase,
  ensureTenantDatabaseExists,
  getTenantClient,
  migrateTenantDatabase,
  seedDefaultConfig,
} from "@/lib/server/provisioning/repository";
import type { ConfigRow, TenantClient } from "@/lib/server/provisioning/types";

export class InvalidDatabaseNameError extends Error {}

const VALID_DATABASE_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

function assertValidDatabaseName(namadatabase: string): void {
  if (!VALID_DATABASE_NAME.test(namadatabase)) {
    throw new InvalidDatabaseNameError(
      `Nama database "${namadatabase}" bukan identifier MariaDB yang sah`,
    );
  }
}

const KODE_DOKUMEN_MODULES: Record<string, { awalan: string; pakaitanggal: "0" | "1"; panjangnomor: string }> = {
  lokasi  : { awalan: "L",  pakaitanggal: "0", panjangnomor: "4" },
  barang  : { awalan: "B",  pakaitanggal: "0", panjangnomor: "4" },
  customer: { awalan: "C",  pakaitanggal: "0", panjangnomor: "4" },
  supplier: { awalan: "S",  pakaitanggal: "0", panjangnomor: "4" },
  jual    : { awalan: "JL", pakaitanggal: "1", panjangnomor: "4" },
  beli    : { awalan: "PB", pakaitanggal: "1", panjangnomor: "4" },
  kas     : { awalan: "KS", pakaitanggal: "1", panjangnomor: "4" },
};

function buildDefaultConfigRows(): ConfigRow[] {
  const kodeDokumenRows: ConfigRow[] = Object.entries(KODE_DOKUMEN_MODULES).flatMap(([modul, format]) => [
    { modul, config: "awalan", nilai: format.awalan },
    { modul, config: "pakaitanggal", nilai: format.pakaitanggal },
    { modul, config: "panjangnomor", nilai: format.panjangnomor },
  ]);

  return [
    ...kodeDokumenRows,
    { modul: "ppn", config: "persentase", nilai: "11" },
    { modul: "ppn", config: "status", nilai: "0" },
    { modul: "tampilan", config: "tema", nilai: "terang" },
  ];
}

const inFlightProvisioning = new Map<string, Promise<TenantClient>>();

async function runProvisioning(namadatabase: string): Promise<TenantClient> {
  await ensureTenantDatabaseExists(namadatabase);

  try {
    migrateTenantDatabase(namadatabase);
    const client = getTenantClient(namadatabase);
    await seedDefaultConfig(client, buildDefaultConfigRows());
    return client;
  } catch (error) {
    await disposeTenantClient(namadatabase);
    await dropTenantDatabase(namadatabase);
    throw error;
  }
}

/**
 * Membuat Database Perusahaan baru (kalau belum ada), menjalankan seluruh migration tenant, dan
 * mengisi Config default. Kegagalan di tengah jalan membersihkan database yang setengah jadi.
 * Panggilan bersamaan untuk `namadatabase` yang sama dideduplikasi ke satu eksekusi.
 */
export async function provisionDatabase(namadatabase: string): Promise<TenantClient> {
  assertValidDatabaseName(namadatabase);

  const existing = inFlightProvisioning.get(namadatabase);
  if (existing) {
    return existing;
  }

  const promise = runProvisioning(namadatabase).finally(() => {
    inFlightProvisioning.delete(namadatabase);
  });
  inFlightProvisioning.set(namadatabase, promise);
  return promise;
}
