import {
  createDatabasePerusahaanIfNotExists,
  disposeDatabasePerusahaanClient,
  dropDatabasePerusahaan,
  getDatabasePerusahaanClient,
  migrateDatabasePerusahaan,
  seedDefaultConfig,
  seedDefaultMasterData,
} from "@/lib/server/databaseperusahaan/repository";
import type { ConfigRow, DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";

const VALID_DATABASE_NAME = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

export const KODE_DOKUMEN_MODULES: Record<string, { awalan: string; pakaitanggal: "0" | "1"; panjangnomor: string }> = {
  lokasi  : { awalan: "L",  pakaitanggal: "0", panjangnomor: "4" },
  barang  : { awalan: "B",  pakaitanggal: "0", panjangnomor: "4" },
  customer: { awalan: "C",  pakaitanggal: "0", panjangnomor: "4" },
  supplier: { awalan: "S",  pakaitanggal: "0", panjangnomor: "4" },
  jual    : { awalan: "JL", pakaitanggal: "1", panjangnomor: "4" },
  beli    : { awalan: "PB", pakaitanggal: "1", panjangnomor: "4" },
  kas     : { awalan: "KS", pakaitanggal: "1", panjangnomor: "4" },
};

function cekValidNamaDatabase(namadatabase: string): void {
  if (!VALID_DATABASE_NAME.test(namadatabase)) {
    throw new Error(`Nama database "${namadatabase}" bukan identifier MariaDB yang sah`);
  }
}

export function buildDefaultConfigRows(): ConfigRow[] {
  const kodeDokumenRows: ConfigRow[] = Object.entries(KODE_DOKUMEN_MODULES).flatMap(([modul, format]) => [
    { modul, config: "awalan", nilai: format.awalan },
    { modul, config: "pakaitanggal", nilai: format.pakaitanggal },
    { modul, config: "panjangnomor", nilai: format.panjangnomor },
  ]);

  const rows = [
    ...kodeDokumenRows,
    { modul: "ppn", config: "persentase", nilai: "11" },
    { modul: "ppn", config: "status", nilai: "0" },
    { modul: "tampilan", config: "tema", nilai: "terang" },
  ];

  return rows;
}

const inFlightDatabaseCreation = new Map<string, Promise<DatabasePerusahaanClient>>();

async function runDatabaseCreation(namadatabase: string): Promise<DatabasePerusahaanClient> {
  await createDatabasePerusahaanIfNotExists(namadatabase);

  try {
    migrateDatabasePerusahaan(namadatabase);
    const client = getDatabasePerusahaanClient(namadatabase);
    await seedDefaultConfig(client, buildDefaultConfigRows());
    await seedDefaultMasterData(client);

    return client;
  } catch (error) {
    await disposeDatabasePerusahaanClient(namadatabase);
    await dropDatabasePerusahaan(namadatabase);
    throw error;
  }
}

export async function createDatabasePerusahaan(namadatabase: string): Promise<DatabasePerusahaanClient> {
  cekValidNamaDatabase(namadatabase);

  const existing = inFlightDatabaseCreation.get(namadatabase);
  if (existing) {
    return existing;
  }

  const promise = runDatabaseCreation(namadatabase).finally(() => {
    inFlightDatabaseCreation.delete(namadatabase);
  });
  inFlightDatabaseCreation.set(namadatabase, promise);

  return promise;
}
