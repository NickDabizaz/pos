import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { createBarang, deleteBarang, findBarang, listBarang, updateBarang } from "@/lib/server/barang/service";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["belidtl", "beli", "supplier", "lokasi", "barang"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

const inputBarang = {
  namabarang: "Beras 5kg",
  satuan    : "Karung",
  hargabeli : 55000,
  hargajual : 65000,
  pakaistok : true,
};

async function buatSupplier(kode = "SUP01") {
  return db.supplier.create({ data: { kodesupplier: kode, namasupplier: "Supplier Test" } });
}

async function buatLokasi(kode = "LOK01") {
  return db.lokasi.create({ data: { kodelokasi: kode, namalokasi: "Lokasi Test" } });
}

async function buatBelidtlUntukBarang(idbarang: number) {
  const supplier = await buatSupplier();
  const lokasi = await buatLokasi();

  const beli = await db.beli.create({
    data: {
      kodebeli  : "BL-TEST-0001",
      tgltrans  : new Date(),
      idsupplier: supplier.idsupplier,
      idlokasi  : lokasi.idlokasi,
      total     : 0,
      diskon    : 0,
      ppn       : 0,
      grandtotal: 0,
    },
  });

  return db.belidtl.create({
    data: {
      idbeli: beli.idbeli,
      urutan: 1,
      idbarang,
      qty     : 1,
      harga   : 1000,
      pakaippn: "0",
      diskon  : 0,
      ppn     : 0,
      subtotal: 1000,
    },
  });
}

describe("Barang tersimpan dan bertahan lewat CRUD dasar", () => {
  it("createBarang tersimpan dan langsung terbaca lewat findBarang dengan kode yang dihasilkan", async () => {
    const created = await createBarang(db, inputBarang);

    expect(created.kodebarang).toBeTruthy();
    expect(created.namabarang).toBe("Beras 5kg");
    expect(created.satuan).toBe("Karung");
    expect(created.hargabeli).toBe(55000);
    expect(created.hargajual).toBe(65000);
    expect(created.pakaistok).toBe(true);

    const found = await findBarang(db, created.kodebarang);
    expect(found).toEqual(created);
  });

  it("createBarang tanpa barcode tersimpan dengan barcode null, bukan error", async () => {
    const created = await createBarang(db, inputBarang);

    expect(created.barcode).toBeNull();
  });

  it("updateBarang mengubah hargajual dan perubahan terbaca pada findBarang berikutnya", async () => {
    const created = await createBarang(db, inputBarang);

    await updateBarang(db, created.kodebarang, { hargajual: 68000 });

    const found = await findBarang(db, created.kodebarang);
    expect(found?.hargajual).toBe(68000);
    expect(found?.hargabeli).toBe(55000);
  });

  it("deleteBarang menghapus Barang sehingga findBarang dengan kode yang sama tidak lagi menemukannya", async () => {
    const created = await createBarang(db, inputBarang);

    await deleteBarang(db, created.kodebarang);

    const found = await findBarang(db, created.kodebarang);
    expect(found).toBeNull();
  });

  it("listBarang pada Database Perusahaan yang baru diprovisioning mengembalikan daftar kosong, bukan error", async () => {
    const list = await listBarang(db);

    expect(list).toEqual([]);
  });

  it("listBarang setelah tiga kali createBarang mengembalikan tepat tiga Barang", async () => {
    await createBarang(db, { ...inputBarang, namabarang: "Barang 1" });
    await createBarang(db, { ...inputBarang, namabarang: "Barang 2" });
    await createBarang(db, { ...inputBarang, namabarang: "Barang 3" });

    const list = await listBarang(db);
    expect(list).toHaveLength(3);
  });
});

describe("Kode Barang dibuat oleh generator Kode Dokumen sesuai Config", () => {
  it("createBarang menghasilkan Kode Barang sesuai awalan dan panjangnomor dari Config modul barang", async () => {
    const created = await createBarang(db, inputBarang);

    expect(created.kodebarang).toBe("B0001");
  });

  it("createBarang kedua menghasilkan nomor urut lanjutan dari Kode Barang tertinggi yang sudah ada", async () => {
    const pertama = await createBarang(db, inputBarang);
    const kedua = await createBarang(db, inputBarang);

    expect(pertama.kodebarang).toBe("B0001");
    expect(kedua.kodebarang).toBe("B0002");
  });

  it("createBarang ditolak dengan pesan yang menyebut Config hilang saat Config Kode Dokumen modul barang belum ada", async () => {
    await db.config.deleteMany({ where: { modul: "barang" } });

    try {
      await expect(createBarang(db, inputBarang)).rejects.toThrow(/[Cc]onfig/);
      await expect(createBarang(db, inputBarang)).rejects.toThrow(/tidak ditemukan/);

      const list = await listBarang(db);
      expect(list).toHaveLength(0);
    } finally {
      await db.config.createMany({
        data: [
          { modul: "barang", config: "awalan", nilai: "B" },
          { modul: "barang", config: "pakaitanggal", nilai: "0" },
          { modul: "barang", config: "panjangnomor", nilai: "4" },
        ],
      });
    }
  });

  it("dua panggilan createBarang bersamaan menghasilkan dua Kode Barang berbeda, tidak pernah kembar", async () => {
    const [a, b] = await Promise.all([
      createBarang(db, { ...inputBarang, namabarang: "Barang A" }),
      createBarang(db, { ...inputBarang, namabarang: "Barang B" }),
    ]);

    expect(a.kodebarang).not.toBe(b.kodebarang);
    expect([a.kodebarang, b.kodebarang].sort()).toEqual(["B0001", "B0002"]);
  });
});

describe("Kondisi gagal tertangani lengkap untuk Barang", () => {
  it("updateBarang dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan, bukan membuat baris baru", async () => {
    await expect(updateBarang(db, "B-TIDAK-ADA", { namabarang: "Apa Saja" })).rejects.toThrow(/tidak ditemukan/);

    const list = await listBarang(db);
    expect(list).toHaveLength(0);
  });

  it("deleteBarang dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan", async () => {
    await expect(deleteBarang(db, "B-TIDAK-ADA")).rejects.toThrow(/tidak ditemukan/);
  });

  it("findBarang dengan kode yang tidak pernah ada mengembalikan tidak ditemukan, bukan melempar error", async () => {
    const found = await findBarang(db, "B-TIDAK-ADA");
    expect(found).toBeNull();
  });

  it("createBarang dengan namabarang kosong ditolak dengan pesan input tidak sah, tidak tersimpan ke database", async () => {
    await expect(createBarang(db, { ...inputBarang, namabarang: "" })).rejects.toThrow(/tidak boleh kosong/);

    const list = await listBarang(db);
    expect(list).toHaveLength(0);
  });

  it("deleteBarang terhadap Barang yang sudah dirujuk oleh baris belidtl ditolak dengan pesan jelas, bukan error mentah database", async () => {
    const created = await createBarang(db, inputBarang);
    await buatBelidtlUntukBarang(created.idbarang);

    await expect(deleteBarang(db, created.kodebarang)).rejects.toThrow(/masih dipakai/);

    const masihAda = await findBarang(db, created.kodebarang);
    expect(masihAda).not.toBeNull();
  });
});

describe("Isolasi antar Perusahaan untuk Barang", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("Barang yang dibuat lewat koneksi Database Perusahaan A tidak muncul pada listBarang Database Perusahaan B", async () => {
    await createBarang(db, inputBarang);

    const listLain = await listBarang(dbLain);
    expect(listLain).toHaveLength(0);
  });

  it("dua Perusahaan berbeda masing-masing berhasil memakai Kode Barang yang identik tanpa saling bentrok", async () => {
    const barangA = await createBarang(db, inputBarang);
    const barangB = await createBarang(dbLain, inputBarang);

    expect(barangA.kodebarang).toBe("B0001");
    expect(barangB.kodebarang).toBe("B0001");
  });
});
