import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { deleteKartuStok, insertKartuStok } from "@/lib/server/kartustok/repository";
import type { InsertKartuStokBaris, KepalaTransaksi } from "@/lib/server/kartustok/repository";
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

let nomorBarang = 0;

async function buatBarang(): Promise<number> {
  nomorBarang += 1;

  const barang = await db.barang.create({
    data: {
      kodebarang: `B${String(nomorBarang).padStart(4, "0")}`,
      namabarang: `Barang ${nomorBarang}`,
      satuan    : "PCS",
      hargabeli : 1000,
      hargajual : 1500,
    },
  });

  return barang.idbarang;
}

async function buatLokasi(kode = "LOK01"): Promise<number> {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: kode, namalokasi: `Lokasi ${kode}` } });

  return lokasi.idlokasi;
}

function buatKepala(idlokasi: number, overrides: Partial<KepalaTransaksi> = {}): KepalaTransaksi {
  const kepala: KepalaTransaksi = {
    jenistransaksi: "PENJUALAN",
    idtrans       : 1,
    kodetrans     : "JL2608240001",
    tgltrans      : new Date("2026-08-24"),
    idlokasi,
    ...overrides,
  };

  return kepala;
}

function buatBaris(idbarang: number, overrides: Partial<InsertKartuStokBaris> = {}): InsertKartuStokBaris {
  const baris: InsertKartuStokBaris = {
    idbarang,
    jml    : 5,
    mk     : "K",
    catatan: "PENJUALAN BARANG KE TOKO MAJU",
    ...overrides,
  };

  return baris;
}

describe("Baris Kartu Stok dicatat sekaligus banyak dalam satu panggilan", () => {
  it("satu baris Kartu Stok tersimpan dengan urutan = 1", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [buatBaris(idbarang)]);

    const rows = await db.kartustok.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].urutan).toBe(1);
  });

  it("tiga baris dalam satu panggilan tersimpan dengan urutan 1, 2, 3 mengikuti urutan array — bukan urutan idbarang", async () => {
    const [idbarangC, idbarangA, idbarangB] = [await buatBarang(), await buatBarang(), await buatBarang()];

    await insertKartuStok(db, buatKepala(await buatLokasi()), [
      buatBaris(idbarangC),
      buatBaris(idbarangA),
      buatBaris(idbarangB),
    ]);

    const rows = await db.kartustok.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.urutan)).toEqual([1, 2, 3]);
    expect(rows.map((row) => row.idbarang)).toEqual([idbarangC, idbarangA, idbarangB]);
  });

  it("idbarang, jml, mk, dan catatan tersimpan persis seperti yang dikirim, tanpa diubah", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [
      buatBaris(idbarang, { jml: 12, mk: "M", catatan: "pembelian barang dari pt sumber pangan" }),
    ]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.idbarang).toBe(idbarang);
    expect(row.jml.toString()).toBe("12");
    expect(row.mk).toBe("M");
    expect(row.catatan).toBe("pembelian barang dari pt sumber pangan");
  });

  it("jml 1500.25 tersimpan dan terbaca kembali sebagai 1500.25, bukan 1500 maupun 1500.3", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [buatBaris(idbarang, { jml: 1500.25 })]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.jml.toString()).toBe("1500.25");
  });

  it("array baris kosong tidak menyimpan baris apa pun dan tidak melempar error", async () => {
    await insertKartuStok(db, buatKepala(await buatLokasi()), []);

    expect(await db.kartustok.count()).toBe(0);
  });

  it("dua panggilan untuk transaksi berbeda sama-sama mulai dari urutan = 1", async () => {
    const idlokasi = await buatLokasi();
    const [idbarangPenjualan, idbarangPembelian] = [await buatBarang(), await buatBarang()];

    await insertKartuStok(db, buatKepala(idlokasi), [buatBaris(idbarangPenjualan)]);
    await insertKartuStok(db, buatKepala(idlokasi, { jenistransaksi: "PEMBELIAN", kodetrans: "PB2608240001" }), [
      buatBaris(idbarangPembelian),
    ]);

    const penjualan = await db.kartustok.findFirstOrThrow({ where: { jenistransaksi: "PENJUALAN" } });
    const pembelian = await db.kartustok.findFirstOrThrow({ where: { jenistransaksi: "PEMBELIAN" } });
    expect(penjualan.urutan).toBe(1);
    expect(pembelian.urutan).toBe(1);
  });
});

describe("Seluruh baris membawa identitas transaksi dari kepala", () => {
  it("jenistransaksi, idtrans, kodetrans JL2608240001, tgltrans 2026-08-24, dan idlokasi tersimpan sama persis di ketiga baris", async () => {
    const idlokasi = await buatLokasi();
    const [a, b, c] = [await buatBarang(), await buatBarang(), await buatBarang()];

    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 7 }), [buatBaris(a), buatBaris(b), buatBaris(c)]);

    const rows = await db.kartustok.findMany();
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.jenistransaksi).toBe("PENJUALAN");
      expect(row.idtrans).toBe(7);
      expect(row.kodetrans).toBe("JL2608240001");
      expect(row.tgltrans.toISOString().slice(0, 10)).toBe("2026-08-24");
      expect(row.idlokasi).toBe(idlokasi);
    }
  });

  it("tgltrans 2026-08-24 terbaca kembali sebagai tanggal yang sama, tanpa bergeser sehari karena zona waktu", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [buatBaris(idbarang)]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.tgltrans.toISOString().slice(0, 10)).toBe("2026-08-24");
  });

  it("Kartu Stok satu Barang di dua Lokasi berbeda bisa dijumlahkan terpisah per idlokasi tanpa menyentuh tabel jual", async () => {
    const [lokasiA, lokasiB] = [await buatLokasi("LOKA"), await buatLokasi("LOKB")];
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(lokasiA), [buatBaris(idbarang, { jml: 10 })]);
    await insertKartuStok(db, buatKepala(lokasiB, { idtrans: 2, kodetrans: "JL2608240002" }), [
      buatBaris(idbarang, { jml: 4 }),
    ]);

    const perLokasi = await db.kartustok.groupBy({
      by     : ["idlokasi"],
      _sum   : { jml: true },
      where  : { idbarang },
      orderBy: { idlokasi: "asc" },
    });
    expect(perLokasi.map((group) => group._sum.jml?.toString())).toEqual(["10", "4"]);
    expect(await db.jual.count()).toBe(0);
  });

  it("pergerakan satu Barang antara 2026-08-01 dan 2026-08-31 bisa disaring lewat tgltrans tanpa join ke tabel induk", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(idlokasi, { tgltrans: new Date("2026-07-15") }), [buatBaris(idbarang, { jml: 100 })]);
    await insertKartuStok(
      db,
      buatKepala(idlokasi, { idtrans: 2, kodetrans: "JL2608010001", tgltrans: new Date("2026-08-05") }),
      [buatBaris(idbarang, { jml: 20 })],
    );

    const agustus = await db.kartustok.findMany({
      where: { idbarang, tgltrans: { gte: new Date("2026-08-01"), lte: new Date("2026-08-31") } },
    });
    expect(agustus).toHaveLength(1);
    expect(agustus[0].jml.toString()).toBe("20");
  });
});

describe("Satu panggilan insert berhasil seluruhnya atau gagal seluruhnya", () => {
  it("panggilan 250 baris tersimpan seluruhnya, urutan 1..250 tanpa lompatan", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const baris = Array.from({ length: 250 }, () => buatBaris(idbarang));

    await insertKartuStok(db, buatKepala(idlokasi), baris);

    const rows = await db.kartustok.findMany({ orderBy: { urutan: "asc" } });
    expect(rows).toHaveLength(250);
    expect(rows.map((row) => row.urutan)).toEqual(Array.from({ length: 250 }, (_, index) => index + 1));
  });

  it("panggilan 250 baris yang baris ke-200-nya memakai idbarang tak dikenal tidak menyisakan satu baris pun", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const baris = Array.from({ length: 250 }, (_, index) =>
      buatBaris(index === 199 ? 99999999 : idbarang),
    );

    await expect(insertKartuStok(db, buatKepala(idlokasi), baris)).rejects.toThrow();

    expect(await db.kartustok.count()).toBe(0);
  });

  it("panggilan tiga baris yang baris ketiganya memakai idbarang tak dikenal tidak menyisakan baris pertama maupun kedua", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();

    await expect(
      insertKartuStok(db, buatKepala(idlokasi), [buatBaris(idbarang), buatBaris(idbarang), buatBaris(99999999)]),
    ).rejects.toThrow();

    expect(await db.kartustok.count()).toBe(0);
  });
});

describe("Seluruh baris milik satu transaksi dihapus sekali panggil", () => {
  it("tiga baris Kartu Stok PENJUALAN idtrans 7 hilang seluruhnya setelah satu panggilan deleteKartuStok", async () => {
    const idlokasi = await buatLokasi();
    const [a, b, c] = [await buatBarang(), await buatBarang(), await buatBarang()];
    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 7 }), [buatBaris(a), buatBaris(b), buatBaris(c)]);

    await deleteKartuStok(db, "PENJUALAN", 7);

    expect(await db.kartustok.count()).toBe(0);
  });

  it("baris Kartu Stok PENJUALAN idtrans 8 tetap utuh saat idtrans 7 dihapus", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 7 }), [buatBaris(idbarang)]);
    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 8, kodetrans: "JL2608240002" }), [buatBaris(idbarang)]);

    await deleteKartuStok(db, "PENJUALAN", 7);

    const tersisa = await db.kartustok.findMany();
    expect(tersisa).toHaveLength(1);
    expect(tersisa[0].idtrans).toBe(8);
  });

  it("baris Kartu Stok PEMBELIAN idtrans 7 tetap utuh saat PENJUALAN idtrans 7 dihapus — jenistransaksi ikut menentukan sasaran", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 7 }), [buatBaris(idbarang)]);
    await insertKartuStok(
      db,
      buatKepala(idlokasi, { jenistransaksi: "PEMBELIAN", idtrans: 7, kodetrans: "PB2608240001" }),
      [buatBaris(idbarang, { mk: "M" })],
    );

    await deleteKartuStok(db, "PENJUALAN", 7);

    const tersisa = await db.kartustok.findMany();
    expect(tersisa).toHaveLength(1);
    expect(tersisa[0].jenistransaksi).toBe("PEMBELIAN");
  });

  it("menghapus transaksi yang tidak punya baris sama sekali tidak melempar error dan tidak menyentuh baris lain", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 7 }), [buatBaris(idbarang)]);

    await expect(deleteKartuStok(db, "POS", 12345)).resolves.toBeUndefined();

    expect(await db.kartustok.count()).toBe(1);
  });

  it("menghapus dua kali berturut-turut untuk transaksi yang sama tidak melempar error pada panggilan kedua", async () => {
    await deleteKartuStok(db, "PENJUALAN", 7);

    await expect(deleteKartuStok(db, "PENJUALAN", 7)).resolves.toBeUndefined();
  });
});

describe("Edit transaksi berarti delete lalu insert lagi", () => {
  it("insertKartuStok kedua untuk PENJUALAN idtrans 7 yang barisnya masih ada ditolak database sebagai duplikat kunci, bukan menimpa", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const kepala = buatKepala(idlokasi, { idtrans: 7 });
    await insertKartuStok(db, kepala, [buatBaris(idbarang)]);

    await expect(insertKartuStok(db, kepala, [buatBaris(idbarang, { jml: 99 })])).rejects.toThrow();
  });

  it("panggilan kedua yang ditolak tidak mengubah satu pun baris lama — jumlah baris, jml, dan catatan tetap seperti sebelumnya", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const kepala = buatKepala(idlokasi, { idtrans: 7 });
    await insertKartuStok(db, kepala, [buatBaris(idbarang)]);

    await expect(insertKartuStok(db, kepala, [buatBaris(idbarang, { jml: 99, catatan: "BARU" })])).rejects.toThrow();

    const rows = await db.kartustok.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0].jml.toString()).toBe("5");
    expect(rows[0].catatan).toBe("PENJUALAN BARANG KE TOKO MAJU");
  });

  it("setelah deleteKartuStok, insert dua baris baru untuk transaksi yang sama berhasil dan urutan kembali mulai dari 1", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const kepala = buatKepala(idlokasi, { idtrans: 7 });
    await insertKartuStok(db, kepala, [buatBaris(idbarang)]);
    await deleteKartuStok(db, "PENJUALAN", 7);

    await insertKartuStok(db, kepala, [buatBaris(idbarang, { jml: 2 }), buatBaris(idbarang, { jml: 3 })]);

    const rows = await db.kartustok.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.urutan)).toEqual([1, 2]);
  });

  it("Kartu Stok hasil insert ulang tidak menyisakan baris ketiga dari versi lama yang barisnya lebih banyak", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const kepala = buatKepala(idlokasi, { idtrans: 7 });
    await insertKartuStok(db, kepala, [buatBaris(idbarang), buatBaris(idbarang), buatBaris(idbarang)]);
    await deleteKartuStok(db, "PENJUALAN", 7);
    await insertKartuStok(db, kepala, [buatBaris(idbarang), buatBaris(idbarang)]);

    expect(await db.kartustok.count()).toBe(2);
  });
});

describe("Function tidak melakukan validasi apa pun", () => {
  it("jml bernilai 0 tersimpan tanpa penolakan", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [buatBaris(idbarang, { jml: 0 })]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.jml.toString()).toBe("0");
  });

  it("jml bernilai -5 tersimpan tanpa penolakan", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [buatBaris(idbarang, { jml: -5 })]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.jml.toString()).toBe("-5");
  });

  it("mk bernilai M maupun K sama-sama tersimpan apa adanya, tidak ada yang diturunkan dari jenistransaksi", async () => {
    const idlokasi = await buatLokasi();
    const [masuk, keluar] = [await buatBarang(), await buatBarang()];

    await insertKartuStok(db, buatKepala(idlokasi), [
      buatBaris(masuk, { mk: "M" }),
      buatBaris(keluar, { mk: "K" }),
    ]);

    const rows = await db.kartustok.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.mk)).toEqual(["M", "K"]);
  });

  it("catatan string kosong tersimpan apa adanya, function tidak merakit catatan sendiri", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(await buatLokasi()), [buatBaris(idbarang, { catatan: "" })]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.catatan).toBe("");
  });
});

describe("Baris Kartu Stok terikat pada Barang yang sungguh ada, Lokasi tidak", () => {
  it("insertKartuStok dengan idbarang yang tidak ada di tabel barang ditolak database", async () => {
    await buatLokasi();

    await expect(insertKartuStok(db, buatKepala(1), [buatBaris(99999999)])).rejects.toThrow();
  });

  it("insertKartuStok dengan idlokasi yang tidak ada di tabel lokasi tetap tersimpan — idlokasi sengaja tanpa foreign key", async () => {
    const idbarang = await buatBarang();

    await insertKartuStok(db, buatKepala(99999999), [buatBaris(idbarang)]);

    const row = await db.kartustok.findFirstOrThrow();
    expect(row.idlokasi).toBe(99999999);
  });
});

describe("Race pada composite primary key", () => {
  it("dua panggilan insertKartuStok bersamaan untuk PENJUALAN idtrans 9 yang sama: satu berhasil penuh, satu ditolak, tabel tidak berisi dua baris berkunci sama", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const kepala = buatKepala(idlokasi, { idtrans: 9 });

    const results = await Promise.allSettled([
      insertKartuStok(db, kepala, [buatBaris(idbarang), buatBaris(idbarang), buatBaris(idbarang)]),
      insertKartuStok(db, kepala, [buatBaris(idbarang), buatBaris(idbarang), buatBaris(idbarang)]),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await db.kartustok.count({ where: { jenistransaksi: "PENJUALAN", idtrans: 9 } })).toBe(3);
  });

  it("dua panggilan insertKartuStok bersamaan untuk idtrans berbeda (9 dan 10) sama-sama berhasil penuh", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();

    const results = await Promise.allSettled([
      insertKartuStok(db, buatKepala(idlokasi, { idtrans: 9 }), [
        buatBaris(idbarang),
        buatBaris(idbarang),
        buatBaris(idbarang),
      ]),
      insertKartuStok(db, buatKepala(idlokasi, { idtrans: 10, kodetrans: "JL2608240010" }), [
        buatBaris(idbarang),
        buatBaris(idbarang),
        buatBaris(idbarang),
      ]),
    ]);

    expect(results.filter((result) => result.status === "rejected")).toHaveLength(0);
    expect(await db.kartustok.count()).toBe(6);
  });

  it("insertKartuStok dan deleteKartuStok untuk PENJUALAN idtrans 9 bersamaan berakhir utuh — semua baris ada, atau tidak ada sama sekali", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    const kepala = buatKepala(idlokasi, { idtrans: 9 });

    await Promise.allSettled([
      insertKartuStok(db, kepala, [buatBaris(idbarang), buatBaris(idbarang), buatBaris(idbarang)]),
      deleteKartuStok(db, "PENJUALAN", 9),
    ]);

    const jumlah = await db.kartustok.count({ where: { jenistransaksi: "PENJUALAN", idtrans: 9 } });
    expect([0, 3]).toContain(jumlah);
  });

  it("dua panggilan deleteKartuStok bersamaan untuk transaksi yang sama: keduanya selesai tanpa error dan barisnya habis", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    await insertKartuStok(db, buatKepala(idlokasi, { idtrans: 9 }), [buatBaris(idbarang), buatBaris(idbarang)]);

    const results = await Promise.allSettled([
      deleteKartuStok(db, "PENJUALAN", 9),
      deleteKartuStok(db, "PENJUALAN", 9),
    ]);

    expect(results.filter((result) => result.status === "rejected")).toHaveLength(0);
    expect(await db.kartustok.count()).toBe(0);
  });
});

describe("Isolasi antar Database Perusahaan", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("Kartu Stok PENJUALAN idtrans 1 yang ditulis di Perusahaan A tidak terlihat sama sekali dari Perusahaan B", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    await insertKartuStok(db, buatKepala(idlokasi), [buatBaris(idbarang)]);

    expect(await dbLain.kartustok.count()).toBe(0);
  }, 30_000);

  it("deleteKartuStok PENJUALAN idtrans 1 di Perusahaan A tidak menghapus baris milik Perusahaan B", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang();
    await insertKartuStok(db, buatKepala(idlokasi), [buatBaris(idbarang)]);

    const lokasiLain = await dbLain.lokasi.create({ data: { kodelokasi: "LOKB", namalokasi: "Lokasi B" } });
    const barangLain = await dbLain.barang.create({
      data: {
        kodebarang: "B-LAIN",
        namabarang: "Barang Perusahaan B",
        satuan    : "PCS",
        hargabeli : 1000,
        hargajual : 1500,
      },
    });
    await insertKartuStok(dbLain, buatKepala(lokasiLain.idlokasi), [buatBaris(barangLain.idbarang)]);

    await deleteKartuStok(db, "PENJUALAN", 1);

    expect(await db.kartustok.count()).toBe(0);
    expect(await dbLain.kartustok.count()).toBe(1);
    expect(await dbLain.kartustok.findFirstOrThrow().then((row) => row.jml.toString())).toBe("5");
  }, 30_000);
});
