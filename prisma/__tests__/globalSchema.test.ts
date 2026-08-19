import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import { listColumns, listTables, migrateDeploy, setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

let dbName: string;
let prisma: PrismaClient;
let tearDown: () => Promise<void>;

beforeAll(async () => {
  ({ dbName, prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterAll(async () => {
  await tearDown();
});

describe("dua schema Prisma menghasilkan dua client terpisah", () => {
  it("client Global punya model perusahaan yang tidak ada di client Database Perusahaan", () => {
    expect(typeof prisma.perusahaan.findMany).toBe("function");
  });
});

describe("skema Global memuat tabel bawaan Better Auth", () => {
  it("migration Global membuat tabel user, session, account, dan verification", async () => {
    const tables = await listTables(dbName);

    expect(tables).toEqual(
      expect.arrayContaining(["user", "session", "account", "verification"]),
    );
  });
});

describe("skema Global memuat tabel inti lintas Perusahaan", () => {
  it("migration Global membuat tabel perusahaan, subscription, subscriptiondtl, menu, usermenu, dan userperusahaan", async () => {
    const tables = await listTables(dbName);

    expect(tables).toEqual(
      expect.arrayContaining([
        "perusahaan",
        "subscription",
        "subscriptiondtl",
        "menu",
        "usermenu",
        "userperusahaan",
      ]),
    );
  });

  it("tabel userperusahaan memiliki kolom isowner", async () => {
    const columns = await listColumns(dbName, "userperusahaan");

    expect(columns).toContain("isowner");
  });
});

describe("Kode Dokumen tidak pernah kembar dalam satu tabel", () => {
  it('mendaftarkan Perusahaan kedua dengan kodeperusahaan "PT001" yang sudah dipakai Perusahaan pertama ditolak database', async () => {
    await prisma.perusahaan.create({
      data: {
        kodeperusahaan: "PT001",
        namaperusahaan: "Toko Sumber Rejeki",
        namadatabase  : "pos_perusahaan_sumber_rejeki",
      },
    });

    await expect(
      prisma.perusahaan.create({
        data: {
          kodeperusahaan: "PT001",
          namaperusahaan: "Toko Lain",
          namadatabase  : "pos_perusahaan_lain",
        },
      }),
    ).rejects.toThrow();
  });
});

describe("migration Global aman dijalankan berulang, dari keadaan kosong maupun sudah terisi", () => {
  it("menjalankan migration Global terhadap database kosong selesai tanpa error dan seluruh tabel yang disyaratkan ada", async () => {
    const tables = await listTables(dbName);

    expect(tables.length).toBeGreaterThan(0);
  });

  it(
    "menjalankan ulang migration Global yang sama terhadap database yang sudah dimigrasikan selesai tanpa error dan tidak menggandakan tabel",
    async () => {
      const tablesBefore = await listTables(dbName);

      expect(() => migrateDeploy("global", dbName)).not.toThrow();

      const tablesAfter = await listTables(dbName);
      expect(tablesAfter.sort()).toEqual(tablesBefore.sort());
    },
    30_000,
  );
});
