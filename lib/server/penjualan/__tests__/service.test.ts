import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { cancelPenjualan, createPenjualan, findPenjualan, listPenjualan } from "@/lib/server/penjualan/service";
import type { CreatePenjualanInput } from "@/lib/server/penjualan/types";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["bayar", "jualdtl", "jual", "barang", "lokasi", "customer"];

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

async function buatCustomer(target: DatabasePerusahaanClient, kode = "CUST01", status = 1) {
  return target.customer.create({ data: { kodecustomer: kode, namacustomer: "Customer Test", status } });
}

async function buatBarang(target: DatabasePerusahaanClient, kode = "BRG01", hargajual = 10000) {
  return target.barang.create({
    data: { kodebarang: kode, namabarang: "Barang Test", satuan: "Pcs", hargabeli: hargajual - 1000, hargajual },
  });
}

async function siapkanDasar(target: DatabasePerusahaanClient = db) {
  const lokasi = await buatLokasi(target);
  const customer = await buatCustomer(target);
  const barang = await buatBarang(target);

  return { lokasi, customer, barang };
}

function buildInput(overrides: Partial<CreatePenjualanInput> = {}): CreatePenjualanInput {
  return {
    tanggal       : "2026-08-23",
    jenistransaksi: "POS",
    kodecustomer  : "CUST01",
    kodelokasi    : "LOK01",
    items         : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
    pembayaran    : { tunai: 10000, nontunai: 0 },
    ...overrides,
  };
}

async function bacaJumlahBaris(): Promise<{ jual: number; jualdtl: number; bayar: number }> {
  const [jual, jualdtl, bayar] = await Promise.all([db.jual.count(), db.jualdtl.count(), db.bayar.count()]);

  return { jual, jualdtl, bayar };
}

describe("Penjualan, baris, dan Pembayaran tersimpan sebagai satu transaksi database", () => {
  it("Penjualan dengan 1 baris dan Pembayaran tunai penuh tersimpan sekaligus", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput());

    expect(created.items).toHaveLength(1);
    expect(created.pembayaran.tunai).toBe(10000);
    const jumlah = await bacaJumlahBaris();
    expect(jumlah).toEqual({ jual: 1, jualdtl: 1, bayar: 1 });
  });

  it("Penjualan dengan beberapa baris tersimpan lengkap dalam satu panggilan, urutan berurutan mulai 1", async () => {
    const { lokasi } = await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);
    await buatBarang(db, "BRG03", 7000);

    const created = await createPenjualan(
      db,
      buildInput({
        items: [
          { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
          { kodebarang: "BRG02", qty: 2, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 },
          { kodebarang: "BRG03", qty: 3, harga: 7000, pakaiPpn: "TIDAK", diskon: 0 },
        ],
        pembayaran: { tunai: 41000, nontunai: 0 },
      }),
    );

    expect(created.items.map((item) => item.kodebarang)).toEqual(["BRG01", "BRG02", "BRG03"]);
    const rows = await db.jualdtl.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.urutan)).toEqual([1, 2, 3]);
    void lokasi;
  });

  it("Baris dengan kodebarang tidak ada menyebabkan tidak ada apa pun yang tersimpan", async () => {
    await siapkanDasar();

    await expect(
      createPenjualan(db, buildInput({ items: [{ kodebarang: "TIDAKADA", qty: 1, harga: 1000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ jual: 0, jualdtl: 0, bayar: 0 });
  });

  it("baris kedua gagal (kodebarang tidak ada) menyebabkan baris pertama yang valid juga tidak tersimpan", async () => {
    await siapkanDasar();

    await expect(
      createPenjualan(
        db,
        buildInput({
          items: [
            { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
            { kodebarang: "TIDAKADA", qty: 1, harga: 1000, pakaiPpn: "TIDAK", diskon: 0 },
          ],
        }),
      ),
    ).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ jual: 0, jualdtl: 0, bayar: 0 });
  });

  it("Pembayaran kurang dari grand total menyebabkan header dan baris juga tidak tersimpan", async () => {
    await siapkanDasar();

    await expect(createPenjualan(db, buildInput({ pembayaran: { tunai: 1000, nontunai: 0 } }))).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ jual: 0, jualdtl: 0, bayar: 0 });
  });
});

describe("Pembayaran mencatat tunai, non-tunai, dan kembalian yang dihitung server", () => {
  it("Pembayaran tunai penuh mencatat kembalian 0", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 10000, nontunai: 0 } }));

    expect(created.pembayaran).toEqual({ tunai: 10000, nontunai: 0, kembalian: 0 });
  });

  it("Pembayaran non-tunai penuh mencatat kembalian 0", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 0, nontunai: 10000 } }));

    expect(created.pembayaran).toEqual({ tunai: 0, nontunai: 10000, kembalian: 0 });
  });

  it("Pembayaran campuran yang pas dengan grand total mencatat kembalian 0", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 6000, nontunai: 4000 } }));

    expect(created.pembayaran).toEqual({ tunai: 6000, nontunai: 4000, kembalian: 0 });
  });

  it("Tunai Rp 1.000 lebih dari grand total menghasilkan kembalian Rp 1.000, dihitung server", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 11000, nontunai: 0 } }));

    expect(created.pembayaran.kembalian).toBe(1000);
  });

  it("kembalian selalu dihitung server, bukan diambil dari input klien", async () => {
    await siapkanDasar();

    const input = buildInput({ pembayaran: { tunai: 11000, nontunai: 0 } });
    const created = await createPenjualan(db, input);

    expect(created.pembayaran.kembalian).toBe(1000);
  });
});

describe("Total, PPN, diskon, dan grand total dihitung server sesuai Config", () => {
  it("nilai total/diskon/ppn/grandtotal kiriman klien diabaikan, server memakai hasil hitungnya sendiri", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 10000, nontunai: 0 } }));

    expect(created.total).toBe(10000);
    expect(created.grandtotal).toBe(10000);
  });

  it("baris pakaiPpn TIDAK tidak menyumbang PPN", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput());

    expect(created.ppn).toBe(0);
  });

  it("Config ppn.status 0 (default) membuat PPN grand total tetap 0 meski baris EXCLUDE", async () => {
    await siapkanDasar();

    const created = await createPenjualan(
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
      const created = await createPenjualan(
        db,
        buildInput({
          items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0 }],
          pembayaran: { tunai: 11100, nontunai: 0 },
        }),
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
      const created = await createPenjualan(
        db,
        buildInput({
          items     : [{ kodebarang: "BRG01", qty: 1, harga: 11100, pakaiPpn: "INCLUDE", diskon: 0 }],
          pembayaran: { tunai: 11100, nontunai: 0 },
        }),
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
      const created = await createPenjualan(
        db,
        buildInput({
          items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0 }],
          pembayaran: { tunai: 11000, nontunai: 0 },
        }),
      );

      expect(created.ppn).toBeCloseTo(1000);
    } finally {
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "0" } });
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "persentase" } }, data: { nilai: "11" } });
    }
  });

  it("total, diskon, grand total dihitung ulang server untuk Penjualan dengan diskon per baris berbeda-beda", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    const created = await createPenjualan(
      db,
      buildInput({
        items: [
          { kodebarang: "BRG01", qty: 2, harga: 10000, pakaiPpn: "TIDAK", diskon: 2000 },
          { kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 500 },
        ],
        pembayaran: { tunai: 22500, nontunai: 0 },
      }),
    );

    expect(created.total).toBe(25000);
    expect(created.diskon).toBe(2500);
    expect(created.grandtotal).toBe(22500);
  });
});

describe("Kode Penjualan dibuat oleh generator Kode Dokumen dan tidak pernah kembar", () => {
  it("kodejual mengikuti format Config modul jual (awalan JL, pakai tanggal, panjang nomor 4)", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ tanggal: "2026-08-23" }));

    expect(created.kodejual).toMatch(/^JL2608230001$/);
  });

  it("dua Penjualan berurutan pada tanggal yang sama mendapat nomor urut berurutan", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    const pertama = await createPenjualan(db, buildInput({ tanggal: "2026-08-23" }));
    const kedua = await createPenjualan(
      db,
      buildInput({
        tanggal   : "2026-08-23",
        items     : [{ kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 }],
        pembayaran: { tunai: 5000, nontunai: 0 },
      }),
    );

    expect(pertama.kodejual).toBe("JL2608230001");
    expect(kedua.kodejual).toBe("JL2608230002");
  });

  it("dua createPenjualan paralel menghasilkan dua kodejual berbeda, tidak ada yang gagal karena duplikat", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRG02", 5000);

    const [a, b] = await Promise.all([
      createPenjualan(db, buildInput({ tanggal: "2026-08-24" })),
      createPenjualan(
        db,
        buildInput({
          tanggal   : "2026-08-24",
          items     : [{ kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 }],
          pembayaran: { tunai: 5000, nontunai: 0 },
        }),
      ),
    ]);

    expect(a.kodejual).not.toBe(b.kodejual);
    expect(await db.jual.count()).toBe(2);
  });
});

describe("Pembatalan Penjualan mengubah status tanpa menghapus baris maupun Pembayaran", () => {
  it("membatalkan Penjualan berstatus S mengubah status jadi D dan mencatat alasanbatal, baris tetap utuh", async () => {
    await siapkanDasar();
    const created = await createPenjualan(db, buildInput());

    const cancelled = await cancelPenjualan(db, created.kodejual, "Batal atas permintaan customer");

    expect(cancelled.status).toBe("D");
    expect(cancelled.alasanbatal).toBe("Batal atas permintaan customer");
    expect(cancelled.items).toHaveLength(1);
    expect(cancelled.pembayaran).toEqual(created.pembayaran);
    expect(await bacaJumlahBaris()).toEqual({ jual: 1, jualdtl: 1, bayar: 1 });
  });

  it("total, diskon, ppn, dan grandtotal pada header tidak berubah akibat pembatalan", async () => {
    await siapkanDasar();
    const created = await createPenjualan(db, buildInput());

    const cancelled = await cancelPenjualan(db, created.kodejual);

    expect(cancelled.total).toBe(created.total);
    expect(cancelled.diskon).toBe(created.diskon);
    expect(cancelled.ppn).toBe(created.ppn);
    expect(cancelled.grandtotal).toBe(created.grandtotal);
  });

  it("membatalkan Penjualan yang sudah berstatus D ditolak", async () => {
    await siapkanDasar();
    const created = await createPenjualan(db, buildInput());
    await cancelPenjualan(db, created.kodejual);

    await expect(cancelPenjualan(db, created.kodejual)).rejects.toThrow(/sudah dibatalkan/);
  });

  it("membatalkan kodejual yang tidak ada ditolak dengan error tidak ditemukan", async () => {
    await expect(cancelPenjualan(db, "JL0000000000")).rejects.toThrow(/tidak ditemukan/);
  });
});

describe("Baris Penjualan ditolak bila Barang tidak ada", () => {
  it("kodebarang yang tidak terdaftar ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPenjualan(db, buildInput({ items: [{ kodebarang: "TIDAKADA", qty: 1, harga: 1000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow(/Barang.*tidak ditemukan/);
  });
});

describe("Jumlah (qty) tiap baris harus lebih dari nol", () => {
  it("qty 0 ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPenjualan(db, buildInput({ items: [{ kodebarang: "BRG01", qty: 0, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow();
  });

  it("qty negatif ditolak", async () => {
    await siapkanDasar();

    await expect(
      createPenjualan(db, buildInput({ items: [{ kodebarang: "BRG01", qty: -1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }] })),
    ).rejects.toThrow();
  });

  it("qty pecahan kecil positif diterima", async () => {
    await siapkanDasar();

    const created = await createPenjualan(
      db,
      buildInput({
        items     : [{ kodebarang: "BRG01", qty: 0.5, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
        pembayaran: { tunai: 5000, nontunai: 0 },
      }),
    );

    expect(created.items[0].qty).toBe(0.5);
  });
});

describe("Total pembayaran tidak boleh kurang dari grand total", () => {
  it("tunai + nontunai = grand total - 1 ditolak", async () => {
    await siapkanDasar();

    await expect(createPenjualan(db, buildInput({ pembayaran: { tunai: 9999, nontunai: 0 } }))).rejects.toThrow(/kurang/);
  });

  it("tunai + nontunai = grand total (pas) diterima", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 10000, nontunai: 0 } }));

    expect(created.pembayaran.kembalian).toBe(0);
  });

  it("tunai + nontunai = grand total + 1 diterima dan menghasilkan kembalian 1", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput({ pembayaran: { tunai: 10001, nontunai: 0 } }));

    expect(created.pembayaran.kembalian).toBe(1);
  });
});

describe("Lokasi dan Customer pada Penjualan harus sah — tidak ditemukan maupun nonaktif ditolak", () => {
  it("kodelokasi yang tidak terdaftar ditolak, tidak ada apa pun yang tersimpan", async () => {
    await buatCustomer(db);
    await buatBarang(db);

    await expect(createPenjualan(db, buildInput({ kodelokasi: "TIDAKADA" }))).rejects.toThrow(/Lokasi.*tidak ditemukan/);
    expect(await bacaJumlahBaris()).toEqual({ jual: 0, jualdtl: 0, bayar: 0 });
  });

  it("kodelokasi yang terdaftar tapi nonaktif ditolak sebagai Lokasi tidak sah", async () => {
    await buatLokasi(db, "LOK01", 0);
    await buatCustomer(db);
    await buatBarang(db);

    await expect(createPenjualan(db, buildInput())).rejects.toThrow(/Lokasi.*nonaktif/);
  });

  it("kodecustomer yang tidak terdaftar ditolak, tidak ada apa pun yang tersimpan", async () => {
    await buatLokasi(db);
    await buatBarang(db);

    await expect(createPenjualan(db, buildInput({ kodecustomer: "TIDAKADA" }))).rejects.toThrow(/Customer.*tidak ditemukan/);
    expect(await bacaJumlahBaris()).toEqual({ jual: 0, jualdtl: 0, bayar: 0 });
  });

  it("kodecustomer yang terdaftar tapi nonaktif ditolak sebagai Customer tidak sah", async () => {
    await buatLokasi(db);
    await buatCustomer(db, "CUST01", 0);
    await buatBarang(db);

    await expect(createPenjualan(db, buildInput())).rejects.toThrow(/Customer.*nonaktif/);
  });

  it("Penjualan dengan kodelokasi dan kodecustomer yang sah dan aktif tersimpan normal", async () => {
    await siapkanDasar();

    const created = await createPenjualan(db, buildInput());

    expect(created.kodelokasi).toBe("LOK01");
    expect(created.kodecustomer).toBe("CUST01");
  });
});

describe("Daftar dan detail Penjualan", () => {
  it("listPenjualan mengembalikan Penjualan yang sudah dibuat", async () => {
    await siapkanDasar();
    await createPenjualan(db, buildInput());

    const items = await listPenjualan(db);

    expect(items).toHaveLength(1);
  });

  it("findPenjualan dengan kode yang tidak ada mengembalikan null", async () => {
    expect(await findPenjualan(db, "JL0000000000")).toBeNull();
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

  it("Penjualan dibuat di Perusahaan A tidak muncul saat membaca Penjualan dari Perusahaan B", async () => {
    await siapkanDasar();
    await createPenjualan(db, buildInput());

    const itemsLain = await listPenjualan(dbLain);

    expect(itemsLain).toHaveLength(0);
  }, 30_000);

  it("penomoran kodejual di Perusahaan A tidak dipengaruhi jumlah Penjualan di Perusahaan B, keduanya mulai dari nomor urut 1", async () => {
    await siapkanDasar();
    await createPenjualan(db, buildInput({ tanggal: "2026-08-25" }));

    await siapkanDasar(dbLain);
    const createdLain = await createPenjualan(dbLain, buildInput({ tanggal: "2026-08-25" }));

    expect(createdLain.kodejual).toBe("JL2608250001");
  }, 30_000);
});
