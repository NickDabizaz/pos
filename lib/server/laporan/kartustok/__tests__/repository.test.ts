import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { insertKartuStok } from "@/lib/server/kartustok/repository";
import type { InsertKartuStokBaris, KepalaTransaksi } from "@/lib/server/kartustok/repository";
import { findLaporanKartuStok } from "@/lib/server/laporan/kartustok/repository";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["kartustok", "barang", "lokasi"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

let nomorBarang = 0;

async function buatBarang(nama = "Barang") {
  nomorBarang += 1;
  const barang = await db.barang.create({
    data: { kodebarang: `B${String(nomorBarang).padStart(4, "0")}`, namabarang: nama, satuan: "PCS", hargabeli: 1000, hargajual: 1500, pakaistok: true },
  });

  return barang.idbarang;
}

async function buatLokasi(kode: string) {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: kode, namalokasi: `Lokasi ${kode}` } });

  return lokasi.idlokasi;
}

function kepala(overrides: Partial<KepalaTransaksi> = {}): KepalaTransaksi {
  return {
    jenistransaksi: "PEMBELIAN",
    idtrans       : 1,
    kodetrans     : "PB2608240001",
    tgltrans      : new Date("2026-08-24"),
    idlokasi      : 1,
    ...overrides,
  };
}

function baris(overrides: Partial<InsertKartuStokBaris> = {}): InsertKartuStokBaris {
  return { idbarang: 1, jml: 10, mk: "M", catatan: "", ...overrides };
}

describe("repository laporan kartu stok", () => {
  it("Pembelian 10 lalu Penjualan 3 -> dua baris, saldo berjalan 10 lalu 7", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi }), [baris({ idbarang, jml: 10, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 2, kodetrans: "JL2608240001", tgltrans: new Date("2026-08-25") }), [
      baris({ idbarang, jml: 3, mk: "K" }),
    ]);

    const grup = await findLaporanKartuStok(db, { idbarang });

    expect(grup).toHaveLength(1);
    expect(grup[0].saldoAwal).toBe(0);
    expect(grup[0].baris.map((row) => row.saldoBerjalan)).toEqual([10, 7]);
    expect(grup[0].saldoAkhir).toBe(7);
  });

  it("mutasi sebelum `dari` masuk ke Saldo Awal, bukan baris", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi, tgltrans: new Date("2026-08-10") }), [baris({ idbarang, jml: 20, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi, idtrans: 2, kodetrans: "JL01", jenistransaksi: "PENJUALAN", tgltrans: new Date("2026-08-25") }), [
      baris({ idbarang, jml: 5, mk: "K" }),
    ]);

    const grup = await findLaporanKartuStok(db, { idbarang, dari: new Date("2026-08-20"), sampai: new Date("2026-08-31") });

    expect(grup[0].saldoAwal).toBe(20);
    expect(grup[0].baris).toHaveLength(1);
    expect(grup[0].saldoAkhir).toBe(15);
  });

  it("Barang tanpa mutasi periode dan Saldo Awal 0 tidak muncul", async () => {
    const idbarang = await buatBarang();

    const grup = await findLaporanKartuStok(db, { idbarang });

    expect(grup).toHaveLength(0);
  });

  it("Barang tanpa mutasi periode tapi Saldo Awal != 0 tetap muncul", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi, tgltrans: new Date("2026-08-01") }), [baris({ idbarang, jml: 8, mk: "M" })]);

    const grup = await findLaporanKartuStok(db, { idbarang, dari: new Date("2026-08-20"), sampai: new Date("2026-08-31") });

    expect(grup).toHaveLength(1);
    expect(grup[0].saldoAwal).toBe(8);
    expect(grup[0].baris).toHaveLength(0);
  });

  it("idlokasi menyaring mutasi (termasuk perhitungan Saldo Awal)", async () => {
    const [lokasiA, lokasiB] = [await buatLokasi("LOKA"), await buatLokasi("LOKB")];
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi: lokasiA }), [baris({ idbarang, jml: 10, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi: lokasiB, idtrans: 2, kodetrans: "PB2608240002" }), [baris({ idbarang, jml: 4, mk: "M" })]);

    const grup = await findLaporanKartuStok(db, { idbarang, idlokasi: [lokasiA] });

    expect(grup[0].saldoAkhir).toBe(10);
    expect(grup[0].baris).toHaveLength(1);
  });

  it("baris diurut tgltrans, kodetrans, urutan", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi, idtrans: 2, kodetrans: "PB2608240002", tgltrans: new Date("2026-08-25") }), [
      baris({ idbarang, jml: 2, mk: "M" }),
    ]);
    await insertKartuStok(db, kepala({ idlokasi, idtrans: 1, kodetrans: "PB2608240001", tgltrans: new Date("2026-08-24") }), [
      baris({ idbarang, jml: 1, mk: "M" }),
    ]);

    const grup = await findLaporanKartuStok(db, { idbarang });

    expect(grup[0].baris.map((row) => row.kodetrans)).toEqual(["PB2608240001", "PB2608240002"]);
  });
});
