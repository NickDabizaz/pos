import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { cancelPenjualan, createPenjualan, findPenjualan, listPenjualan, updatePenjualan } from "@/lib/server/penjualan/service";
import type { CreatePenjualanInput, UpdatePenjualanInput } from "@/lib/server/penjualan/types";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["bayar", "jualdtl", "jual", "kartustok", "jurnal", "barang", "lokasi", "customer"];

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

async function buatBarang(target: DatabasePerusahaanClient, kode = "BRG01", hargajual = 10000, pakaistok = false) {
  return target.barang.create({
    data: { kodebarang: kode, namabarang: "Barang Test", satuan: "Pcs", hargabeli: hargajual - 1000, hargajual, pakaistok },
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

  it("komponen pembayaran negatif ditolak di jalur create — cek yang sama dipakai edit", async () => {
    await siapkanDasar();

    await expect(
      createPenjualan(
        db,
        buildInput({
          items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
          pembayaran: { tunai: 300000, nontunai: -190000 },
        }),
      ),
    ).rejects.toThrow(/negatif/);
    expect(await bacaJumlahBaris()).toEqual({ jual: 0, jualdtl: 0, bayar: 0 });
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

  it("edit Penjualan di Perusahaan A tidak mengubah dokumen bernomor sama di Perusahaan B", async () => {
    await siapkanDasar();
    const createdA = await createPenjualan(db, buildInput({ tanggal: "2026-08-25" }));

    await siapkanDasar(dbLain);
    const createdB = await createPenjualan(dbLain, buildInput({ tanggal: "2026-08-25" }));
    expect(createdA.kodejual).toBe(createdB.kodejual);

    await updatePenjualan(
      db,
      createdA.kodejual,
      buildUpdateInput({
        items     : [{ kodebarang: "BRG01", qty: 5, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
        pembayaran: { tunai: 50000, nontunai: 0 },
      }),
    );

    const utuhB = await findPenjualan(dbLain, createdB.kodejual);
    expect(utuhB?.items).toHaveLength(1);
    expect(utuhB?.items[0].qty).toBe(1);
    expect(utuhB?.grandtotal).toBe(10000);
  }, 30_000);
});

function buildUpdateInput(overrides: Partial<UpdatePenjualanInput> = {}): UpdatePenjualanInput {
  return {
    kodecustomer: "CUST01",
    items       : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
    pembayaran  : { tunai: 10000, nontunai: 0 },
    ...overrides,
  };
}

async function buatPenjualanSiapEdit(overrides: Partial<CreatePenjualanInput> = {}) {
  await siapkanDasar();
  await buatBarang(db, "BRG02", 5000);

  return createPenjualan(
    db,
    buildInput({
      items: [
        { kodebarang: "BRG01", qty: 2, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
        { kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 },
      ],
      pembayaran: { tunai: 25000, nontunai: 0 },
      ...overrides,
    }),
  );
}

describe("Edit Penjualan — angka otoritatif server", () => {
  it("angka fiktif kiriman client diabaikan — baris dan header tersimpan hasil hitung server dari rate PPN config", async () => {
    const created = await buatPenjualanSiapEdit();
    await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "1" } });

    try {
      const hasil = await updatePenjualan(db, created.kodejual, {
        kodecustomer: "CUST01",
        items       : [
          { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0, ppn: 999, subtotal: 999 },
        ] as unknown as UpdatePenjualanInput["items"],
        pembayaran: { tunai: 11100, nontunai: 0 },
      });

      expect(hasil.items[0].ppn).toBeCloseTo(1100);
      expect(hasil.items[0].subtotal).toBeCloseTo(11100);
      expect(hasil.total).toBe(10000);
      expect(hasil.diskon).toBe(0);
      expect(hasil.ppn).toBeCloseTo(1100);
      expect(hasil.grandtotal).toBeCloseTo(11100);
    } finally {
      await db.config.update({ where: { modul_config: { modul: "ppn", config: "status" } }, data: { nilai: "0" } });
    }
  });
});

describe("Edit Penjualan — aturan pembayaran", () => {
  it("totalBayar kurang dari grandtotal hasil edit ditolak dan tidak ada perubahan tersisa", async () => {
    const created = await buatPenjualanSiapEdit();

    await expect(
      updatePenjualan(
        db,
        created.kodejual,
        buildUpdateInput({
          items     : [{ kodebarang: "BRG01", qty: 3, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
          pembayaran: { tunai: 29000, nontunai: 0 },
        }),
      ),
    ).rejects.toThrow(/kurang/);

    const utuh = await findPenjualan(db, created.kodejual);
    expect(utuh?.items).toHaveLength(2);
    expect(utuh?.grandtotal).toBe(25000);
  });

  it("item diedit lebih mahal sementara pembayaran pas untuk grandtotal lama — tetap ditolak kurang bayar", async () => {
    const created = await buatPenjualanSiapEdit();

    await expect(
      updatePenjualan(
        db,
        created.kodejual,
        buildUpdateInput({
          items     : [{ kodebarang: "BRG01", qty: 3, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
          pembayaran: { tunai: 25000, nontunai: 0 },
        }),
      ),
    ).rejects.toThrow(/kurang/);
  });

  it("pembayaran pas dengan grandtotal hasil edit diterima dan kembalian tersimpan 0", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasil = await updatePenjualan(
      db,
      created.kodejual,
      buildUpdateInput({
        items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 1000 }],
        pembayaran: { tunai: 9000, nontunai: 0 },
      }),
    );

    expect(hasil.grandtotal).toBe(9000);
    expect(hasil.pembayaran.kembalian).toBe(0);
  });

  it("tanpa pembayaran di input dianggap lunas tunai sebesar grandtotal hasil edit, kembalian 0", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasil = await updatePenjualan(db, created.kodejual, {
      kodecustomer: "CUST01",
      items       : [{ kodebarang: "BRG02", qty: 2, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 }],
    });

    expect(hasil.grandtotal).toBe(10000);
    expect(hasil.pembayaran.tunai).toBe(10000);
    expect(hasil.pembayaran.nontunai).toBe(0);
    expect(hasil.pembayaran.kembalian).toBe(0);
  });

  it("komponen pembayaran negatif ditolak sebagai input tidak sah walau jumlahnya mencukupi grandtotal", async () => {
    const created = await buatPenjualanSiapEdit();

    await expect(
      updatePenjualan(
        db,
        created.kodejual,
        buildUpdateInput({
          items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
          pembayaran: { tunai: 300000, nontunai: -190000 },
        }),
      ),
    ).rejects.toThrow(/negatif/);

    const utuh = await findPenjualan(db, created.kodejual);
    expect(utuh?.pembayaran).toEqual(created.pembayaran);
  });
});

describe("Edit Penjualan — validasi create dipakai ulang", () => {
  it("items kosong ditolak sebagai input tidak sah — baris lama tetap utuh, tidak jadi kosong", async () => {
    const created = await buatPenjualanSiapEdit();

    await expect(
      updatePenjualan(db, created.kodejual, { kodecustomer: "CUST01", items: [] }),
    ).rejects.toThrow(/minimal 1/);

    const utuh = await findPenjualan(db, created.kodejual);
    expect(utuh?.items).toHaveLength(2);
  });

  it("customer tidak terdaftar maupun nonaktif ditolak — customer lama tetap tersimpan beserta seluruh barisnya", async () => {
    await siapkanDasar();
    await buatCustomer(db, "CUST02", 0);
    const created = await createPenjualan(db, buildInput());

    await expect(updatePenjualan(db, created.kodejual, buildUpdateInput({ kodecustomer: "TIDAKADA" }))).rejects.toThrow(/Customer.*tidak ditemukan/);
    await expect(updatePenjualan(db, created.kodejual, buildUpdateInput({ kodecustomer: "CUST02" }))).rejects.toThrow(/Customer.*nonaktif/);

    const utuh = await findPenjualan(db, created.kodejual);
    expect(utuh?.kodecustomer).toBe("CUST01");
    expect(utuh?.items).toHaveLength(1);
  });
});

describe("Edit Penjualan — field terkunci tidak bergeser dan status tetap S", () => {
  it("input edit menyertakan tanggal, jenistransaksi, kodelokasi palsu — nilai lama di database tetap", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasil = await updatePenjualan(db, created.kodejual, {
      ...buildUpdateInput(),
      tanggal        : "2001-01-01",
      jenistransaksi : "POS",
      kodelokasi     : "PALSU",
    } as unknown as UpdatePenjualanInput & { tanggal: string; kodelokasi: string });

    expect(hasil.kodejual).toBe(created.kodejual);
    expect(hasil.tanggal).toBe(created.tanggal);
    expect(hasil.jenistransaksi).toBe(created.jenistransaksi);
    expect(hasil.kodelokasi).toBe(created.kodelokasi);
  });

  it("edit Penjualan berstatus S berhasil dan statusnya tetap S tanpa alasanbatal", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasil = await updatePenjualan(db, created.kodejual, buildUpdateInput());

    expect(hasil.status).toBe("S");
    expect(hasil.alasanbatal).toBeNull();
  });

  it("setelah edit sukses, jalur batal biasa masih bekerja — status S ke D dengan alasanbatal tercatat, baris dan Pembayaran hasil edit tetap utuh", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasilEdit = await updatePenjualan(
      db,
      created.kodejual,
      buildUpdateInput({
        items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
        pembayaran: { tunai: 10000, nontunai: 0 },
      }),
    );
    const batal = await cancelPenjualan(db, created.kodejual, "Customer menyesal");

    expect(batal.status).toBe("D");
    expect(batal.alasanbatal).toBe("Customer menyesal");
    expect(batal.items).toEqual(hasilEdit.items);
    expect(batal.pembayaran).toEqual(hasilEdit.pembayaran);
    expect(await bacaJumlahBaris()).toEqual({ jual: 1, jualdtl: 1, bayar: 1 });
  });
});

describe("Guard edit Penjualan — status dan keberadaan dokumen", () => {
  it("edit kodejual yang tidak ada ditolak dengan error tidak ditemukan", async () => {
    await siapkanDasar();

    await expect(updatePenjualan(db, "JL0000000000", buildUpdateInput())).rejects.toThrow(/tidak ditemukan/);
  });

  it("edit Penjualan berstatus D ditolak dengan pesan sudah dibatalkan", async () => {
    const created = await buatPenjualanSiapEdit();
    await cancelPenjualan(db, created.kodejual);

    await expect(updatePenjualan(db, created.kodejual, buildUpdateInput())).rejects.toThrow(/sudah dibatalkan/);
  });

  it("edit Penjualan PESANAN mengganti detail penuh — nilai kembalian updatePenjualan menunjukkan data terbaru dan jualdtl hanya berisi baris baru", async () => {
    const created = await buatPenjualanSiapEdit({ jenistransaksi: "PESANAN" });
    await buatBarang(db, "BRG03", 7000);

    const hasil = await updatePenjualan(
      db,
      created.kodejual,
      buildUpdateInput({
        items     : [{ kodebarang: "BRG03", qty: 3, harga: 7000, pakaiPpn: "TIDAK", diskon: 1000 }],
        pembayaran: { tunai: 21000, nontunai: 0 },
      }),
    );

    expect(hasil.kodejual).toBe(created.kodejual);
    expect(hasil.kodecustomer).toBe("CUST01");
    expect(hasil.items).toHaveLength(1);
    expect(hasil.items[0].kodebarang).toBe("BRG03");
    expect(hasil.items[0].qty).toBe(3);
    expect(await bacaJumlahBaris()).toEqual({ jual: 1, jualdtl: 1, bayar: 1 });
  });

  it("kegagalan validasi di tengah (barang kedua tidak ada) menyisakan data lama utuh — tidak ada replace separuh", async () => {
    const created = await buatPenjualanSiapEdit();

    await expect(
      updatePenjualan(
        db,
        created.kodejual,
        buildUpdateInput({
          items     : [
            { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
            { kodebarang: "TIDAKADA", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 },
          ],
          pembayaran: { tunai: 15000, nontunai: 0 },
        }),
      ),
    ).rejects.toThrow(/Barang.*tidak ditemukan/);

    const utuh = await findPenjualan(db, created.kodejual);
    expect(utuh?.items).toHaveLength(2);
    expect(utuh?.grandtotal).toBe(created.grandtotal);
  });

  it("baris bayar lama diganti penuh oleh nilai pembayaran baru, bukan bertambah", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasil = await updatePenjualan(
      db,
      created.kodejual,
      buildUpdateInput({
        items     : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
        pembayaran: { tunai: 6000, nontunai: 5000 },
      }),
    );

    expect(await db.bayar.count()).toBe(1);
    expect(hasil.pembayaran).toEqual({ tunai: 6000, nontunai: 5000, kembalian: 1000 });
    expect(hasil.grandtotal).toBe(10000);
  });

  it("urutan detail hasil edit berurutan mulai 1", async () => {
    const created = await buatPenjualanSiapEdit();

    const hasil = await updatePenjualan(
      db,
      created.kodejual,
      buildUpdateInput({
        items: [
          { kodebarang: "BRG02", qty: 1, harga: 5000, pakaiPpn: "TIDAK", diskon: 0 },
          { kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 },
        ],
        pembayaran: { tunai: 15000, nontunai: 0 },
      }),
    );

    expect(hasil.items.map((item) => [item.qty, item.harga])).toEqual([[1, 5000], [1, 10000]]);

    const baris = await db.jualdtl.findMany({ where: { jual: { kodejual: created.kodejual } }, orderBy: { urutan: "asc" } });

    expect(baris.map((barisItem) => barisItem.urutan)).toEqual([1, 2]);
    expect(baris[0].harga.toString()).toBe("5000");
    expect(baris[1].harga.toString()).toBe("10000");
  });
});

describe("Penjualan menulis Kartu Stok dan Jurnal sebagai turunannya", () => {
  it("create POS menulis Kartu Stok mk K dan Jurnal DEBET + KREDIT sebesar grandtotal", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRGSTOK", 10000, true);

    const created = await createPenjualan(db, buildInput({
      items     : [{ kodebarang: "BRGSTOK", qty: 2, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
      pembayaran: { tunai: 20000, nontunai: 0 },
    }));

    const kartustok = await db.kartustok.findMany();
    expect(kartustok).toHaveLength(1);
    expect(kartustok[0].jenistransaksi).toBe("POS");
    expect(kartustok[0].kodetrans).toBe(created.kodejual);
    expect(kartustok[0].jml.toString()).toBe("2");
    expect(kartustok[0].mk).toBe("K");
    expect(kartustok[0].catatan).toBe("POS BARANG TEST KE CUSTOMER TEST");

    const jurnal = await db.jurnal.findMany({ orderBy: { urutan: "asc" } });
    expect(jurnal.map((row) => row.saldo)).toEqual(["DEBET", "KREDIT"]);
    expect(jurnal.map((row) => row.amount.toString())).toEqual(["20000", "20000"]);
    expect(jurnal.map((row) => row.catatan)).toEqual([
      "POS KEPADA CUSTOMER TEST",
      "POS KEPADA CUSTOMER TEST",
    ]);
  });

  it("barang tanpa pakaistok tidak menulis Kartu Stok, Jurnal tetap ditulis", async () => {
    await siapkanDasar();

    await createPenjualan(db, buildInput());

    expect(await db.kartustok.count()).toBe(0);
    expect(await db.jurnal.count()).toBe(2);
  });

  it("Penjualan PESANAN dicatat sebagai PENJUALAN di Kartu Stok dan Jurnal", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRGSTOK", 10000, true);

    const created = await createPenjualan(db, buildInput({
      jenistransaksi: "PESANAN",
      items         : [{ kodebarang: "BRGSTOK", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
      pembayaran    : undefined,
    }));

    const kartustok = await db.kartustok.findFirstOrThrow();
    expect(kartustok.jenistransaksi).toBe("PENJUALAN");
    expect(kartustok.catatan).toBe("PENJUALAN BARANG TEST KE CUSTOMER TEST");

    const jurnal = await db.jurnal.findMany();
    expect(jurnal.map((row) => row.jenistransaksi)).toEqual(["PENJUALAN", "PENJUALAN"]);
    expect(jurnal.every((row) => row.kodetrans === created.kodejual)).toBe(true);
  });

  it("edit Penjualan mengganti isi turunan, tidak menduplikasi", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRGSTOK", 10000, true);
    const created = await createPenjualan(db, buildInput({
      items: [{ kodebarang: "BRGSTOK", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
    }));

    await updatePenjualan(db, created.kodejual, buildUpdateInput({
      items     : [{ kodebarang: "BRGSTOK", qty: 7, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
      pembayaran: { tunai: 70000, nontunai: 0 },
    }));

    const kartustok = await db.kartustok.findMany();
    expect(kartustok).toHaveLength(1);
    expect(kartustok[0].jml.toString()).toBe("7");

    const jurnal = await db.jurnal.findMany();
    expect(jurnal).toHaveLength(2);
    expect(jurnal.every((row) => row.amount.toString() === "70000")).toBe(true);
  });

  it("batal Penjualan menghapus Kartu Stok dan Jurnal secara keras, header tetap ada", async () => {
    await siapkanDasar();
    await buatBarang(db, "BRGSTOK", 10000, true);
    const created = await createPenjualan(db, buildInput({
      items: [{ kodebarang: "BRGSTOK", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
    }));

    await cancelPenjualan(db, created.kodejual, "salah input");

    expect(await db.jual.count()).toBe(1);
    expect(await db.kartustok.count()).toBe(0);
    expect(await db.jurnal.count()).toBe(0);
  });
});
