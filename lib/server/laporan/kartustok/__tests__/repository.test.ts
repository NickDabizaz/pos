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
  it("Pembelian 10 lalu Penjualan 3 atas Barang yang sama -> dua baris, saldo 10 lalu 7", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi }), [baris({ idbarang, jml: 10, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 2, kodetrans: "JL2608240001", tgltrans: new Date("2026-08-25") }), [
      baris({ idbarang, jml: 3, mk: "K" }),
    ]);

    const grup = await findLaporanKartuStok(db, { idbarang });

    expect(grup).toHaveLength(1);
    expect(grup[0].baris.map((row) => row.saldoBerjalan)).toEqual([10, 7]);
  });

  it("saldo berjalan reset ke nol di awal tiap Barang saat menampilkan semua Barang", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const [barangA, barangB] = [await buatBarang("A"), await buatBarang("B")];

    await insertKartuStok(db, kepala({ idlokasi }), [baris({ idbarang: barangA, jml: 50, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi, idtrans: 2, kodetrans: "PB2608240002" }), [baris({ idbarang: barangB, jml: 5, mk: "M" })]);

    const grup = await findLaporanKartuStok(db);
    const grupB = grup.find((g) => g.idbarang === barangB);

    expect(grupB?.baris[0].saldoBerjalan).toBe(5);
  });

  it("mk M mengisi kolom masuk & mengosongkan keluar; sebaliknya untuk K", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi }), [baris({ idbarang, jml: 10, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 2, kodetrans: "JL01", tgltrans: new Date("2026-08-25") }), [
      baris({ idbarang, jml: 4, mk: "K" }),
    ]);

    const grup = await findLaporanKartuStok(db, { idbarang });
    const [masuk, keluar] = grup[0].baris;

    expect(masuk.masuk).toBe(10);
    expect(masuk.keluar).toBeNull();
    expect(keluar.masuk).toBeNull();
    expect(keluar.keluar).toBe(4);
  });

  it("mutasi di dua Lokasi berbeda tetap satu deret saldo berjalan; kolom lokasi berubah per baris", async () => {
    const [lokasiA, lokasiB] = [await buatLokasi("LOKA"), await buatLokasi("LOKB")];
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi: lokasiA }), [baris({ idbarang, jml: 10, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi: lokasiB, idtrans: 2, kodetrans: "PB2608240002", tgltrans: new Date("2026-08-25") }), [
      baris({ idbarang, jml: 4, mk: "M" }),
    ]);

    const grup = await findLaporanKartuStok(db, { idbarang });

    expect(grup[0].baris.map((row) => row.saldoBerjalan)).toEqual([10, 14]);
    expect(grup[0].baris.map((row) => row.namalokasi)).toEqual(["Lokasi LOKA", "Lokasi LOKB"]);
  });

  it("idbarang yang tak punya pergerakan -> dokumen HTML sah dengan pesan sopan, bukan error (grup ada, baris kosong)", async () => {
    const idbarang = await buatBarang();

    const grup = await findLaporanKartuStok(db, { idbarang });

    expect(grup).toHaveLength(1);
    expect(grup[0].baris).toHaveLength(0);
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

  it("saldo akhir tiap Barang sama dengan jumlah hitungSaldoStok seluruh Lokasi untuk Barang itu", async () => {
    const { hitungSaldoStok } = await import("@/lib/server/kartustok/repository");
    const [lokasiA, lokasiB] = [await buatLokasi("LOKA"), await buatLokasi("LOKB")];
    const idbarang = await buatBarang();

    await insertKartuStok(db, kepala({ idlokasi: lokasiA }), [baris({ idbarang, jml: 10, mk: "M" })]);
    await insertKartuStok(db, kepala({ idlokasi: lokasiB, idtrans: 2, kodetrans: "PB2608240002" }), [baris({ idbarang, jml: 4, mk: "M" })]);

    const grup = await findLaporanKartuStok(db, { idbarang });
    const saldoAkhir = grup[0].baris.at(-1)?.saldoBerjalan ?? 0;

    const hari = new Date();
    const saldoA = await hitungSaldoStok(db, lokasiA, hari);
    const saldoB = await hitungSaldoStok(db, lokasiB, hari);
    const totalGlobal =
      (saldoA.find((item) => item.idbarang === idbarang)?.jmlsistem ?? 0) +
      (saldoB.find((item) => item.idbarang === idbarang)?.jmlsistem ?? 0);

    expect(saldoAkhir).toBe(totalGlobal);
  });
});
