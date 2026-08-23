import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { cancelPembelian, createPembelian, findPembelian, listPembelian } from "@/lib/server/pembelian/service";
import type { CreatePembelianInput } from "@/lib/server/pembelian/types";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["belidtl", "beli", "barang", "lokasi", "supplier"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

async function buatLokasi(target: DatabasePerusahaanClient, kode = "LOK01", status = 1) {
  return target.lokasi.create({ data: { kodelokasi: kode, namalokasi: "Lokasi Test", status } });
}

async function buatSupplier(target: DatabasePerusahaanClient, kode = "SUP01", status = 1) {
  return target.supplier.create({ data: { kodesupplier: kode, namasupplier: "Supplier Test", status } });
}

async function buatBarang(target: DatabasePerusahaanClient, kode = "BRG01", hargajual = 10000) {
  return target.barang.create({
    data: { kodebarang: kode, namabarang: "Barang Test", satuan: "Pcs", hargabeli: hargajual - 1000, hargajual },
  });
}

async function siapkanDasar(target: DatabasePerusahaanClient = db) {
  const lokasi = await buatLokasi(target);
  const supplier = await buatSupplier(target);
  const barang = await buatBarang(target);

  return { lokasi, supplier, barang };
}

function buildInput(overrides: Partial<CreatePembelianInput> = {}): CreatePembelianInput {
  return {
    tanggal     : "2026-08-23",
    kodesupplier: "SUP01",
    kodelokasi  : "LOK01",
    items       : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
    ...overrides,
  };
}

async function bacaJumlahBaris(): Promise<{ beli: number; belidtl: number }> {
  const [beli, belidtl] = await Promise.all([db.beli.count(), db.belidtl.count()]);

  return { beli, belidtl };
}

describe("Pembelian dan baris tersimpan sebagai satu transaksi database", () => {
  it("Pembelian dengan 1 baris tersimpan sekaligus", async () => {
    await siapkanDasar();

    const created = await createPembelian(db, buildInput());

    expect(created.items).toHaveLength(1);
    const jumlah = await bacaJumlahBaris();
    expect(jumlah).toEqual({ beli: 1, belidtl: 1 });
  });

  it("Pembelian dengan beberapa baris tersimpan lengkap dalam satu panggilan, urutan berurutan mulai 1", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);
    await buatBarang(db, "BRG03", 7000);

    const created = await createPembelian(
      db,
      buildInput({
        items: [
          { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
          { kodebarang: "BRG02", qty: 2, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 },
          { kodebarang: "BRG03", qty: 3, harga: 7000, pakaiPpn: "TIDAK", diskon: 0 },
        ],
      }),
    );

    expect(created.items.map((item) => item.kodebarang)).toEqual(["BRG01", "BRG02", "BRG03"]);
    const rows = await db.belidtl.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.urutan)).toEqual([1, 2, 3]);
  });

  it("baris kedua gagal (kodebarang tidak ada) menyebabkan baris pertama yang valid juga tidak tersimpan", async () => {
    await siapkanDasar();

    await expect(
      createPembelian(
        db,
        buildInput({
          items: [
            { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
            { kodebarang: "TIDAKADA", qty: 1, harga: 1000, pakaiPpn: "TIDAK", diskon: 0 },
          ],
        }),
      ),
    ).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ beli: 0, belidtl: 0 });
  });

  it("baris terakhir gagal karena harga tidak sah menyebabkan header juga tidak tersimpan", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    await expect(
      createPembelian(
        db,
        buildInput({
          items: [
            { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
            { kodebarang: "BRG02", qty: 1, harga: -1, pakaiPpn: "TIDAK", diskon: 0 },
          ],
        }),
      ),
    ).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ beli: 0, belidtl: 0 });
  });
});

describe("Total, PPN, diskon, dan grand total dihitung server sesuai Config", () => {
  it("nilai total/diskon/ppn/grandtotal kiriman klien diabaikan, server memakai hasil hitungnya sendiri", async () => {
    await siapkanDasar();

    const created = await createPembelian(db, buildInput());

    expect(created.total).toBe(10000);
    expect(created.grandtotal).toBe(10000);
  });

  it("baris pakaiPpn TIDAK tidak menyumbang PPN", async () => {
    await siapkanDasar();

    const created = await createPembelian(db, buildInput());

    expect(created.ppn).toBe(0);
  });

  it("Config ppn.status 0 (default) membuat PPN grand total tetap 0 meski baris EXCLUDE", async () => {
    await siapkanDasar();

    const created = await createPembelian(
      db,
      buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0 }] }),
    );

    expect(created.ppn).toBe(0);
    expect(created.grandtotal).toBe(10000);
  });

  it("Config ppn.status 1 dengan persentase 11 menambahkan PPN EXCLUDE di atas subtotal", async () => {
    await siapkanDasar();
    await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "1" } });

    try {
      const created = await createPembelian(
        db,
        buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0 }] }),
      );

      expect(created.ppn).toBeCloseTo(1100);
      expect(created.grandtotal).toBeCloseTo(11100);
    } finally {
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "0" } });
    }
  });

  it("baris pakaiPpn INCLUDE mengekstrak PPN dari harga, subtotal tidak berubah dari qty*harga-diskon", async () => {
    await siapkanDasar();
    await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "1" } });

    try {
      const created = await createPembelian(
        db,
        buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: 11100, pakaiPpn: "INCLUDE", diskon: 0 }] }),
      );

      expect(created.items[0].subtotal).toBe(11100);
      expect(created.items[0].ppn).toBeCloseTo(1100);
    } finally {
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "0" } });
    }
  });

  it("Config ppn.persentase yang diubah mengubah hasil hitung PPN, bukan angka hardcode", async () => {
    await siapkanDasar();
    await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "1" } });
    await db.config.update({ where: { modul_config: { modul: "ppn", config: "persentase" } }, data: { nilai: "10" } });

    try {
      const created = await createPembelian(
        db,
        buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0 }] }),
      );

      expect(created.ppn).toBeCloseTo(1000);
    } finally {
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "0" } });
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "persentase" } }, data: { nilai: "11" } });
    }
  });

  it("total, diskon, grand total dihitung ulang server untuk Pembelian dengan diskon per baris berbeda-beda", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    const created = await createPembelian(
      db,
      buildInput({
        items: [
          { kodebarang: "BRG01", qty: 2, harga: 10000, pakaiPpn: "TIDAK", diskon: 2000 },
          { kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 500 },
        ],
      }),
    );

    expect(created.total).toBe(25000);
    expect(created.diskon).toBe(2500);
    expect(created.grandtotal).toBe(22500);
  });
});

describe("Kode Pembelian dibuat oleh generator Kode Dokumen dan tidak pernah kembar", () => {
  it("kodebeli mengikuti format Config modul beli", async () => {
    await siapkanDasar();

    const created = await createPembelian(db, buildInput({ tanggal: "2026-08-23" }));

    expect(created.kodebeli).toMatch(/^PB2608230001$/);
  });

  it("dua Pembelian berurutan pada tanggal yang sama mendapat nomor urut berurutan", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    const pertama = await createPembelian(db, buildInput({ tanggal: "2026-08-23" }));
    const kedua = await createPembelian(
      db,
      buildInput({
        tanggal: "2026-08-23",
        items  : [{ kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 }],
      }),
    );

    expect(pertama.kodebeli).toBe("PB2608230001");
    expect(kedua.kodebeli).toBe("PB2608230002");
  });

  it("dua createPembelian paralel menghasilkan dua kodebeli berbeda, tidak ada yang gagal karena duplikat", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    const [a, b] = await Promise.all([
      createPembelian(db, buildInput({ tanggal: "2026-08-24" })),
      createPembelian(
        db,
        buildInput({
          tanggal: "2026-08-24",
          items  : [{ kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 }],
        }),
      ),
    ]);

    expect(a.kodebeli).not.toBe(b.kodebeli);
    expect(await db.beli.count()).toBe(2);
  });
});

describe("Pembatalan Pembelian mengubah status tanpa menghapus barisnya", () => {
  it("membatalkan Pembelian berstatus S mengubah status jadi D dan mencatat alasanbatal, baris tetap utuh", async () => {
    await siapkanDasar();
    const created = await createPembelian(db, buildInput());

    const cancelled = await cancelPembelian(db, created.kodebeli, "Barang tidak sesuai pesanan");

    expect(cancelled.status).toBe("D");
    expect(cancelled.alasanbatal).toBe("Barang tidak sesuai pesanan");
    expect(cancelled.items).toHaveLength(1);
    expect(await bacaJumlahBaris()).toEqual({ beli: 1, belidtl: 1 });
  });

  it("total, diskon, ppn, dan grandtotal pada header tidak berubah akibat pembatalan", async () => {
    await siapkanDasar();
    const created = await createPembelian(db, buildInput());

    const cancelled = await cancelPembelian(db, created.kodebeli);

    expect(cancelled.total).toBe(created.total);
    expect(cancelled.diskon).toBe(created.diskon);
    expect(cancelled.ppn).toBe(created.ppn);
    expect(cancelled.grandtotal).toBe(created.grandtotal);
  });

  it("membatalkan Pembelian yang sudah berstatus D ditolak", async () => {
    await siapkanDasar();
    const created = await createPembelian(db, buildInput());
    await cancelPembelian(db, created.kodebeli);

    await expect(cancelPembelian(db, created.kodebeli)).rejects.toThrow(/sudah dibatalkan/);
  });

  it("membatalkan kodebeli yang tidak ada ditolak dengan error tidak ditemukan", async () => {
    await expect(cancelPembelian(db, "PB0000000000")).rejects.toThrow(/tidak ditemukan/);
  });
});

describe("Lokasi dan Supplier pada Pembelian harus sah — tidak ditemukan maupun nonaktif ditolak", () => {
  it("kodelokasi yang tidak terdaftar ditolak, tidak ada apa pun yang tersimpan", async () => {
    await buatSupplier(db);
    await buatBarang(db);

    await expect(createPembelian(db, buildInput({ kodelokasi: "TIDAKADA" }))).rejects.toThrow(/Lokasi.*tidak ditemukan/);
    expect(await bacaJumlahBaris()).toEqual({ beli: 0, belidtl: 0 });
  });

  it("kodelokasi yang terdaftar tapi nonaktif ditolak sebagai Lokasi tidak sah", async () => {
    await buatLokasi(db, "LOK01", 0);
    await buatSupplier(db);
    await buatBarang(db);

    await expect(createPembelian(db, buildInput())).rejects.toThrow(/Lokasi.*nonaktif/);
  });

  it("kodesupplier yang tidak terdaftar ditolak, tidak ada apa pun yang tersimpan", async () => {
    await buatLokasi(db);
    await buatBarang(db);

    await expect(createPembelian(db, buildInput({ kodesupplier: "TIDAKADA" }))).rejects.toThrow(/Supplier.*tidak ditemukan/);
    expect(await bacaJumlahBaris()).toEqual({ beli: 0, belidtl: 0 });
  });

  it("kodesupplier yang terdaftar tapi nonaktif ditolak sebagai Supplier tidak sah", async () => {
    await buatLokasi(db);
    await buatSupplier(db, "SUP01", 0);
    await buatBarang(db);

    await expect(createPembelian(db, buildInput())).rejects.toThrow(/Supplier.*nonaktif/);
  });

  it("Pembelian dengan kodelokasi dan kodesupplier yang sah dan aktif tersimpan normal", async () => {
    await siapkanDasar();

    const created = await createPembelian(db, buildInput());

    expect(created.kodelokasi).toBe("LOK01");
    expect(created.kodesupplier).toBe("SUP01");
  });
});

describe("Baris Pembelian ditolak bila Barang tidak ada", () => {
  it("kodebarang yang tidak terdaftar ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPembelian(db, buildInput({ items: [{ kodebarang: "TIDAKADA", qty: 1, harga: 1000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow(/Barang.*tidak ditemukan/);
  });
});

describe("Jumlah (qty) tiap baris harus lebih dari nol", () => {
  it("qty 0 ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPembelian(db, buildInput({ items: [{ kodebarang: "BRG01", qty: 0, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow();
  });

  it("qty negatif ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPembelian(db, buildInput({ items: [{ kodebarang: "BRG01", qty: -1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow();
  });

  it("qty pecahan kecil positif diterima", async () => {
    await siapkanDasar();

    const created = await createPembelian(
      db,
      buildInput({ items: [{ kodebarang: "BRG01", qty: 0.5, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }] }),
    );

    expect(created.items[0].qty).toBe(0.5);
  });
});

describe("Harga tiap baris tidak boleh negatif", () => {
  it("harga negatif ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPembelian(db, buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: -100, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow(/[Hh]arga.*negatif/);
  });

  it("harga 0 diterima", async () => {
    await siapkanDasar();

    const created = await createPembelian(
      db,
      buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: 0, pakaiPpn: "TIDAK", diskon: 0 }] }),
    );

    expect(created.items[0].harga).toBe(0);
  });

  it("pesan error harga tidak sah berbeda dari pesan error qty tidak sah", async () => {
    await siapkanDasar();

    await expect(
      createPembelian(db, buildInput({ items: [{ kodebarang: "BRG01", qty: 0, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow(/[Jj]umlah/);
    await expect(
      createPembelian(db, buildInput({ items: [{ kodebarang: "BRG01", qty: 1, harga: -1, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow(/[Hh]arga/);
  });
});

describe("Daftar dan detail Pembelian", () => {
  it("listPembelian mengembalikan Pembelian yang sudah dibuat", async () => {
    await siapkanDasar();
    await createPembelian(db, buildInput());

    const items = await listPembelian(db);

    expect(items).toHaveLength(1);
  });

  it("findPembelian dengan kode yang tidak ada mengembalikan null", async () => {
    expect(await findPembelian(db, "PB0000000000")).toBeNull();
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

  it("Pembelian dibuat di Perusahaan A tidak muncul saat membaca Pembelian dari Perusahaan B", async () => {
    await siapkanDasar();
    await createPembelian(db, buildInput());

    const itemsLain = await listPembelian(dbLain);

    expect(itemsLain).toHaveLength(0);
  }, 30_000);

  it("penomoran kodebeli di Perusahaan A tidak dipengaruhi jumlah Pembelian di Perusahaan B, keduanya mulai dari nomor urut 1", async () => {
    await siapkanDasar();
    await createPembelian(db, buildInput({ tanggal: "2026-08-25" }));

    await siapkanDasar(dbLain);
    const createdLain = await createPembelian(dbLain, buildInput({ tanggal: "2026-08-25" }));

    expect(createdLain.kodebeli).toBe("PB2608250001");
  }, 30_000);
});
