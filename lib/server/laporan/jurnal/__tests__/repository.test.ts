import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { insertJurnal } from "@/lib/server/jurnal/repository";
import type { InsertJurnalBaris } from "@/lib/server/jurnal/repository";
import type { KepalaTransaksi } from "@/lib/server/kartustok/repository";
import { findBarisLaporanJurnal } from "@/lib/server/laporan/jurnal/repository";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["jurnal", "lokasi"];

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

function kepala(overrides: Partial<KepalaTransaksi> = {}): KepalaTransaksi {
  return {
    jenistransaksi: "KAS MASUK",
    idtrans       : 1,
    kodetrans     : "KS2608240001",
    tgltrans      : new Date("2026-08-24"),
    idlokasi      : 1,
    ...overrides,
  };
}

function baris(overrides: Partial<InsertJurnalBaris> = {}): InsertJurnalBaris {
  return { saldo: "DEBET", amount: 100000, catatan: "setoran modal", ...overrides };
}

describe("repository: filter", () => {
  it("tanpa argumen mengembalikan seluruh baris jurnal, diurut tgltrans, kodetrans, urutan", async () => {
    const idlokasi = await buatLokasi();
    await insertJurnal(db, kepala({ idlokasi, idtrans: 2, kodetrans: "KS2608250001", tgltrans: new Date("2026-08-25") }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi }), [baris()]);

    const rows = await findBarisLaporanJurnal(db);

    expect(rows.map((row) => row.kodetrans)).toEqual(["KS2608240001", "KS2608250001"]);
  });

  it('kodetrans = "JL2608" mencocokkan JL2608240001 dan JL2608240002 — contains, bukan equals', async () => {
    const idlokasi = await buatLokasi();
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 1, kodetrans: "JL2608240001" }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 2, kodetrans: "JL2608240002" }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PEMBELIAN", idtrans: 3, kodetrans: "PB2608240001" }), [baris()]);

    const rows = await findBarisLaporanJurnal(db, { kodetrans: "JL2608" });

    expect(rows.map((row) => row.kodetrans).sort()).toEqual(["JL2608240001", "JL2608240002"]);
  });

  it('kodetrans = "jl2608" (huruf kecil) tetap mencocokkan — case-insensitive', async () => {
    const idlokasi = await buatLokasi();
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 1, kodetrans: "JL2608240001" }), [baris()]);

    const rows = await findBarisLaporanJurnal(db, { kodetrans: "jl2608" });

    expect(rows).toHaveLength(1);
  });

  it("dari/sampai inklusif; baris tepat di tanggal batas ikut", async () => {
    const idlokasi = await buatLokasi();
    await insertJurnal(db, kepala({ idlokasi, tgltrans: new Date("2026-08-01") }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, idtrans: 2, kodetrans: "KS2608310001", tgltrans: new Date("2026-08-31") }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, idtrans: 3, kodetrans: "KS2609010001", tgltrans: new Date("2026-09-01") }), [baris()]);

    const rows = await findBarisLaporanJurnal(db, { dari: new Date("2026-08-01"), sampai: new Date("2026-08-31") });

    expect(rows.map((row) => row.kodetrans).sort()).toEqual(["KS2608240001", "KS2608310001"]);
  });

  it("kode + rentang tanggal dikombinasikan mempersempit ke irisan keduanya", async () => {
    const idlokasi = await buatLokasi();
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 1, kodetrans: "JL2608240001", tgltrans: new Date("2026-08-24") }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PENJUALAN", idtrans: 2, kodetrans: "JL2609240001", tgltrans: new Date("2026-09-24") }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, jenistransaksi: "PEMBELIAN", idtrans: 3, kodetrans: "PB2608240001", tgltrans: new Date("2026-08-24") }), [baris()]);

    const rows = await findBarisLaporanJurnal(db, { kodetrans: "JL", dari: new Date("2026-08-01"), sampai: new Date("2026-08-31") });

    expect(rows.map((row) => row.kodetrans)).toEqual(["JL2608240001"]);
  });

  it("baris milik transaksi berstatus D dikecualikan — pembatalan menghapus keras baris jurnal, jadi baris yang tersisa selalu milik transaksi hidup", async () => {
    const idlokasi = await buatLokasi();
    await insertJurnal(db, kepala({ idlokasi, idtrans: 1, kodetrans: "KS2608240001" }), [baris()]);
    await insertJurnal(db, kepala({ idlokasi, idtrans: 2, kodetrans: "KS2608240002" }), [baris()]);

    // Simulasikan pembatalan: deleteJurnal dipanggil dari service saat transaksi dibatalkan
    // (lihat lib/server/kas/service.ts) — baris jurnal-nya dihapus keras, tak ditandai status.
    const { deleteJurnal } = await import("@/lib/server/jurnal/repository");
    await deleteJurnal(db, "KAS MASUK", 2);

    const rows = await findBarisLaporanJurnal(db);

    expect(rows.map((row) => row.kodetrans)).toEqual(["KS2608240001"]);
  });
});
