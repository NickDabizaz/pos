import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findBarisLaporanKas } from "@/lib/server/laporan/kas/repository";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["kasdtl", "kas", "lokasi"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

async function buatLokasi() {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: "LOK01", namalokasi: "Toko Pusat" } });

  return lokasi.idlokasi;
}

async function buatKas(kodekas: string, tgltrans: Date, idlokasi: number, overrides: { status?: "S" | "D"; jenis?: "MASUK" | "KELUAR" } = {}) {
  await db.kas.create({
    data: {
      kodekas,
      tgltrans,
      jenis     : overrides.jenis ?? "MASUK",
      idlokasi,
      grandtotal: 300000,
      status    : overrides.status ?? "S",
      details: {
        create: [
          { urutan: 1, keterangan: "Rincian 1", nominal: 100000 },
          { urutan: 2, keterangan: "Rincian 2", nominal: 100000 },
          { urutan: 3, keterangan: "Rincian 3", nominal: 100000 },
        ],
      },
    },
  });
}

describe("repository laporan kas", () => {
  it("kas dengan 3 rincian -> 3 baris, masing-masing membawa jenis & grandtotal transaksi", async () => {
    const idlokasi = await buatLokasi();
    await buatKas("KS2608240001", new Date("2026-08-24"), idlokasi);

    const rows = await findBarisLaporanKas(db);

    expect(rows).toHaveLength(1);
    expect(rows[0].detail).toHaveLength(3);
    expect(rows[0].jenis).toBe("MASUK");
    expect(rows[0].grandtotal).toBe(300000);
  });

  it("filter tanggal & flag batal berperilaku sama seperti Penjualan", async () => {
    const idlokasi = await buatLokasi();
    await buatKas("KS2608010001", new Date("2026-08-01"), idlokasi);
    await buatKas("KS2608310001", new Date("2026-08-31"), idlokasi);
    await buatKas("KS2609010001", new Date("2026-09-01"), idlokasi);
    await buatKas("KS2608240002", new Date("2026-08-24"), idlokasi, { status: "D" });

    const rentang = await findBarisLaporanKas(db, { dari: new Date("2026-08-01"), sampai: new Date("2026-08-31") });
    expect(new Set(rentang.map((row) => row.kodekas))).toEqual(new Set(["KS2608010001", "KS2608310001"]));

    expect(await findBarisLaporanKas(db)).toHaveLength(3); // 3 transaksi live
    expect(await findBarisLaporanKas(db, { termasukDibatalkan: true })).toHaveLength(4);
  });

  it("idlokasi menyaring ke Lokasi terpilih", async () => {
    const idlokasi = await buatLokasi();
    const lain = await db.lokasi.create({ data: { kodelokasi: "LOK02", namalokasi: "Gudang" } });
    await buatKas("KS2608240001", new Date("2026-08-24"), idlokasi);
    await buatKas("KS2608240002", new Date("2026-08-24"), lain.idlokasi);

    const rows = await findBarisLaporanKas(db, { idlokasi: [idlokasi] });

    expect(rows.map((row) => row.kodekas)).toEqual(["KS2608240001"]);
  });
});
