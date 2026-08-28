import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { bacaSaldoStok } from "@/lib/server/kartustok/service";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["kartustok", "jurnal", "barang", "lokasi"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

let nomor = 0;

async function buatBarang(): Promise<{ idbarang: number; kodebarang: string }> {
  nomor += 1;
  const kodebarang = `B${String(nomor).padStart(4, "0")}`;
  const barang = await db.barang.create({
    data: { kodebarang, namabarang: `Barang ${nomor}`, satuan: "PCS", hargabeli: 1000, hargajual: 1500, pakaistok: true },
  });

  return { idbarang: barang.idbarang, kodebarang };
}

describe("bacaSaldoStok", () => {
  it("mengembalikan kode, nama, satuan, dan jumlah menurut sistem tiap Barang berstok", async () => {
    const lokasi = await db.lokasi.create({ data: { kodelokasi: "TOKO", namalokasi: "Toko" } });
    const { idbarang, kodebarang } = await buatBarang();
    await db.kartustok.create({
      data: {
        jenistransaksi: "PEMBELIAN",
        idtrans       : 1,
        urutan        : 1,
        kodetrans     : "PB1",
        tgltrans      : new Date("2026-08-01"),
        idlokasi      : lokasi.idlokasi,
        idbarang,
        jml           : 8,
        mk            : "M",
        catatan       : "SEED",
      },
    });

    const saldo = await bacaSaldoStok(db, "TOKO", new Date("2026-08-28"));

    expect(saldo).toEqual([
      expect.objectContaining({ kodebarang, namabarang: `Barang ${nomor}`, satuan: "PCS", jmlsistem: 8 }),
    ]);
  });

  it("Lokasi kosong ditolak", async () => {
    await expect(bacaSaldoStok(db, "", new Date())).rejects.toThrow(/Lokasi wajib diisi/);
  });

  it("Lokasi tidak ada ditolak", async () => {
    await expect(bacaSaldoStok(db, "GHOST", new Date())).rejects.toThrow(/tidak ditemukan/);
  });
});
