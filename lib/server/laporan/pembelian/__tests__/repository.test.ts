import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findBarisLaporanPembelian } from "@/lib/server/laporan/pembelian/repository";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["belidtl", "beli", "supplier", "lokasi", "barang"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

async function buatMasterData() {
  const supplier = await db.supplier.create({ data: { kodesupplier: "S001", namasupplier: "PT Sumber Pangan" } });
  const lokasi = await db.lokasi.create({ data: { kodelokasi: "LOK01", namalokasi: "Toko Pusat" } });
  const barang = await db.barang.create({
    data: { kodebarang: "B001", namabarang: "Indomie Goreng", satuan: "PCS", hargabeli: 2000, hargajual: 3000 },
  });

  return { idsupplier: supplier.idsupplier, idlokasi: lokasi.idlokasi, idbarang: barang.idbarang };
}

async function buatPembelian(
  kodebeli: string,
  tgltrans: Date,
  master: { idsupplier: number; idlokasi: number; idbarang: number },
  overrides: { status?: "S" | "D" } = {},
) {
  await db.beli.create({
    data: {
      kodebeli,
      tgltrans,
      idsupplier: master.idsupplier,
      idlokasi  : master.idlokasi,
      total     : 20000,
      diskon    : 0,
      ppn       : 0,
      grandtotal: 20000,
      status    : overrides.status ?? "S",
      details: {
        create: [
          { urutan: 1, idbarang: master.idbarang, qty: 10, harga: 2000, pakaippn: "TIDAK", diskon: 0, ppn: 0, subtotal: 20000 },
        ],
      },
    },
  });
}

describe("repository laporan pembelian", () => {
  it("transaksi 2 baris -> 2 baris hasil, mengulang nilai supplier & grandtotal", async () => {
    const master = await buatMasterData();
    await db.beli.create({
      data: {
        kodebeli  : "PB2608240001",
        tgltrans  : new Date("2026-08-24"),
        idsupplier: master.idsupplier,
        idlokasi  : master.idlokasi,
        total     : 40000,
        diskon    : 0,
        ppn       : 0,
        grandtotal: 40000,
        status    : "S",
        details: {
          create: [
            { urutan: 1, idbarang: master.idbarang, qty: 10, harga: 2000, pakaippn: "TIDAK", diskon: 0, ppn: 0, subtotal: 20000 },
            { urutan: 2, idbarang: master.idbarang, qty: 10, harga: 2000, pakaippn: "TIDAK", diskon: 0, ppn: 0, subtotal: 20000 },
          ],
        },
      },
    });

    const rows = await findBarisLaporanPembelian(db);

    expect(rows).toHaveLength(2);
    expect(rows.every((row) => row.namasupplier === "PT Sumber Pangan" && row.grandtotal === 40000)).toBe(true);
  });

  it("dari/sampai inklusif di tanggal batas", async () => {
    const master = await buatMasterData();
    await buatPembelian("PB2608010001", new Date("2026-08-01"), master);
    await buatPembelian("PB2608310001", new Date("2026-08-31"), master);
    await buatPembelian("PB2609010001", new Date("2026-09-01"), master);

    const rows = await findBarisLaporanPembelian(db, { dari: new Date("2026-08-01"), sampai: new Date("2026-08-31") });

    expect(rows.map((row) => row.kodebeli).sort()).toEqual(["PB2608010001", "PB2608310001"]);
  });

  it("Pembelian D hanya muncul dengan termasukDibatalkan", async () => {
    const master = await buatMasterData();
    await buatPembelian("PB2608240001", new Date("2026-08-24"), master, { status: "S" });
    await buatPembelian("PB2608240002", new Date("2026-08-24"), master, { status: "D" });

    expect((await findBarisLaporanPembelian(db)).map((row) => row.kodebeli)).toEqual(["PB2608240001"]);
    expect((await findBarisLaporanPembelian(db, { termasukDibatalkan: true })).map((row) => row.kodebeli).sort()).toEqual([
      "PB2608240001", "PB2608240002",
    ]);
  });
});
