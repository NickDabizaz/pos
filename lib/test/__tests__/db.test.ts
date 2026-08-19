import { afterEach, describe, expect, it } from "vitest";

import { getTestDb, resetTables } from "@/lib/test/db";

const db = getTestDb();

afterEach(async () => {
  await resetTables(db, ["lokasi", "bayar", "jual", "customer"]);
});

describe("resetTables membersihkan tabel yang dipakai satu test", () => {
  it("menghapus seluruh baris di tabel lokasi tanpa menyentuh tabel lain, mis. config tetap utuh", async () => {
    await db.lokasi.create({ data: { kodelokasi: "LOK-RESET-1", namalokasi: "Akan Dihapus" } });
    const configCountBefore = await db.config.count();

    await resetTables(db, ["lokasi"]);

    expect(await db.lokasi.count()).toBe(0);
    expect(await db.config.count()).toBe(configCountBefore);
  });

  it("membersihkan dua tabel sekaligus dalam satu pemanggilan", async () => {
    const lokasi = await db.lokasi.create({ data: { kodelokasi: "LOK-RESET-2", namalokasi: "Lokasi Untuk Jual" } });
    const customer = await db.customer.create({ data: { kodecustomer: "CUST-RESET-2", namacustomer: "Customer Reset" } });
    const jual = await db.jual.create({
      data: {
        kodejual      : "JL-RESET-0001",
        tgltrans      : new Date("2026-01-01"),
        jenistransaksi: "tunai",
        idcustomer    : customer.idcustomer,
        idlokasi      : lokasi.idlokasi,
        total         : 10_000,
        diskon        : 0,
        ppn           : 0,
        grandtotal    : 10_000,
      },
    });
    await db.bayar.create({ data: { idjual: jual.idjual, tunai: 10_000, nontunai: 0, kembalian: 0 } });

    await resetTables(db, ["jual", "bayar"]);

    expect(await db.jual.count()).toBe(0);
    expect(await db.bayar.count()).toBe(0);
  });

  it("dengan daftar tabel kosong tidak melakukan apa-apa dan tidak error", async () => {
    await db.lokasi.create({ data: { kodelokasi: "LOK-RESET-3", namalokasi: "Tetap Ada" } });

    await expect(resetTables(db, [])).resolves.toBeUndefined();

    expect(await db.lokasi.count()).toBe(1);
  });

  it("dengan nama tabel yang tidak ada melempar error yang jelas", async () => {
    await expect(resetTables(db, ["tabeltidakada"])).rejects.toThrow();
  });
});
