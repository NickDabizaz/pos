import { afterEach, describe, expect, it } from "vitest";

import { getTestDb, resetTables } from "@/lib/test/db";

const db = getTestDb();

afterEach(async () => {
  await resetTables(db, ["lokasi"]);
});

describe("contoh integrasi: membuat dan membaca satu baris Lokasi", () => {
  it("baris Lokasi yang dibuat dapat dibaca kembali lewat client Database Perusahaan", async () => {
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
