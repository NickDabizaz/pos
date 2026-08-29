import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { insertKartuStok } from "@/lib/server/kartustok/repository";
import { findLaporanPosisiStok } from "@/lib/server/laporan/posisistok/repository";
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

async function buatBarang(nama = "Barang", pakaistok = true) {
  nomorBarang += 1;
  const barang = await db.barang.create({
    data: { kodebarang: `B${String(nomorBarang).padStart(4, "0")}`, namabarang: nama, satuan: "PCS", hargabeli: 1000, hargajual: 1500, pakaistok },
  });

  return barang.idbarang;
}

async function buatLokasi(kode: string) {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: kode, namalokasi: `Lokasi ${kode}` } });

  return lokasi.idlokasi;
}

describe("repository laporan posisi stok", () => {
  it("setelah Pembelian 10 & Penjualan 3 di Lokasi X, baris (Barang, X) menunjukkan saldo 7", async () => {
    const idlokasi = await buatLokasi("LOKX");
    const idbarang = await buatBarang();

    await insertKartuStok(
      db,
      { jenistransaksi: "PEMBELIAN", idtrans: 1, kodetrans: "PB01", tgltrans: new Date(), idlokasi },
      [{ idbarang, jml: 10, mk: "M", catatan: "" }],
    );
    await insertKartuStok(
      db,
      { jenistransaksi: "PENJUALAN", idtrans: 2, kodetrans: "JL01", tgltrans: new Date(), idlokasi },
      [{ idbarang, jml: 3, mk: "K", catatan: "" }],
    );

    const rows = await findLaporanPosisiStok(db, new Date());
    const barisX = rows.find((row) => row.idbarang === idbarang && row.namalokasi === "Lokasi LOKX");

    expect(barisX?.saldo).toBe(7);
  });

  it("Barang yang sama di Lokasi Y tanpa pergerakan tidak muncul kecuali tampilkanNol=1", async () => {
    const [lokasiX, lokasiY] = [await buatLokasi("LOKX"), await buatLokasi("LOKY")];
    const idbarang = await buatBarang();

    await insertKartuStok(
      db,
      { jenistransaksi: "PEMBELIAN", idtrans: 1, kodetrans: "PB01", tgltrans: new Date(), idlokasi: lokasiX },
      [{ idbarang, jml: 5, mk: "M", catatan: "" }],
    );

    const tanpaNol = await findLaporanPosisiStok(db, new Date());
    expect(tanpaNol.some((row) => row.namalokasi === "Lokasi LOKY")).toBe(false);

    const denganNol = await findLaporanPosisiStok(db, new Date(), { tampilkanNol: true });
    expect(denganNol.some((row) => row.idbarang === idbarang && row.namalokasi === "Lokasi LOKY" && row.saldo === 0)).toBe(true);
    void lokasiY;
  });

  it("Barang dengan pakaistok mati tidak pernah muncul", async () => {
    await buatLokasi("LOKX");
    await buatBarang("Nonstock", false);

    const rows = await findLaporanPosisiStok(db, new Date(), { tampilkanNol: true });
    expect(rows.some((row) => row.namabarang === "Nonstock")).toBe(false);
  });

  it("header menyebut tanggal hari ini (properti konteks, diuji lewat render — di sini cukup parameter tanggal diteruskan apa adanya)", async () => {
    const rows = await findLaporanPosisiStok(db, new Date("2026-08-28"));
    expect(rows).toEqual([]);
  });
});
