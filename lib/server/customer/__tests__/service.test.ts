import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { createCustomer, deleteCustomer, findCustomer, listCustomer, updateCustomer } from "@/lib/server/customer/service";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["jual", "lokasi", "customer"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

const inputCustomer = {
  namacustomer: "Budi Santoso",
  telepon     : "081234567890",
  email       : "budi@example.com",
  alamat      : "Jl. Merdeka 1",
};

async function buatLokasi(kode = "LOK01") {
  return db.lokasi.create({ data: { kodelokasi: kode, namalokasi: "Lokasi Test" } });
}

async function buatJualUntukCustomer(idcustomer: number) {
  const lokasi = await buatLokasi();

  return db.jual.create({
    data: {
      kodejual      : "JL-TEST-0001",
      tgltrans      : new Date(),
      jenistransaksi: "TUNAI",
      idcustomer,
      idlokasi      : lokasi.idlokasi,
      total         : 0,
      diskon        : 0,
      ppn           : 0,
      grandtotal    : 0,
    },
  });
}

describe("Customer tersimpan dan bertahan lewat CRUD dasar", () => {
  it("createCustomer tersimpan dan langsung terbaca lewat findCustomer dengan kode yang dihasilkan", async () => {
    const created = await createCustomer(db, inputCustomer);

    expect(created.kodecustomer).toBeTruthy();
    expect(created.namacustomer).toBe("Budi Santoso");
    expect(created.telepon).toBe("081234567890");
    expect(created.email).toBe("budi@example.com");
    expect(created.alamat).toBe("Jl. Merdeka 1");

    const found = await findCustomer(db, created.kodecustomer);
    expect(found).toEqual(created);
  });

  it("updateCustomer mengubah namacustomer dan perubahan terbaca pada findCustomer berikutnya", async () => {
    const created = await createCustomer(db, inputCustomer);

    await updateCustomer(db, created.kodecustomer, { namacustomer: "Budi Santoso (VIP)" });

    const found = await findCustomer(db, created.kodecustomer);
    expect(found?.namacustomer).toBe("Budi Santoso (VIP)");
  });

  it("deleteCustomer menghapus Customer sehingga findCustomer dengan kode yang sama tidak lagi menemukannya", async () => {
    const created = await createCustomer(db, inputCustomer);

    await deleteCustomer(db, created.kodecustomer);

    const found = await findCustomer(db, created.kodecustomer);
    expect(found).toBeNull();
  });

  it("listCustomer pada Database Perusahaan yang baru diprovisioning mengembalikan daftar kosong, bukan error", async () => {
    const list = await listCustomer(db);

    expect(list).toEqual([]);
  });

  it("listCustomer setelah tiga kali createCustomer mengembalikan tepat tiga Customer", async () => {
    await createCustomer(db, { ...inputCustomer, namacustomer: "Customer 1" });
    await createCustomer(db, { ...inputCustomer, namacustomer: "Customer 2" });
    await createCustomer(db, { ...inputCustomer, namacustomer: "Customer 3" });

    const list = await listCustomer(db);
    expect(list).toHaveLength(3);
  });
});

describe("Kode Customer dibuat oleh generator Kode Dokumen sesuai Config", () => {
  it("createCustomer menghasilkan Kode Customer sesuai awalan dan panjangnomor dari Config modul customer", async () => {
    const created = await createCustomer(db, inputCustomer);

    expect(created.kodecustomer).toBe("C0001");
  });

  it("createCustomer kedua menghasilkan nomor urut lanjutan dari Kode Customer tertinggi yang sudah ada", async () => {
    const pertama = await createCustomer(db, inputCustomer);
    const kedua = await createCustomer(db, inputCustomer);

    expect(pertama.kodecustomer).toBe("C0001");
    expect(kedua.kodecustomer).toBe("C0002");
  });

  it("createCustomer ditolak dengan pesan yang menyebut Config hilang saat Config Kode Dokumen modul customer belum ada", async () => {
    await db.config.deleteMany({ where: { modul: "customer" } });

    try {
      await expect(createCustomer(db, inputCustomer)).rejects.toThrow(/[Cc]onfig/);
      await expect(createCustomer(db, inputCustomer)).rejects.toThrow(/tidak ditemukan/);

      const list = await listCustomer(db);
      expect(list).toHaveLength(0);
    } finally {
      await db.config.createMany({
        data: [
          { modul: "customer", config: "awalan", nilai: "C" },
          { modul: "customer", config: "pakaitanggal", nilai: "0" },
          { modul: "customer", config: "panjangnomor", nilai: "4" },
        ],
      });
    }
  });

  it("dua panggilan createCustomer bersamaan menghasilkan dua Kode Customer berbeda, tidak pernah kembar", async () => {
    const [a, b] = await Promise.all([
      createCustomer(db, { ...inputCustomer, namacustomer: "Customer A" }),
      createCustomer(db, { ...inputCustomer, namacustomer: "Customer B" }),
    ]);

    expect(a.kodecustomer).not.toBe(b.kodecustomer);
    expect([a.kodecustomer, b.kodecustomer].sort()).toEqual(["C0001", "C0002"]);
  });
});

describe("Kondisi gagal tertangani lengkap untuk Customer", () => {
  it("updateCustomer dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan, bukan membuat baris baru", async () => {
    await expect(updateCustomer(db, "C-TIDAK-ADA", { namacustomer: "Apa Saja" })).rejects.toThrow(/tidak ditemukan/);

    const list = await listCustomer(db);
    expect(list).toHaveLength(0);
  });

  it("deleteCustomer dengan kode yang tidak pernah ada ditolak dengan pesan tidak ditemukan", async () => {
    await expect(deleteCustomer(db, "C-TIDAK-ADA")).rejects.toThrow(/tidak ditemukan/);
  });

  it("findCustomer dengan kode yang tidak pernah ada mengembalikan tidak ditemukan, bukan melempar error", async () => {
    const found = await findCustomer(db, "C-TIDAK-ADA");
    expect(found).toBeNull();
  });

  it("createCustomer dengan namacustomer kosong ditolak dengan pesan input tidak sah, tidak tersimpan ke database", async () => {
    await expect(createCustomer(db, { ...inputCustomer, namacustomer: "" })).rejects.toThrow(/tidak boleh kosong/);

    const list = await listCustomer(db);
    expect(list).toHaveLength(0);
  });

  it("deleteCustomer terhadap Customer yang sudah dirujuk oleh baris jual ditolak dengan pesan jelas, bukan error mentah database", async () => {
    const created = await createCustomer(db, inputCustomer);
    await buatJualUntukCustomer(created.idcustomer);

    await expect(deleteCustomer(db, created.kodecustomer)).rejects.toThrow(/masih dipakai/);

    const masihAda = await findCustomer(db, created.kodecustomer);
    expect(masihAda).not.toBeNull();
  });
});

describe("Isolasi antar Perusahaan untuk Customer", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("Customer yang dibuat lewat koneksi Database Perusahaan A tidak muncul pada listCustomer Database Perusahaan B", async () => {
    await createCustomer(db, inputCustomer);

    const listLain = await listCustomer(dbLain);
    expect(listLain).toHaveLength(0);
  });

  it("dua Perusahaan berbeda masing-masing berhasil memakai Kode Customer yang identik tanpa saling bentrok", async () => {
    const customerA = await createCustomer(db, inputCustomer);
    const customerB = await createCustomer(dbLain, inputCustomer);

    expect(customerA.kodecustomer).toBe("C0001");
    expect(customerB.kodecustomer).toBe("C0001");
  });
});
