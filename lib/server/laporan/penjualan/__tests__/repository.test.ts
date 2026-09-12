import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findBarisLaporanPenjualan } from "@/lib/server/laporan/penjualan/repository";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["jualdtl", "jual", "customer", "lokasi", "barang"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

async function buatMasterData() {
  const customer = await db.customer.create({ data: { kodecustomer: "C001", namacustomer: "Toko Maju" } });
  const lokasi = await db.lokasi.create({ data: { kodelokasi: "LOK01", namalokasi: "Toko Pusat" } });
  const barang = await db.barang.create({
    data: { kodebarang: "B001", namabarang: "Indomie Goreng", satuan: "PCS", hargabeli: 2500, hargajual: 3000 },
  });

  return { idcustomer: customer.idcustomer, idlokasi: lokasi.idlokasi, idbarang: barang.idbarang };
}

async function buatPenjualan(
  kodejual: string,
  tgltrans: Date,
  master: { idcustomer: number; idlokasi: number; idbarang: number },
  overrides: { status?: "S" | "D" } = {},
) {
  await db.jual.create({
    data: {
      kodejual,
      tgltrans,
      jenistransaksi: "POS",
      idcustomer    : master.idcustomer,
      idlokasi      : master.idlokasi,
      total         : 30000,
      diskon        : 0,
      ppn           : 0,
      grandtotal    : 30000,
      status        : overrides.status ?? "S",
      details: {
        create: [
          {
            urutan  : 1,
            idbarang: master.idbarang,
            qty     : 10,
            harga   : 3000,
            pakaippn: "TIDAK",
            diskon  : 0,
            ppn     : 0,
            subtotal: 30000,
          },
        ],
      },
    },
  });
}

describe("repository: filter", () => {
  it("tanpa argumen tanggal mengembalikan seluruh Penjualan S beserta detail, customer, dan lokasi ter-resolve", async () => {
    const master = await buatMasterData();
    await buatPenjualan("JL2608240001", new Date("2026-08-24"), master);

    const rows = await findBarisLaporanPenjualan(db);

    expect(rows).toHaveLength(1);
    expect(rows[0].namacustomer).toBe("Toko Maju");
    expect(rows[0].namalokasi).toBe("Toko Pusat");
    expect(rows[0].detail[0].namabarang).toBe("Indomie Goreng");
  });

  it("idlokasi menyaring transaksi ke Lokasi terpilih", async () => {
    const master = await buatMasterData();
    const lokasiLain = await db.lokasi.create({ data: { kodelokasi: "LOK02", namalokasi: "Gudang" } });
    await buatPenjualan("JL2608240001", new Date("2026-08-24"), master);
    await buatPenjualan("JL2608240002", new Date("2026-08-24"), { ...master, idlokasi: lokasiLain.idlokasi });

    const rows = await findBarisLaporanPenjualan(db, { idlokasi: [master.idlokasi] });

    expect(rows.map((row) => row.kodejual)).toEqual(["JL2608240001"]);
  });

  it("dari/sampai menyaring inklusif; transaksi tepat di tanggal batas ikut", async () => {
    const master = await buatMasterData();
    await buatPenjualan("JL2608010001", new Date("2026-08-01"), master);
    await buatPenjualan("JL2608150001", new Date("2026-08-15"), master);
    await buatPenjualan("JL2608310001", new Date("2026-08-31"), master);
    await buatPenjualan("JL2609010001", new Date("2026-09-01"), master);

    const rows = await findBarisLaporanPenjualan(db, {
      dari  : new Date("2026-08-01"),
      sampai: new Date("2026-08-31"),
    });

    expect(rows.map((row) => row.kodejual).sort()).toEqual(["JL2608010001", "JL2608150001", "JL2608310001"]);
  });

  it("Penjualan D dikecualikan kecuali flag termasukDibatalkan diberikan", async () => {
    const master = await buatMasterData();
    await buatPenjualan("JL2608240001", new Date("2026-08-24"), master, { status: "S" });
    await buatPenjualan("JL2608240002", new Date("2026-08-24"), master, { status: "D" });

    const default_ = await findBarisLaporanPenjualan(db);
    expect(default_.map((row) => row.kodejual)).toEqual(["JL2608240001"]);

    const semua = await findBarisLaporanPenjualan(db, { termasukDibatalkan: true });
    expect(semua.map((row) => row.kodejual).sort()).toEqual(["JL2608240001", "JL2608240002"]);
  });

  it("urutan hasil deterministik: tgltrans, kodejual, urutan", async () => {
    const master = await buatMasterData();
    await buatPenjualan("JL2608240002", new Date("2026-08-24"), master);
    await buatPenjualan("JL2608230001", new Date("2026-08-23"), master);
    await buatPenjualan("JL2608240001", new Date("2026-08-24"), master);

    const rows = await findBarisLaporanPenjualan(db);

    expect(rows.map((row) => row.kodejual)).toEqual(["JL2608230001", "JL2608240001", "JL2608240002"]);
  });
});
