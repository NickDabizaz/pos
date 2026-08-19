import { afterEach, describe, expect, it } from "vitest";

import { getTestDb, resetTables } from "@/lib/test/db";

/**
 * Contoh test integrasi terhadap database test persisten (bukan bagian dari modul lokasi
 * itu sendiri — lokasi masih memakai in-memory store, lihat lib/server/lokasi/repository.ts).
 * Membuktikan bahwa infrastruktur globalSetup + resetTables (lib/test/db.ts) benar-benar
 * terpakai: dijalankan berulang lewat `vitest run` tetap hijau karena resetTables
 * membersihkan sisa run sebelumnya di afterEach.
 */
const db = getTestDb();

afterEach(async () => {
  await resetTables(db, ["lokasi"]);
});

describe("contoh integrasi: membuat dan membaca satu baris Lokasi", () => {
  it("baris Lokasi yang dibuat dapat dibaca kembali lewat client tenant", async () => {
    const created = await db.lokasi.create({
      data: { kodelokasi: "LOK-EXAMPLE", namalokasi: "Lokasi Contoh Integrasi" },
    });

    const found = await db.lokasi.findUnique({ where: { idlokasi: created.idlokasi } });

    expect(found).toEqual(created);
  });

  it("tidak melihat baris Lokasi yang dibuat oleh test sebelumnya, karena resetTables sudah membersihkannya", async () => {
    const existing = await db.lokasi.findUnique({ where: { kodelokasi: "LOK-EXAMPLE" } });

    expect(existing).toBeNull();
  });
});
