import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { createSupplier, deleteSupplier, findSupplier, listSupplier, updateSupplier } from "@/lib/server/supplier/service";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["beli", "lokasi", "supplier"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

const inputSupplier = {
  namasupplier: "CV Makmur Jaya",
  kontakperson: "Siti",
  telepon     : "021555000",
  email       : "cv@example.com",
  alamat      : "Jl. Industri 9",
};

async function buatLokasi(kode = "LOK01") {
  return db.lokasi.create({ data: { kodelokasi: kode, namalokasi: "Lokasi Test" } });
}

async function buatBeliUntukSupplier(idsupplier: number) {
  const lokasi = await buatLokasi();

  return db.beli.create({
    data: {
      kodebeli  : "BL-TEST-0001",
      tgltrans  : new Date(),
      idsupplier,
      idlokasi  : lokasi.idlokasi,
      total     : 0,
      diskon    : 0,
      ppn       : 0,
      grandtotal: 0,
    },
  });
}

describe("Supplier tersimpan dan bertahan lewat CRUD dasar", () => {
  it("createSupplier tersimpan dan langsung terbaca lewat findSupplier dengan kode yang dihasilkan", async () => {
    const created = await createSupplier(db, inputSupplier);

    expect(created.kodesupplier).toBeTruthy();
    expect(created.namasupplier).toBe("CV Makmur Jaya");
    expect(created.kontakperson).toBe("Siti");
    expect(created.telepon).toBe("021555000");
    expect(created.email).toBe("cv@example.com");
    expect(created.alamat).toBe("Jl. Industri 9");

    const found = await findSupplier(db, created.kodesupplier);
    expect(found).toEqual(created);
  });

  it("updateSupplier mengubah kontakperson dan perubahan terbaca pada findSupplier berikutnya", async () => {
    const created = await createSupplier(db, inputSupplier);

    await updateSupplier(db, created.kodesupplier, { kontakperson: "Siti Aminah" });

    const found = await findSupplier(db, created.kodesupplier);
    expect(found?.kontakperson).toBe("Siti Aminah");
  });

  it("deleteSupplier menghapus Supplier sehingga findSupplier dengan kode yang sama tidak lagi menemukannya", async () => {
    const created = await createSupplier(db, inputSupplier);

    await deleteSupplier(db, created.kodesupplier);

    const found = await findSupplier(db, created.kodesupplier);
    expect(found).toBeNull();
  });

  it("listSupplier pada Database Perusahaan yang baru diprovisioning mengembalikan daftar kosong, bukan error", async () => {
    const list = await listSupplier(db);

    expect(list).toEqual([]);
  });

  it("listSupplier setelah tiga kali createSupplier mengembalikan tepat tiga Supplier", async () => {
    await createSupplier(db, { ...inputSupplier, namasupplier: "Supplier 1" });
    await createSupplier(db, { ...inputSupplier, namasupplier: "Supplier 2" });
    await createSupplier(db, { ...inputSupplier, namasupplier: "Supplier 3" });

    const list = await listSupplier(db);
    expect(list).toHaveLength(3);
  });
});

describe("Kode Supplier dibuat oleh generator Kode Dokumen sesuai Config", () => {
  it("createSupplier menghasilkan Kode Supplier sesuai awalan dan panjangnomor dari Config modul supplier", async () => {
    const created = await createSupplier(db, inputSupplier);

    expect(created.kodesupplier).toBe("S0001");
  });

  it("createSupplier kedua menghasilkan nomor urut lanjutan dari Kode Supplier tertinggi yang sudah ada", async () => {
    const pertama = await createSupplier(db, inputSupplier);
    const kedua = await createSupplier(db, inputSupplier);

    expect(pertama.kodesupplier).toBe("S0001");
    expect(kedua.kodesupplier).toBe("S0002");
  });

  it("createSupplier ditolak dengan pesan yang menyebut Config hilang saat Config Kode Dokumen modul supplier belum ada", async () => {
    await db.config.deleteMany({ where: { modul: "SUPPLIER" } });

    try {
      await expect(createSupplier(db, inputSupplier)).rejects.toThrow(/[Cc]onfig/);
      await expect(createSupplier(db, inputSupplier)).rejects.toThrow(/tidak ditemukan/);

      const list = await listSupplier(db);
      expect(list).toHaveLength(0);
    } finally {
      await db.config.createMany({
        data: [
          { modul: "SUPPLIER", config: "AWALAN", nilai: "S" },
          { modul: "SUPPLIER", config: "PAKAITANGGAL", nilai: "0" },
          { modul: "SUPPLIER", config: "PANJANGNOMOR", nilai: "4" },
        ],
      });
    }
  });

  it("dua panggilan createSupplier bersamaan menghasilkan dua Kode Supplier berbeda, tidak pernah kembar", async () => {
    const [a, b] = await Promise.all([
      createSupplier(db, { ...inputSupplier, namasupplier: "Supplier A" }),
      createSupplier(db, { ...inputSupplier, namasupplier: "Supplier B" }),
    ]);

    expect(a.kodesupplier).not.toBe(b.kodesupplier);
    expect([a.kodesupplier, b.kodesupplier].sort()).toEqual(["S0001", "S0002"]);
  });
});

describe("Kondisi gagal tertangani lengkap untuk Supplier", () => {
  it("updateSupplier dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan, bukan membuat baris baru", async () => {
    await expect(updateSupplier(db, "S-TIDAK-ADA", { namasupplier: "Apa Saja" })).rejects.toThrow(/tidak ditemukan/);

    const list = await listSupplier(db);
    expect(list).toHaveLength(0);
  });

  it("deleteSupplier dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan", async () => {
    await expect(deleteSupplier(db, "S-TIDAK-ADA")).rejects.toThrow(/tidak ditemukan/);
  });

  it("findSupplier dengan kode yang tidak pernah ada mengembalikan tidak ditemukan, bukan melempar error", async () => {
    const found = await findSupplier(db, "S-TIDAK-ADA");
    expect(found).toBeNull();
  });

  it("createSupplier dengan namasupplier kosong ditolak dengan pesan input tidak sah, tidak tersimpan ke database", async () => {
    await expect(createSupplier(db, { ...inputSupplier, namasupplier: "" })).rejects.toThrow(/tidak boleh kosong/);

    const list = await listSupplier(db);
    expect(list).toHaveLength(0);
  });

  it("deleteSupplier terhadap Supplier yang sudah dirujuk oleh baris beli ditolak dengan pesan jelas, bukan error mentah database", async () => {
    const created = await createSupplier(db, inputSupplier);
    await buatBeliUntukSupplier(created.idsupplier);

    await expect(deleteSupplier(db, created.kodesupplier)).rejects.toThrow(/masih dipakai/);

    const masihAda = await findSupplier(db, created.kodesupplier);
    expect(masihAda).not.toBeNull();
  });
});

describe("Isolasi antar Perusahaan untuk Supplier", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("Supplier yang dibuat lewat koneksi Database Perusahaan A tidak muncul pada listSupplier Database Perusahaan B", async () => {
    await createSupplier(db, inputSupplier);

    const listLain = await listSupplier(dbLain);
    expect(listLain).toHaveLength(0);
  });

  it("dua Perusahaan berbeda masing-masing berhasil memakai Kode Supplier yang identik tanpa saling bentrok", async () => {
    const supplierA = await createSupplier(db, inputSupplier);
    const supplierB = await createSupplier(dbLain, inputSupplier);

    expect(supplierA.kodesupplier).toBe("S0001");
    expect(supplierB.kodesupplier).toBe("S0001");
  });
});
