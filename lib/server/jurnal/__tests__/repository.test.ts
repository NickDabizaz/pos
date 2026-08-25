import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { InsertJurnalBaris } from "@/lib/server/jurnal/repository";
import { deleteJurnal, insertJurnal } from "@/lib/server/jurnal/repository";
import type { KepalaTransaksi } from "@/lib/server/kartustok/repository";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["kartustok", "jurnal", "barang", "lokasi"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

function buatKepala(overrides: Partial<KepalaTransaksi> = {}): KepalaTransaksi {
  const kepala: KepalaTransaksi = {
    jenistransaksi: "KAS MASUK",
    idtrans       : 1,
    kodetrans     : "KS2608240001",
    tgltrans      : new Date("2026-08-24"),
    idlokasi      : 1,
    ...overrides,
  };

  return kepala;
}

function buatBaris(overrides: Partial<InsertJurnalBaris> = {}): InsertJurnalBaris {
  const baris: InsertJurnalBaris = {
    saldo  : "DEBET",
    amount : 100000,
    catatan: "KAS MASUK SETORAN MODAL",
    ...overrides,
  };

  return baris;
}

describe("Baris Jurnal dicatat sekaligus banyak dalam satu panggilan", () => {
  it("dua baris jurnal (DEBET 100000 dan KREDIT 100000) tersimpan sekaligus dengan urutan 1 dan 2", async () => {
    await insertJurnal(db, buatKepala(), [
      buatBaris(),
      buatBaris({ saldo: "KREDIT", amount: 100000 }),
    ]);

    const rows = await db.jurnal.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.urutan)).toEqual([1, 2]);
    expect(rows.map((row) => row.saldo)).toEqual(["DEBET", "KREDIT"]);
  });

  it("saldo, amount, dan catatan tersimpan persis seperti yang dikirim", async () => {
    await insertJurnal(db, buatKepala(), [buatBaris({ saldo: "KREDIT", amount: 75000.5, catatan: "bayar supplier" })]);

    const row = await db.jurnal.findFirstOrThrow();
    expect(row.saldo).toBe("KREDIT");
    expect(row.amount.toString()).toBe("75000.5");
    expect(row.catatan).toBe("bayar supplier");
  });

  it("tgltrans dan idlokasi dari kepala ikut tersimpan di setiap baris jurnal", async () => {
    const kepala = buatKepala({ idlokasi: 42 });

    await insertJurnal(db, kepala, [buatBaris(), buatBaris({ saldo: "KREDIT" })]);

    const rows = await db.jurnal.findMany();
    expect(rows).toHaveLength(2);
    for (const row of rows) {
      expect(row.tgltrans.toISOString().slice(0, 10)).toBe("2026-08-24");
      expect(row.idlokasi).toBe(42);
    }
  });

  it("amount 999999999999.99 (batas atas Decimal(14,2)) tersimpan dan terbaca kembali utuh", async () => {
    await insertJurnal(db, buatKepala(), [buatBaris({ amount: 999999999999.99 })]);

    const row = await db.jurnal.findFirstOrThrow();
    expect(row.amount.toString()).toBe("999999999999.99");
  });

  it("array baris kosong tidak menyimpan baris apa pun dan tidak melempar error", async () => {
    await insertJurnal(db, buatKepala(), []);

    expect(await db.jurnal.count()).toBe(0);
  });
});

describe("Function tidak melakukan validasi apa pun pada Jurnal", () => {
  it("jurnal dengan satu baris DEBET 100000 tanpa baris KREDIT sama sekali tetap tersimpan — belum ada penjaga balance", async () => {
    await insertJurnal(db, buatKepala(), [buatBaris()]);

    const rows = await db.jurnal.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].saldo).toBe("DEBET");
    expect(rows[0].amount.toString()).toBe("100000");
  });
});

describe("Seluruh baris Jurnal milik satu transaksi dihapus sekali panggil", () => {
  it("deleteJurnal KAS KELUAR idtrans 3 menghapus seluruh baris jurnal Kas tersebut dan tidak menyentuh Kartu Stok mana pun", async () => {
    const kepalaKasKeluar = buatKepala({ jenistransaksi: "KAS KELUAR", idtrans: 3, kodetrans: "KS2608240003" });
    await insertJurnal(db, kepalaKasKeluar, [
      buatBaris({ catatan: "KAS KELUAR BAYAR LISTRIK" }),
      buatBaris({ saldo: "KREDIT", catatan: "KAS KELUAR BAYAR LISTRIK" }),
    ]);
    await db.kartustok.create({
      data: {
        jenistransaksi: "PENJUALAN",
        idtrans       : 3,
        urutan        : 1,
        kodetrans     : "JL2608240001",
        tgltrans      : new Date("2026-08-24"),
        idlokasi      : 1,
        idbarang      : (
          await db.barang.create({
            data: { kodebarang: "B0001", namabarang: "Barang", satuan: "PCS", hargabeli: 1000, hargajual: 1500 },
          })
        ).idbarang,
        jml    : 1,
        mk     : "K",
        catatan: "PENJUALAN BARANG KE TOKO MAJU",
      },
    });

    await deleteJurnal(db, "KAS KELUAR", 3);

    expect(await db.jurnal.count()).toBe(0);
    expect(await db.kartustok.count()).toBe(1);
  });
});

describe("insertJurnal dengan data referensi longgar tetap diterima", () => {
  it("insertJurnal dengan idlokasi tak dikenal tetap tersimpan", async () => {
    await insertJurnal(db, buatKepala({ idlokasi: 99999999 }), [buatBaris()]);

    const row = await db.jurnal.findFirstOrThrow();
    expect(row.idlokasi).toBe(99999999);
  });

  it("baris dengan idtrans tak dikenal tetap tersimpan — idtrans polimorfik tanpa foreign key", async () => {
    await insertJurnal(db, buatKepala({ idtrans: 999999 }), [buatBaris()]);

    const row = await db.jurnal.findFirstOrThrow();
    expect(row.idtrans).toBe(999999);
  });
});

describe("Isolasi antar Database Perusahaan untuk Jurnal", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("jurnal PEMBELIAN idtrans 1 ditulis di dua Perusahaan dengan amount berbeda; masing-masing membaca kembali nilainya sendiri", async () => {
    await insertJurnal(db, buatKepala({ jenistransaksi: "PEMBELIAN", kodetrans: "PB2608240001" }), [
      buatBaris({ amount: 150000 }),
    ]);
    await insertJurnal(dbLain, buatKepala({ jenistransaksi: "PEMBELIAN", kodetrans: "PB2608240001" }), [
      buatBaris({ amount: 250000 }),
    ]);

    const milikA = await db.jurnal.findFirstOrThrow();
    const milikB = await dbLain.jurnal.findFirstOrThrow();

    expect(milikA.amount.toString()).toBe("150000");
    expect(milikB.amount.toString()).toBe("250000");
  }, 30_000);
});
