import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { createLokasi, deleteLokasi, findLokasi, listLokasi, updateLokasi } from "@/lib/server/lokasi/service";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["jual", "customer", "lokasi"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

async function buatCustomer(kode = "CUST01") {
  return db.customer.create({ data: { kodecustomer: kode, namacustomer: "Customer Test" } });
}

async function buatJualUntukLokasi(idlokasi: number) {
  const customer = await buatCustomer();

  return db.jual.create({
    data: {
      kodejual      : "JL-TEST-0001",
      tgltrans      : new Date(),
      jenistransaksi: "TUNAI",
      idcustomer    : customer.idcustomer,
      idlokasi,
      total         : 0,
      diskon        : 0,
      ppn           : 0,
      grandtotal    : 0,
    },
  });
}

describe("Lokasi tersimpan dan bertahan lewat CRUD dasar", () => {
  it("createLokasi tersimpan dan langsung terbaca lewat findLokasi dengan kode yang dihasilkan", async () => {
    const created = await createLokasi(db, { namalokasi: "Toko Utama", keterangan: "Display etalase" });

    expect(created.kodelokasi).toBeTruthy();
    expect(created.namalokasi).toBe("Toko Utama");
    expect(created.keterangan).toBe("Display etalase");

    const found = await findLokasi(db, created.kodelokasi);
    expect(found).toEqual(created);
  });

  it("updateLokasi mengubah namalokasi dan perubahan terbaca pada findLokasi berikutnya", async () => {
    const created = await createLokasi(db, { namalokasi: "Toko Utama", keterangan: "Display etalase" });

    await updateLokasi(db, created.kodelokasi, { namalokasi: "Toko Utama (Renovasi)" });

    const found = await findLokasi(db, created.kodelokasi);
    expect(found?.namalokasi).toBe("Toko Utama (Renovasi)");
  });

  it("deleteLokasi menghapus Lokasi sehingga findLokasi dengan kode yang sama tidak lagi menemukannya", async () => {
    const created = await createLokasi(db, { namalokasi: "Toko Utama" });

    await deleteLokasi(db, created.kodelokasi);

    const found = await findLokasi(db, created.kodelokasi);
    expect(found).toBeNull();
  });

  it("listLokasi pada Database Perusahaan yang baru diprovisioning mengembalikan daftar kosong, bukan error", async () => {
    const list = await listLokasi(db);

    expect(list).toEqual([]);
  });

  it("listLokasi setelah tiga kali createLokasi mengembalikan tepat tiga Lokasi", async () => {
    await createLokasi(db, { namalokasi: "Lokasi 1" });
    await createLokasi(db, { namalokasi: "Lokasi 2" });
    await createLokasi(db, { namalokasi: "Lokasi 3" });

    const list = await listLokasi(db);
    expect(list).toHaveLength(3);
  });
});

describe("Kode Lokasi dibuat oleh generator Kode Dokumen sesuai Config", () => {
  it("createLokasi menghasilkan Kode Lokasi sesuai awalan dan panjangnomor dari Config modul Lokasi", async () => {
    const created = await createLokasi(db, { namalokasi: "Toko Utama" });

    expect(created.kodelokasi).toBe("L0001");
  });

  it("createLokasi kedua menghasilkan nomor urut lanjutan dari Kode Lokasi tertinggi yang sudah ada", async () => {
    const pertama = await createLokasi(db, { namalokasi: "Toko Utama" });
    const kedua = await createLokasi(db, { namalokasi: "Toko Cabang" });

    expect(pertama.kodelokasi).toBe("L0001");
    expect(kedua.kodelokasi).toBe("L0002");
  });

  it("createLokasi ditolak dengan pesan yang menyebut Config hilang saat Config Kode Dokumen modul Lokasi belum ada", async () => {
    await db.config.deleteMany({ where: { modul: "lokasi" } });

    try {
      await expect(createLokasi(db, { namalokasi: "Toko Utama" })).rejects.toThrow(/[Cc]onfig/);
      await expect(createLokasi(db, { namalokasi: "Toko Utama" })).rejects.toThrow(/tidak ditemukan/);

      const list = await listLokasi(db);
      expect(list).toHaveLength(0);
    } finally {
      await db.config.createMany({
        data: [
          { modul: "lokasi", config: "awalan", nilai: "L" },
          { modul: "lokasi", config: "pakaitanggal", nilai: "0" },
          { modul: "lokasi", config: "panjangnomor", nilai: "4" },
        ],
      });
    }
  });

  it("dua panggilan createLokasi bersamaan menghasilkan dua Kode Lokasi berbeda, tidak pernah kembar", async () => {
    const [a, b] = await Promise.all([
      createLokasi(db, { namalokasi: "Lokasi A" }),
      createLokasi(db, { namalokasi: "Lokasi B" }),
    ]);

    expect(a.kodelokasi).not.toBe(b.kodelokasi);
    expect([a.kodelokasi, b.kodelokasi].sort()).toEqual(["L0001", "L0002"]);
  });
});

describe("Kondisi gagal tertangani lengkap", () => {
  it("updateLokasi dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan, bukan membuat baris baru", async () => {
    await expect(updateLokasi(db, "L-TIDAK-ADA", { namalokasi: "Apa Saja" })).rejects.toThrow(/tidak ditemukan/);

    const list = await listLokasi(db);
    expect(list).toHaveLength(0);
  });

  it("deleteLokasi dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan", async () => {
    await expect(deleteLokasi(db, "L-TIDAK-ADA")).rejects.toThrow(/tidak ditemukan/);
  });

  it("findLokasi dengan kode yang tidak pernah ada mengembalikan tidak ditemukan, bukan melempar error", async () => {
    const found = await findLokasi(db, "L-TIDAK-ADA");
    expect(found).toBeNull();
  });

  it("createLokasi dengan namalokasi kosong ditolak dengan pesan input tidak sah, tidak tersimpan ke database", async () => {
    await expect(createLokasi(db, { namalokasi: "" })).rejects.toThrow(/tidak boleh kosong/);

    const list = await listLokasi(db);
    expect(list).toHaveLength(0);
  });

  it("deleteLokasi terhadap Lokasi yang sudah dirujuk oleh baris transaksi ditolak dengan pesan jelas, bukan error mentah database", async () => {
    const created = await createLokasi(db, { namalokasi: "Toko Dipakai" });
    await buatJualUntukLokasi(created.idlokasi);

    await expect(deleteLokasi(db, created.kodelokasi)).rejects.toThrow(/masih dipakai/);

    const masihAda = await findLokasi(db, created.kodelokasi);
    expect(masihAda).not.toBeNull();
  });
});

describe("Isolasi antar Perusahaan", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("Lokasi yang dibuat lewat koneksi Database Perusahaan A tidak muncul pada listLokasi Database Perusahaan B", async () => {
    await createLokasi(db, { namalokasi: "Lokasi Perusahaan A" });

    const listLain = await listLokasi(dbLain);
    expect(listLain).toHaveLength(0);
  });

  it("dua Perusahaan berbeda masing-masing berhasil memakai Kode Lokasi yang identik tanpa saling bentrok", async () => {
    const lokasiA = await createLokasi(db, { namalokasi: "Lokasi Perusahaan A" });
    const lokasiB = await createLokasi(dbLain, { namalokasi: "Lokasi Perusahaan B" });

    expect(lokasiA.kodelokasi).toBe("L0001");
    expect(lokasiB.kodelokasi).toBe("L0001");
  });
});
