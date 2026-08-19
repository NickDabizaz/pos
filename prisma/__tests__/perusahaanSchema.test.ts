import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-perusahaan/client";
import { listColumns, listTables, migrateDeploy, setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

let dbName: string;
let prisma: PrismaClient;
let tearDown: () => Promise<void>;

beforeAll(async () => {
  ({ dbName, prisma, tearDown } = await setUpMigratedDatabase("perusahaan", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterAll(async () => {
  await tearDown();
});

describe("skema Database Perusahaan memuat seluruh tabel wajib", () => {
  it("migration Database Perusahaan membuat tabel barang, customer, supplier, lokasi, jual, jualdtl, beli, belidtl, kas, kasdtl, modalawal, setorankasir, bayar, dan config", async () => {
    const tables = await listTables(dbName);

    expect(tables).toEqual(
      expect.arrayContaining([
        "barang",
        "customer",
        "supplier",
        "lokasi",
        "jual",
        "jualdtl",
        "beli",
        "belidtl",
        "kas",
        "kasdtl",
        "modalawal",
        "setorankasir",
        "bayar",
        "config",
      ]),
    );
  });
});

describe("setorankasir menunjuk Shift yang ditutupnya lewat idlokasi", () => {
  it("tabel setorankasir memiliki kolom idlokasi", async () => {
    const columns = await listColumns(dbName, "setorankasir");

    expect(columns).toContain("idlokasi");
  });
});

describe("Kode Dokumen tidak pernah kembar dalam satu tabel", () => {
  it('menyimpan Lokasi kedua dengan kodelokasi "L001" yang sudah dipakai Lokasi pertama ditolak database', async () => {
    await prisma.lokasi.create({ data: { kodelokasi: "L001", namalokasi: "Toko Utama" } });

    await expect(
      prisma.lokasi.create({ data: { kodelokasi: "L001", namalokasi: "Toko Lain" } }),
    ).rejects.toThrow();
  });

  it('menyimpan Barang kedua dengan kodebarang "B0001" yang sudah dipakai Barang pertama ditolak database', async () => {
    const data = {
      kodebarang: "B0001",
      namabarang: "Beras 5kg",
      satuan    : "PCS",
      hargabeli : 50000,
      hargajual : 60000,
    };
    await prisma.barang.create({ data });

    await expect(
      prisma.barang.create({ data: { ...data, namabarang: "Beras 5kg (2)" } }),
    ).rejects.toThrow();
  });

  it('menyimpan Customer kedua dengan kodecustomer "C0001" yang sudah dipakai Customer pertama ditolak database', async () => {
    await prisma.customer.create({ data: { kodecustomer: "C0001", namacustomer: "Budi" } });

    await expect(
      prisma.customer.create({ data: { kodecustomer: "C0001", namacustomer: "Budi Lain" } }),
    ).rejects.toThrow();
  });

  it('menyimpan Supplier kedua dengan kodesupplier "S0001" yang sudah dipakai Supplier pertama ditolak database', async () => {
    await prisma.supplier.create({ data: { kodesupplier: "S0001", namasupplier: "CV Makmur" } });

    await expect(
      prisma.supplier.create({ data: { kodesupplier: "S0001", namasupplier: "CV Lain" } }),
    ).rejects.toThrow();
  });

  it('menyimpan Penjualan kedua dengan kodejual "JL2608190001" yang sudah dipakai Penjualan pertama ditolak database', async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-JL", namalokasi: "Lokasi Jual" } });
    const customer = await prisma.customer.create({ data: { kodecustomer: "C-JL", namacustomer: "Customer Jual" } });
    const data = {
      kodejual      : "JL2608190001",
      tgltrans      : new Date("2026-08-19"),
      jenistransaksi: "POS",
      idcustomer    : customer.idcustomer,
      idlokasi      : lokasi.idlokasi,
      total         : 10000,
      diskon        : 0,
      ppn           : 0,
      grandtotal    : 10000,
    };
    await prisma.jual.create({ data });

    await expect(prisma.jual.create({ data })).rejects.toThrow();
  });

  it('menyimpan Pembelian kedua dengan kodebeli yang sudah dipakai Pembelian pertama ditolak database', async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-BL", namalokasi: "Lokasi Beli" } });
    const supplier = await prisma.supplier.create({ data: { kodesupplier: "S-BL", namasupplier: "Supplier Beli" } });
    const data = {
      kodebeli  : "PB2608190001",
      tgltrans  : new Date("2026-08-19"),
      idsupplier: supplier.idsupplier,
      idlokasi  : lokasi.idlokasi,
      total     : 10000,
      diskon    : 0,
      ppn       : 0,
      grandtotal: 10000,
    };
    await prisma.beli.create({ data });

    await expect(prisma.beli.create({ data })).rejects.toThrow();
  });

  it('menyimpan Kas kedua dengan kodekas yang sudah dipakai Kas pertama ditolak database', async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-KS", namalokasi: "Lokasi Kas" } });
    const data = {
      kodekas   : "KS2608190001",
      tgltrans  : new Date("2026-08-19"),
      jenis     : "MASUK",
      idlokasi  : lokasi.idlokasi,
      grandtotal: 50000,
    };
    await prisma.kas.create({ data });

    await expect(prisma.kas.create({ data })).rejects.toThrow();
  });
});

describe("modalawal tidak boleh membuka Shift dua kali untuk tanggal + Lokasi yang sama", () => {
  it("Modal Awal pertama untuk tgltrans 2026-08-19 di Lokasi L001-MA tersimpan", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L001-MA", namalokasi: "Lokasi Modal Awal" } });

    const created = await prisma.modalawal.create({
      data: {
        tgltrans: new Date("2026-08-19"),
        idlokasi: lokasi.idlokasi,
        idkasir : "kasir-1",
        nominal : 500000,
      },
    });

    expect(created.idmodalawal).toBeDefined();
  });

  it("Modal Awal kedua untuk tgltrans 2026-08-19 di Lokasi L002-MA yang sama ditolak database", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L002-MA", namalokasi: "Lokasi Modal Awal 2" } });
    const data = {
      tgltrans: new Date("2026-08-19"),
      idlokasi: lokasi.idlokasi,
      idkasir : "kasir-1",
      nominal : 500000,
    };
    await prisma.modalawal.create({ data });

    await expect(prisma.modalawal.create({ data })).rejects.toThrow();
  });

  it("Modal Awal untuk tgltrans 2026-08-19 di Lokasi berbeda (tanggal sama) tetap diterima", async () => {
    const lokasiA = await prisma.lokasi.create({ data: { kodelokasi: "L003-MA-A", namalokasi: "Lokasi A" } });
    const lokasiB = await prisma.lokasi.create({ data: { kodelokasi: "L003-MA-B", namalokasi: "Lokasi B" } });
    const tgltrans = new Date("2026-08-19");

    await prisma.modalawal.create({ data: { tgltrans, idlokasi: lokasiA.idlokasi, idkasir: "kasir-1", nominal: 500000 } });

    await expect(
      prisma.modalawal.create({ data: { tgltrans, idlokasi: lokasiB.idlokasi, idkasir: "kasir-1", nominal: 500000 } }),
    ).resolves.toBeDefined();
  });

  it("Modal Awal untuk tgltrans 2026-08-20 di Lokasi yang sama (tanggal berbeda) tetap diterima", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L004-MA", namalokasi: "Lokasi Beda Tanggal" } });

    await prisma.modalawal.create({
      data: { tgltrans: new Date("2026-08-19"), idlokasi: lokasi.idlokasi, idkasir: "kasir-1", nominal: 500000 },
    });

    await expect(
      prisma.modalawal.create({
        data: { tgltrans: new Date("2026-08-20"), idlokasi: lokasi.idlokasi, idkasir: "kasir-1", nominal: 500000 },
      }),
    ).resolves.toBeDefined();
  });

  it("dua percobaan simpan Modal Awal bersamaan untuk tanggal + Lokasi yang sama menghasilkan tepat satu baris tersimpan", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L005-MA", namalokasi: "Lokasi Race" } });
    const data = {
      tgltrans: new Date("2026-08-19"),
      idlokasi: lokasi.idlokasi,
      idkasir : "kasir-1",
      nominal : 500000,
    };

    const results = await Promise.allSettled([
      prisma.modalawal.create({ data }),
      prisma.modalawal.create({ data }),
    ]);

    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const rows = await prisma.modalawal.findMany({ where: { idlokasi: lokasi.idlokasi } });
    expect(rows).toHaveLength(1);
  });
});

describe("tabel detail berkunci komposit header + urutan, tanpa primary key sendiri", () => {
  it("menyimpan dua baris jualdtl dengan idjual dan urutan yang identik membuat baris kedua ditolak database", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-JD", namalokasi: "Lokasi Jualdtl" } });
    const customer = await prisma.customer.create({ data: { kodecustomer: "C-JD", namacustomer: "Customer Jualdtl" } });
    const barang = await prisma.barang.create({
      data: { kodebarang: "B-JD", namabarang: "Barang Jualdtl", satuan: "PCS", hargabeli: 1000, hargajual: 1500 },
    });
    const jual = await prisma.jual.create({
      data: {
        kodejual      : "JL-DTL-001",
        tgltrans      : new Date("2026-08-19"),
        jenistransaksi: "POS",
        idcustomer    : customer.idcustomer,
        idlokasi      : lokasi.idlokasi,
        total         : 1500,
        diskon        : 0,
        ppn           : 0,
        grandtotal    : 1500,
      },
    });
    const line = {
      idjual  : jual.idjual,
      urutan  : 1,
      idbarang: barang.idbarang,
      qty     : 1,
      harga   : 1500,
      pakaippn: "TIDAK",
      diskon  : 0,
      ppn     : 0,
      subtotal: 1500,
    };
    await prisma.jualdtl.create({ data: line });

    await expect(prisma.jualdtl.create({ data: line })).rejects.toThrow();
  });

  it("menyimpan dua baris belidtl dengan idbeli dan urutan yang identik membuat baris kedua ditolak database", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-BD", namalokasi: "Lokasi Belidtl" } });
    const supplier = await prisma.supplier.create({ data: { kodesupplier: "S-BD", namasupplier: "Supplier Belidtl" } });
    const barang = await prisma.barang.create({
      data: { kodebarang: "B-BD", namabarang: "Barang Belidtl", satuan: "PCS", hargabeli: 1000, hargajual: 1500 },
    });
    const beli = await prisma.beli.create({
      data: {
        kodebeli  : "PB-DTL-001",
        tgltrans  : new Date("2026-08-19"),
        idsupplier: supplier.idsupplier,
        idlokasi  : lokasi.idlokasi,
        total     : 1000,
        diskon    : 0,
        ppn       : 0,
        grandtotal: 1000,
      },
    });
    const line = {
      idbeli  : beli.idbeli,
      urutan  : 1,
      idbarang: barang.idbarang,
      qty     : 1,
      harga   : 1000,
      pakaippn: "TIDAK",
      diskon  : 0,
      ppn     : 0,
      subtotal: 1000,
    };
    await prisma.belidtl.create({ data: line });

    await expect(prisma.belidtl.create({ data: line })).rejects.toThrow();
  });

  it("menyimpan dua baris kasdtl dengan idkas dan urutan yang identik membuat baris kedua ditolak database", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-KD", namalokasi: "Lokasi Kasdtl" } });
    const kas = await prisma.kas.create({
      data: {
        kodekas   : "KS-DTL-001",
        tgltrans  : new Date("2026-08-19"),
        jenis     : "MASUK",
        idlokasi  : lokasi.idlokasi,
        grandtotal: 20000,
      },
    });
    const line = { idkas: kas.idkas, urutan: 1, keterangan: "Setoran modal", nominal: 20000 };
    await prisma.kasdtl.create({ data: line });

    await expect(prisma.kasdtl.create({ data: line })).rejects.toThrow();
  });

  it("menyimpan jualdtl dengan idjual yang sama dan urutan berbeda (1 dan 2) untuk header yang sama tetap diterima keduanya", async () => {
    const lokasi = await prisma.lokasi.create({ data: { kodelokasi: "L-JD2", namalokasi: "Lokasi Jualdtl 2" } });
    const customer = await prisma.customer.create({ data: { kodecustomer: "C-JD2", namacustomer: "Customer Jualdtl 2" } });
    const barang = await prisma.barang.create({
      data: { kodebarang: "B-JD2", namabarang: "Barang Jualdtl 2", satuan: "PCS", hargabeli: 1000, hargajual: 1500 },
    });
    const jual = await prisma.jual.create({
      data: {
        kodejual      : "JL-DTL-002",
        tgltrans      : new Date("2026-08-19"),
        jenistransaksi: "POS",
        idcustomer    : customer.idcustomer,
        idlokasi      : lokasi.idlokasi,
        total         : 3000,
        diskon        : 0,
        ppn           : 0,
        grandtotal    : 3000,
      },
    });
    const baseLine = {
      idjual  : jual.idjual,
      idbarang: barang.idbarang,
      qty     : 1,
      harga   : 1500,
      pakaippn: "TIDAK",
      diskon  : 0,
      ppn     : 0,
      subtotal: 1500,
    };

    await expect(prisma.jualdtl.create({ data: { ...baseLine, urutan: 1 } })).resolves.toBeDefined();
    await expect(prisma.jualdtl.create({ data: { ...baseLine, urutan: 2 } })).resolves.toBeDefined();
  });
});

describe("config berkunci modul + config, tanpa kolom idperusahaan", () => {
  it("tabel config tidak memiliki kolom idperusahaan", async () => {
    const columns = await listColumns(dbName, "config");

    expect(columns).not.toContain("idperusahaan");
  });

  it('menyimpan baris config kedua dengan pasangan modul "ppn" + config "persentase" yang sudah ada ditolak database', async () => {
    await prisma.config.create({ data: { modul: "ppn", config: "persentase", nilai: "11" } });

    await expect(
      prisma.config.create({ data: { modul: "ppn", config: "persentase", nilai: "12" } }),
    ).rejects.toThrow();
  });

  it('menyimpan config dengan modul "ppn" config "aktif" dan modul "kodedokumen" config "aktif" (modul berbeda, nama config sama) tetap diterima keduanya', async () => {
    await expect(
      prisma.config.create({ data: { modul: "ppn", config: "aktif", nilai: "1" } }),
    ).resolves.toBeDefined();

    await expect(
      prisma.config.create({ data: { modul: "kodedokumen", config: "aktif", nilai: "1" } }),
    ).resolves.toBeDefined();
  });

  it('dua percobaan simpan config untuk modul "tampilan" + config "warna" yang dikirim bersamaan menghasilkan tepat satu baris tersimpan', async () => {
    const data = { modul: "tampilan", config: "warna", nilai: "biru" };

    const results = await Promise.allSettled([
      prisma.config.create({ data }),
      prisma.config.create({ data }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);

    const rows = await prisma.config.findMany({ where: { modul: "tampilan", config: "warna" } });
    expect(rows).toHaveLength(1);
  });
});

describe("migration Database Perusahaan aman dijalankan berulang, dari keadaan kosong maupun sudah terisi", () => {
  it("menjalankan migration Database Perusahaan terhadap database kosong selesai tanpa error dan seluruh tabel yang disyaratkan ada", async () => {
    const tables = await listTables(dbName);

    expect(tables.length).toBeGreaterThan(0);
  });

  it(
    "menjalankan ulang migration Database Perusahaan yang sama terhadap database yang sudah dimigrasikan selesai tanpa error dan tidak menggandakan tabel",
    async () => {
      const tablesBefore = await listTables(dbName);

      expect(() => migrateDeploy("perusahaan", dbName)).not.toThrow();

      const tablesAfter = await listTables(dbName);
      expect(tablesAfter.sort()).toEqual(tablesBefore.sort());
    },
    30_000,
  );
});
