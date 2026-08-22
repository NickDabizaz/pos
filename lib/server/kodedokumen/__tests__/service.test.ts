import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["bayar", "jualdtl", "belidtl", "kasdtl", "jual", "beli", "kas", "barang", "lokasi", "customer", "supplier"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

function wibDate(isoWithOffset: string): Date {
  return new Date(isoWithOffset);
}

async function buatLokasi(kode = "LOK01") {
  return db.lokasi.create({ data: { kodelokasi: kode, namalokasi: "Lokasi Test" } });
}

async function buatCustomer(kode = "CUST01") {
  return db.customer.create({ data: { kodecustomer: kode, namacustomer: "Customer Test" } });
}

async function buatSupplier(kode = "SUP01") {
  return db.supplier.create({ data: { kodesupplier: kode, namasupplier: "Supplier Test" } });
}

function simpanBarang(db: DatabasePerusahaanClient) {
  return (kode: string) =>
    db.barang.create({
      data: {
        kodebarang: kode,
        namabarang: "Barang Test",
        satuan    : "Pcs",
        hargabeli : 1000,
        hargajual : 1500,
      },
    });
}

function simpanJual(db: DatabasePerusahaanClient, idcustomer: number, idlokasi: number, tgltrans: Date) {
  return (kode: string) =>
    db.jual.create({
      data: {
        kodejual      : kode,
        tgltrans,
        jenistransaksi: "TUNAI",
        idcustomer,
        idlokasi,
        total         : 0,
        diskon        : 0,
        ppn           : 0,
        grandtotal    : 0,
      },
    });
}

function simpanBeli(db: DatabasePerusahaanClient, idsupplier: number, idlokasi: number, tgltrans: Date) {
  return (kode: string) =>
    db.beli.create({
      data: {
        kodebeli: kode,
        tgltrans,
        idsupplier,
        idlokasi,
        total     : 0,
        diskon    : 0,
        ppn       : 0,
        grandtotal: 0,
      },
    });
}

describe("Kode dirakit dari Config modul", () => {
  it("menyimpan Barang pertama pada modul barang menghasilkan kodebarang B0001", async () => {
    const barang = await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    expect(barang.kodebarang).toBe("B0001");
  });

  it("menyimpan Penjualan pada modul jual bertanggal transaksi 19 Agustus 2026 menghasilkan JL2608190001", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-19T10:00:00+07:00");

    const jual = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));

    expect(jual.kodejual).toBe("JL2608190001");
  });

  it("menyimpan Pembelian pada tanggal yang sama menghasilkan PB2608190001, deretnya terpisah dari jual", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const supplier = await buatSupplier();
    const tgltrans = wibDate("2026-08-19T10:00:00+07:00");

    await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));
    const beli = await simpanDenganKode(db, "beli", tgltrans, simpanBeli(db, supplier.idsupplier, lokasi.idlokasi, tgltrans));

    expect(beli.kodebeli).toBe("PB2608190001");
  });

  it('Config panjangnomor bernilai 5 pada modul barang menghasilkan B00001', async () => {
    await db.config.update({ where: { modul_config: { modul: "barang", config: "panjangnomor" } }, data: { nilai: "5" } });

    try {
      const barang = await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
      expect(barang.kodebarang).toBe("B00001");
    } finally {
      await db.config.update({ where: { modul_config: { modul: "barang", config: "panjangnomor" } }, data: { nilai: "4" } });
    }
  });
});

describe("Tanggal diambil dari tanggal transaksi pada zona Asia/Jakarta", () => {
  it("Penjualan bertanggal transaksi 19 Agustus 2026 yang disimpan pada 21 Agustus 2026 tetap mendapat JL260819..., bukan JL260821...", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-19T10:00:00+07:00");

    const jual = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));

    expect(jual.kodejual.startsWith("JL260819")).toBe(true);
  });

  it("Penjualan pada 19 Agustus 2026 pukul 23:59 WIB masuk periode 260819", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-19T23:59:00+07:00");

    const jual = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));

    expect(jual.kodejual).toBe("JL2608190001");
  });

  it("Penjualan pada 20 Agustus 2026 pukul 00:00 WIB masuk periode 260820", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-20T00:00:00+07:00");

    const jual = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));

    expect(jual.kodejual).toBe("JL2608200001");
  });

  it("Penjualan pada 20 Agustus 2026 pukul 06:00 WIB (masih 19 Agustus di UTC) tetap masuk periode 260820", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-20T06:00:00+07:00");
    expect(tgltrans.getUTCDate()).toBe(19);

    const jual = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));

    expect(jual.kodejual).toBe("JL2608200001");
  });
});

describe("Nomor bertanggal mulai lagi setiap ganti hari", () => {
  it("setelah JL2608190003 tersimpan, Penjualan pertama pada 20 Agustus 2026 mendapat JL2608200001, lalu mundur ke 19 Agustus melanjutkan deret hari itu sendiri", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgl19 = wibDate("2026-08-19T10:00:00+07:00");
    const tgl20 = wibDate("2026-08-20T10:00:00+07:00");

    for (let i = 0; i < 3; i++) {
      await simpanDenganKode(db, "jual", tgl19, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgl19));
    }

    const pertama20 = await simpanDenganKode(db, "jual", tgl20, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgl20));
    expect(pertama20.kodejual).toBe("JL2608200001");

    const mundur19 = await simpanDenganKode(db, "jual", tgl19, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgl19));
    expect(mundur19.kodejual).toBe("JL2608190004");
  });
});

describe("Nomor tanpa tanggal berjalan terus", () => {
  it("setelah B0003 tersimpan, Barang berikutnya mendapat B0004, dan tahun berikutnya tetap melanjutkan tanpa reset", async () => {
    for (let i = 0; i < 3; i++) {
      await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    }

    const keempat = await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    expect(keempat.kodebarang).toBe("B0004");

    const tahunDepan = await simpanDenganKode(db, "barang", wibDate("2027-01-01T00:00:00+07:00"), simpanBarang(db));
    expect(tahunDepan.kodebarang).toBe("B0005");
  });
});

describe("Nomor melampaui panjang digit tidak terpotong", () => {
  it("B9999 lalu B10000 tidak terpotong dan tetap muat", async () => {
    await db.barang.createMany({
      data: Array.from({ length: 9999 }, (_, i) => ({
        kodebarang: `B${String(i + 1).padStart(4, "0")}`,
        namabarang: "Barang Massal",
        satuan    : "Pcs",
        hargabeli : 1000,
        hargajual : 1500,
      })),
    });

    const kesepuluhribu = await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    expect(kesepuluhribu.kodebarang).toBe("B10000");
  }, 30_000);

  it("JL2608199999 lalu berikutnya pada hari itu mendapat JL26081910000", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-19T10:00:00+07:00");

    await db.jual.createMany({
      data: Array.from({ length: 9999 }, (_, i) => ({
        kodejual      : `JL260819${String(i + 1).padStart(4, "0")}`,
        tgltrans,
        jenistransaksi: "TUNAI",
        idcustomer    : customer.idcustomer,
        idlokasi      : lokasi.idlokasi,
        total         : 0,
        diskon        : 0,
        ppn           : 0,
        grandtotal    : 0,
      })),
    });

    const kesepuluhribu = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));
    expect(kesepuluhribu.kodejual).toBe("JL26081910000");
  }, 30_000);
});

describe("Kode tidak pernah kembar", () => {
  it("dua penyimpanan Barang bersamaan menghasilkan B0001 dan B0002, tidak pernah dua kode yang sama", async () => {
    const [a, b] = await Promise.all([
      simpanDenganKode(db, "barang", new Date(), simpanBarang(db)),
      simpanDenganKode(db, "barang", new Date(), simpanBarang(db)),
    ]);

    expect(a.kodebarang).not.toBe(b.kodebarang);
    expect([a.kodebarang, b.kodebarang].sort()).toEqual(["B0001", "B0002"]);
  });

  it("sepuluh penyimpanan Penjualan paralel pada tanggal yang sama menghasilkan sepuluh Kode Dokumen yang seluruhnya berbeda, tanpa galat unique index sampai ke pemanggil", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-19T10:00:00+07:00");

    const hasil = await Promise.all(
      Array.from({ length: 10 }, () =>
        simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans)),
      ),
    );

    const kodeSet = new Set(hasil.map((jual) => jual.kodejual));
    expect(kodeSet.size).toBe(10);
  }, 30_000);

  it("percobaan ulang yang habis karena bentrok terus-menerus berakhir dengan pesan galat yang jelas, bukan penantian tanpa ujung", async () => {
    let panggilan = 0;
    const selaluBentrok = async () => {
      panggilan += 1;
      const { Prisma } = await import("@/lib/generated/prisma-perusahaan/client");
      throw new Prisma.PrismaClientKnownRequestError("Duplicate entry", {
        code   : "P2002",
        clientVersion: "test",
        meta   : { target: ["kodebarang"] },
      });
    };

    await expect(simpanDenganKode(db, "barang", new Date(), selaluBentrok)).rejects.toThrow(
      /Gagal mendapatkan Kode Dokumen/,
    );
    expect(panggilan).toBeGreaterThan(1);
  });
});

describe("Dokumen dibatalkan tetap memegang kodenya", () => {
  it("Penjualan yang statusnya diubah menjadi D tetap memakai kodenya, dan Penjualan berikutnya tidak mengisi ulang nomornya", async () => {
    const lokasi = await buatLokasi();
    const customer = await buatCustomer();
    const tgltrans = wibDate("2026-08-19T10:00:00+07:00");

    const pertama = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));
    const kedua = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));
    expect(kedua.kodejual).toBe("JL2608190002");

    await db.jual.update({ where: { idjual: kedua.idjual }, data: { status: "D" } });

    const ketiga = await simpanDenganKode(db, "jual", tgltrans, simpanJual(db, customer.idcustomer, lokasi.idlokasi, tgltrans));
    expect(ketiga.kodejual).toBe("JL2608190003");

    const dibatalkan = await db.jual.findUnique({ where: { idjual: kedua.idjual } });
    expect(dibatalkan?.kodejual).toBe("JL2608190002");
    void pertama;
  });

  it("Barang berstatus nonaktif tetap memegang kodenya, dan Barang berikutnya mendapat nomor lanjutan", async () => {
    await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    const kedua = await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    expect(kedua.kodebarang).toBe("B0002");

    await db.barang.update({ where: { idbarang: kedua.idbarang }, data: { status: 0 } });

    const ketiga = await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    expect(ketiga.kodebarang).toBe("B0003");
  });
});

describe("Config yang rusak menggagalkan penyimpanan", () => {
  it("Config modul yang tidak ada sama sekali menggagalkan penyimpanan dengan pesan yang menyebut nama modulnya", async () => {
    await db.config.deleteMany({ where: { modul: "barang" } });

    try {
      await expect(simpanDenganKode(db, "barang", new Date(), simpanBarang(db))).rejects.toThrow(
        /tidak ditemukan/,
      );
      await expect(simpanDenganKode(db, "barang", new Date(), simpanBarang(db))).rejects.toThrow(/barang/);
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

  it('panjangnomor bernilai "abc" menggagalkan penyimpanan dengan pesan yang menyebut kunci Config-nya', async () => {
    await db.config.update({ where: { modul_config: { modul: "barang", config: "panjangnomor" } }, data: { nilai: "abc" } });

    try {
      await expect(simpanDenganKode(db, "barang", new Date(), simpanBarang(db))).rejects.toThrow(/panjangnomor/);
    } finally {
      await db.config.update({ where: { modul_config: { modul: "barang", config: "panjangnomor" } }, data: { nilai: "4" } });
    }
  });

  it('pakaitanggal bernilai selain "0" atau "1" menggagalkan penyimpanan', async () => {
    await db.config.update({ where: { modul_config: { modul: "barang", config: "pakaitanggal" } }, data: { nilai: "2" } });

    try {
      await expect(simpanDenganKode(db, "barang", new Date(), simpanBarang(db))).rejects.toThrow(
        /pakaitanggal/,
      );
    } finally {
      await db.config.update({ where: { modul_config: { modul: "barang", config: "pakaitanggal" } }, data: { nilai: "0" } });
    }
  });

  it("awalan kosong menggagalkan penyimpanan", async () => {
    await db.config.update({ where: { modul_config: { modul: "barang", config: "awalan" } }, data: { nilai: "" } });

    try {
      await expect(simpanDenganKode(db, "barang", new Date(), simpanBarang(db))).rejects.toThrow(
        /awalan/,
      );
    } finally {
      await db.config.update({ where: { modul_config: { modul: "barang", config: "awalan" } }, data: { nilai: "B" } });
    }
  });
});

describe("Modul yang tidak dikenal ditolak", () => {
  it("modul di luar daftar yang dikenal ditolak dengan pesan yang menyebut modul yang diminta, tanpa menyentuh database", async () => {
    let tersentuh = false;
    await expect(
      simpanDenganKode(db, "shift", new Date(), async () => {
        tersentuh = true;
        return null;
      }),
    ).rejects.toThrow(/tidak dikenal generator Kode Dokumen/);
    await expect(
      simpanDenganKode(db, "shift", new Date(), async () => {
        tersentuh = true;
        return null;
      }),
    ).rejects.toThrow(/shift/);
    expect(tersentuh).toBe(false);
  });
});

describe("Setiap Perusahaan punya deret sendiri", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeEach(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  afterEach(async () => {
    await dropDatabase(namaDbLain);
  });

  it("Barang pertama di dua Database Perusahaan berbeda sama-sama mendapat B0001, dan deret satu Perusahaan tidak menggeser Perusahaan lain", async () => {
    for (let i = 0; i < 50; i++) {
      await simpanDenganKode(db, "barang", new Date(), simpanBarang(db));
    }

    const barangLain = await simpanDenganKode(dbLain, "barang", new Date(), simpanBarang(dbLain));
    expect(barangLain.kodebarang).toBe("B0001");
  }, 30_000);
});
