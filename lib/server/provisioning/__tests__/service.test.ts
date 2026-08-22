import { randomBytes } from "node:crypto";

import mariadb, { type Connection } from "mariadb";
import { afterEach, describe, expect, it } from "vitest";

import { ensureTenantDatabaseExists } from "@/lib/server/provisioning/repository";
import { InvalidDatabaseNameError, provisionDatabase } from "@/lib/server/provisioning/service";
import {
  createDatabase,
  dropDatabase,
  listTables,
  migrateDeploy,
  uniqueDatabaseName,
} from "@/prisma/__tests__/testDatabase";

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";

async function withAdminConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await mariadb.createConnection({ host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

async function tenantDatabaseExists(name: string): Promise<boolean> {
  return withAdminConnection(async (conn) => {
    const rows: Array<{ SCHEMA_NAME: string }> = await conn.query(
      "SELECT SCHEMA_NAME FROM information_schema.schemata WHERE SCHEMA_NAME = ?",
      [name],
    );
    return rows.length > 0;
  });
}

function uniqueName64(): string {
  const prefix = "pos_test_64_";
  const suffix = randomBytes(4).toString("hex");
  const padLength = 64 - prefix.length - suffix.length;
  return `${prefix}${"x".repeat(padLength)}${suffix}`;
}

const cleanupDbNames: string[] = [];

function trackDatabaseName(name: string): string {
  cleanupDbNames.push(name);
  return name;
}

function newDatabaseName(): string {
  return trackDatabaseName(uniqueDatabaseName("perusahaan"));
}

afterEach(async () => {
  while (cleanupDbNames.length > 0) {
    const name = cleanupDbNames.pop()!;
    await dropDatabase(name);
  }
}, 30_000);

describe("provisionDatabase membuat database dan menjalankan seluruh migration tenant", () => {
  it(
    "pada nama yang belum pernah ada membuat database baru dan seluruh tabel tenant muncul",
    async () => {
      const dbName = newDatabaseName();

      await provisionDatabase(dbName);

      const tables = await listTables(dbName);
      expect(tables).toEqual(
        expect.arrayContaining([
          "barang",
          "lokasi",
          "customer",
          "supplier",
          "jual",
          "jualdtl",
          "beli",
          "belidtl",
          "kas",
          "kasdtl",
          "modalawal",
          "setorankasir",
          "bayar",
          "config",
        ]),
      );
    },
    30_000,
  );

  it(
    "nama database sepanjang 64 karakter berhasil diprovisioning",
    async () => {
      const dbName = trackDatabaseName(uniqueName64());
      expect(dbName).toHaveLength(64);

      await expect(provisionDatabase(dbName)).resolves.toBeDefined();

      const tables = await listTables(dbName);
      expect(tables).toContain("config");
    },
    30_000,
  );

  it("nama database dengan karakter tidak sah (spasi) ditolak sebelum mencoba CREATE DATABASE", async () => {
    await expect(provisionDatabase("pos demo01")).rejects.toThrow(InvalidDatabaseNameError);
  });

  it("nama database dengan karakter tidak sah (titik koma) ditolak sebelum mencoba CREATE DATABASE", async () => {
    await expect(provisionDatabase("pos_demo01;drop")).rejects.toThrow(InvalidDatabaseNameError);
  });

  it(
    "server MariaDB tidak dapat dihubungi saat provisioning dimulai melempar error yang jelas",
    async () => {
      const dbName = uniqueDatabaseName("perusahaan");
      const originalPort = process.env.DB_PORT;
      process.env.DB_PORT = "1";

      try {
        await expect(provisionDatabase(dbName)).rejects.toThrow();
      } finally {
        if (originalPort === undefined) {
          delete process.env.DB_PORT;
        } else {
          process.env.DB_PORT = originalPort;
        }
      }
    },
    15_000,
  );
});

describe("provisionDatabase mengisi Config default", () => {
  it(
    "tabel config berisi baris Kode Dokumen tiap modul, mis. barang (awalan B, tanpa tanggal, panjang 4) dan jual (awalan JL, pakai tanggal, panjang 4)",
    async () => {
      const dbName = newDatabaseName();
      const client = await provisionDatabase(dbName);

      const barangRows = await client.config.findMany({ where: { modul: "barang" } });
      const asMap = (rows: { config: string; nilai: string }[]) =>
        Object.fromEntries(rows.map((row) => [row.config, row.nilai]));
      expect(asMap(barangRows)).toEqual({ awalan: "B", pakaitanggal: "0", panjangnomor: "4" });

      const jualRows = await client.config.findMany({ where: { modul: "jual" } });
      expect(asMap(jualRows)).toEqual({ awalan: "JL", pakaitanggal: "1", panjangnomor: "4" });

      for (const modul of ["lokasi", "customer", "supplier", "beli", "kas"]) {
        const rows = await client.config.findMany({ where: { modul } });
        expect(rows.map((row) => row.config).sort()).toEqual(["awalan", "pakaitanggal", "panjangnomor"]);
      }
    },
    30_000,
  );

  it(
    "tabel config berisi baris PPN dengan persentase dan status default",
    async () => {
      const dbName = newDatabaseName();
      const client = await provisionDatabase(dbName);

      const persentase = await client.config.findUnique({ where: { modul_config: { modul: "ppn", config: "persentase" } } });
      const status = await client.config.findUnique({ where: { modul_config: { modul: "ppn", config: "status" } } });

      expect(persentase?.nilai).toBe("11");
      expect(status?.nilai).toBe("0");
    },
    30_000,
  );

  it(
    "tabel config berisi baris pengaturan tampilan (modul tampilan, config tema)",
    async () => {
      const dbName = newDatabaseName();
      const client = await provisionDatabase(dbName);

      const tema = await client.config.findUnique({ where: { modul_config: { modul: "tampilan", config: "tema" } } });

      expect(tema?.nilai).toBeTruthy();
    },
    30_000,
  );

  it(
    "seluruh nilai Config default yang diseed tetap berada dalam batas kolom nilai (VarChar 255)",
    async () => {
      const dbName = newDatabaseName();
      const client = await provisionDatabase(dbName);

      const rows = await client.config.findMany();
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.nilai.length).toBeLessThanOrEqual(255);
      }
    },
    30_000,
  );
});

describe("kegagalan di tengah proses membersihkan database, bukan menyisakannya", () => {
  it(
    "migration tenant gagal di tengah jalan menyebabkan database yang baru dibuat ikut dibersihkan",
    async () => {
      const dbName = newDatabaseName();
      await createDatabase(dbName);
      await withAdminConnection((conn) => conn.query(`CREATE TABLE \`${dbName}\`.\`lokasi\` (id INT)`));

      await expect(provisionDatabase(dbName)).rejects.toThrow();

      expect(await tenantDatabaseExists(dbName)).toBe(false);
    },
    30_000,
  );

  it(
    "seed Config gagal setelah migration sukses menyebabkan seluruh provisioning dianggap gagal dan database dibersihkan",
    async () => {
      const dbName = newDatabaseName();
      await createDatabase(dbName);
      migrateDeploy("perusahaan", dbName);
      await withAdminConnection((conn) => conn.query(`DROP TABLE \`${dbName}\`.\`config\``));

      await expect(provisionDatabase(dbName)).rejects.toThrow();

      expect(await tenantDatabaseExists(dbName)).toBe(false);
    },
    30_000,
  );

  it(
    "setelah kegagalan dan pembersihan, memanggil ulang provisionDatabase dengan nama yang sama berhasil dari keadaan bersih",
    async () => {
      const dbName = newDatabaseName();
      await createDatabase(dbName);
      await withAdminConnection((conn) => conn.query(`CREATE TABLE \`${dbName}\`.\`lokasi\` (id INT)`));
      await expect(provisionDatabase(dbName)).rejects.toThrow();
      expect(await tenantDatabaseExists(dbName)).toBe(false);

      await expect(provisionDatabase(dbName)).resolves.toBeDefined();

      const tables = await listTables(dbName);
      expect(tables).toContain("config");
      const configRows = await withAdminConnection((conn) =>
        conn.query<Array<{ count: bigint | number }>>(`SELECT COUNT(*) as count FROM \`${dbName}\`.\`config\``),
      );
      expect(Number(configRows[0].count)).toBeGreaterThan(0);
    },
    30_000,
  );
});

describe("provisionDatabase berulang untuk nama yang sama tidak menggandakan Config maupun merusak data", () => {
  it(
    "memanggil provisionDatabase dua kali berturut-turut menghasilkan jumlah baris config yang sama persis, tidak dobel",
    async () => {
      const dbName = newDatabaseName();

      const client = await provisionDatabase(dbName);
      const countAfterFirst = await client.config.count();

      await provisionDatabase(dbName);
      const countAfterSecond = await client.config.count();

      expect(countAfterSecond).toBe(countAfterFirst);
    },
    30_000,
  );

  it(
    "memanggil ulang provisionDatabase pada database yang sudah berisi data non-Config tidak menghapus atau mengubah data tersebut",
    async () => {
      const dbName = newDatabaseName();

      const client = await provisionDatabase(dbName);
      const lokasi = await client.lokasi.create({ data: { kodelokasi: "LOK-KEEP", namalokasi: "Lokasi Dipertahankan" } });

      await provisionDatabase(dbName);

      const found = await client.lokasi.findUnique({ where: { idlokasi: lokasi.idlokasi } });
      expect(found).toEqual(lokasi);
    },
    30_000,
  );

  it(
    "dua panggilan provisionDatabase bersamaan tidak menghasilkan Config dobel maupun state rusak pada salah satunya",
    async () => {
      const dbName = newDatabaseName();

      const [clientA, clientB] = await Promise.all([provisionDatabase(dbName), provisionDatabase(dbName)]);

      expect(clientA).toBe(clientB);
      const configCount = await clientA.config.count();
      const distinctCount = await clientA.config.findMany({ distinct: ["modul", "config"] });
      expect(distinctCount).toHaveLength(configCount);
    },
    30_000,
  );

  it(
    "dua panggilan ensureTenantDatabaseExists bersamaan pada nama yang sama tidak saling gagal (handler ER_DB_CREATE_EXISTS teruji nyata)",
    async () => {
      const dbName = newDatabaseName();

      await expect(
        Promise.all([ensureTenantDatabaseExists(dbName), ensureTenantDatabaseExists(dbName)]),
      ).resolves.toBeDefined();

      expect(await tenantDatabaseExists(dbName)).toBe(true);
    },
    15_000,
  );
});

describe("client tenant dibuat lewat client Prisma tenant dan digunakan ulang per nama database", () => {
  it(
    "memanggil provisionDatabase untuk nama database yang sama dua kali menghasilkan instance client tenant yang sama",
    async () => {
      const dbName = newDatabaseName();

      const clientFirst = await provisionDatabase(dbName);
      const clientSecond = await provisionDatabase(dbName);

      expect(clientFirst).toBe(clientSecond);
    },
    30_000,
  );

  it(
    "memanggil provisionDatabase untuk dua nama database berbeda menghasilkan dua client tenant berbeda",
    async () => {
      const dbNameA = newDatabaseName();
      const dbNameB = newDatabaseName();

      const clientA = await provisionDatabase(dbNameA);
      const clientB = await provisionDatabase(dbNameB);

      expect(clientA).not.toBe(clientB);
    },
    30_000,
  );

  it(
    "data yang ditulis lewat client tenant pos_demo01 tidak pernah terlihat lewat client tenant pos_demo02",
    async () => {
      const dbNameA = newDatabaseName();
      const dbNameB = newDatabaseName();

      const clientA = await provisionDatabase(dbNameA);
      const clientB = await provisionDatabase(dbNameB);

      await clientA.lokasi.create({ data: { kodelokasi: "LOK-ISOLASI", namalokasi: "Hanya di Database A" } });

      const foundInB = await clientB.lokasi.findUnique({ where: { kodelokasi: "LOK-ISOLASI" } });
      expect(foundInB).toBeNull();

      const foundInA = await clientA.lokasi.findUnique({ where: { kodelokasi: "LOK-ISOLASI" } });
      expect(foundInA).not.toBeNull();
    },
    30_000,
  );
});
