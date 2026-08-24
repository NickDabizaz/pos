import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { PrismaClient as GlobalPrismaClient } from "@/lib/generated/prisma-global/client";
import { createPenjualan } from "@/lib/server/penjualan/service";
import type { CreatePenjualanInput } from "@/lib/server/penjualan/types";
import {
  cancelCloseShift,
  closeShift,
  getShiftStatus,
  openShift,
} from "@/lib/server/shift/service";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, setUpMigratedDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["bayar", "jualdtl", "jual", "setorankasir", "modalawal", "barang", "customer", "lokasi"];

let db: DatabasePerusahaanClient;
let globalDb: GlobalPrismaClient;
let tearDownGlobal: () => Promise<void>;

beforeAll(async () => {
  db = getTestDb();
  ({ prisma: globalDb, tearDown: tearDownGlobal } = await setUpMigratedDatabase(
    "global",
    (adapter) => new GlobalPrismaClient({ adapter }),
  ));
}, 60_000);

afterAll(async () => {
  await tearDownGlobal();
});

beforeEach(async () => {
  await globalDb.user.create({ data: { id: "kasir-1", name: "Budi Kasir", email: "budi@norvyn.test", emailVerified: false } });
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
  await globalDb.user.deleteMany();
});

async function buatLokasi(target: DatabasePerusahaanClient, kode = "LOK01", status = 1) {
  return target.lokasi.create({ data: { kodelokasi: kode, namalokasi: "Lokasi Test", status } });
}

async function buatCustomer(target: DatabasePerusahaanClient, kode = "CUST01") {
  return target.customer.create({ data: { kodecustomer: kode, namacustomer: "Customer Test", status: 1 } });
}

async function buatBarang(target: DatabasePerusahaanClient, kode = "BRG01", hargajual = 10000) {
  return target.barang.create({
    data: { kodebarang: kode, namabarang: "Barang Test", satuan: "Pcs", hargabeli: hargajual - 1000, hargajual },
  });
}

async function siapkanDasar(target: DatabasePerusahaanClient = db) {
  await buatLokasi(target);
  await buatCustomer(target);
  await buatBarang(target);
}

async function buatPenjualan(overrides: Partial<CreatePenjualanInput> = {}) {
  return createPenjualan(db, {
    tanggal       : "2026-08-23",
    jenistransaksi: "POS",
    kodecustomer  : "CUST01",
    kodelokasi    : "LOK01",
    items         : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
    pembayaran    : { tunai: 10000, nontunai: 0 },
    ...overrides,
  });
}

const TANGGAL = "2026-08-23";

function openInput(overrides: Partial<Parameters<typeof openShift>[2]> = {}) {
  return { tanggal: TANGGAL, kodelokasi: "LOK01", idkasir: "kasir-1", modalawal: 200000, ...overrides };
}

describe("Membuka Shift mencatat Modal Awal beserta tanggal, Lokasi, dan Kasir dari sesi login", () => {
  it("Buka Shift pertama hari ini tersimpan dengan tanggal, kodelokasi, idkasir, dan nominal sesuai input", async () => {
    await buatLokasi(db);

    const shift = await openShift(db, globalDb, openInput());

    expect(shift.status).toBe("TERBUKA");
    expect(shift.tanggal).toBe(TANGGAL);
    expect(shift.kodelokasi).toBe("LOK01");
    expect(shift.idkasir).toBe("kasir-1");
    expect(shift.modalawal).toBe(200000);
  });

  it("Modal Awal dengan nominal 0 diterima", async () => {
    await buatLokasi(db);

    const shift = await openShift(db, globalDb, openInput({ modalawal: 0 }));

    expect(shift.modalawal).toBe(0);
  });

  it("Modal Awal dengan nominal negatif ditolak", async () => {
    await buatLokasi(db);

    await expect(openShift(db, globalDb, openInput({ modalawal: -1 }))).rejects.toThrow(/negatif/);
  });
});

describe("Membuka Shift kedua untuk tanggal dan Lokasi yang sama ditolak oleh database", () => {
  it("Buka Shift di Lokasi yang masih terbuka ditolak", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());

    await expect(openShift(db, globalDb, openInput())).rejects.toThrow(/sudah terbuka/);
  });

  it("Buka Shift di Lokasi yang sudah ditutup hari ini tetap ditolak", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());
    await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    await expect(openShift(db, globalDb, openInput())).rejects.toThrow(/sudah ditutup/);
  });

  it("Buka Shift dengan kodelokasi yang tidak terdaftar ditolak", async () => {
    await expect(openShift(db, globalDb, openInput({ kodelokasi: "TIDAKADA" }))).rejects.toThrow(/tidak ditemukan/);
  });

  it("Buka Shift dengan kodelokasi yang nonaktif ditolak", async () => {
    await buatLokasi(db, "LOK01", 0);

    await expect(openShift(db, globalDb, openInput())).rejects.toThrow(/nonaktif/);
  });

  it("dua openShift dipanggil paralel untuk Lokasi dan tanggal yang sama menghasilkan tepat satu sukses", async () => {
    await buatLokasi(db);

    const hasil = await Promise.allSettled([
      openShift(db, globalDb, openInput()),
      openShift(db, globalDb, openInput()),
    ]);

    const sukses = hasil.filter((r) => r.status === "fulfilled");
    const gagal = hasil.filter((r) => r.status === "rejected");
    expect(sukses).toHaveLength(1);
    expect(gagal).toHaveLength(1);
  });
});

describe("Shift dianggap terbuka selama Modal Awal-nya belum punya Setoran Kasir", () => {
  it("status BELUM_DIBUKA ketika belum ada Modal Awal hari ini", async () => {
    await buatLokasi(db);

    const status = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(status.status).toBe("BELUM_DIBUKA");
  });

  it("status TERBUKA ketika Modal Awal ada tanpa Setoran Kasir", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());

    const status = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(status.status).toBe("TERBUKA");
  });

  it("status TERTUTUP ketika Modal Awal dan Setoran Kasir sudah ada", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());
    await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    const status = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(status.status).toBe("TERTUTUP");
  });

  it("status Shift untuk kodelokasi yang nonaktif ditolak", async () => {
    await buatLokasi(db, "LOK01", 0);

    await expect(getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" })).rejects.toThrow(/nonaktif/);
  });
});

describe("Pratinjau total di layar Tutup Kasir sama dengan total sungguhan saat submit", () => {
  it("status Shift terbuka mengembalikan totaltunai/totalnontunai/jumlahtransaksi dari Penjualan tersimpan", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput());
    await buatPenjualan({ pembayaran: { tunai: 10000, nontunai: 0 } });

    const status = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(status.totaltunai).toBe(10000);
    expect(status.totalnontunai).toBe(0);
    expect(status.jumlahtransaksi).toBe(1);
  });

  it("total pratinjau dan total Setoran Kasir sungguhan identik untuk Penjualan yang sama", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput());
    await buatPenjualan({ pembayaran: { tunai: 10000, nontunai: 0 } });

    const preview = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });
    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 210000 });

    expect(closed.totaltunai).toBe(preview.totaltunai);
    expect(closed.totalnontunai).toBe(preview.totalnontunai);
  });

  it("Penjualan baru setelah pratinjau dibaca tetap ikut terhitung saat closeShift dipanggil", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput());

    const preview = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });
    expect(preview.totaltunai).toBe(0);

    await buatPenjualan({ pembayaran: { tunai: 10000, nontunai: 0 } });
    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 210000 });

    expect(closed.totaltunai).toBe(10000);
  });
});

describe("Tutup Kasir menjumlahkan Pembayaran tunai dan non-tunai dari seluruh Penjualan pada tanggal dan Lokasi tersebut", () => {
  it("beberapa Penjualan tunai dan non-tunai hari itu dijumlahkan benar", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput());
    await buatPenjualan({ pembayaran: { tunai: 10000, nontunai: 0 } });
    await buatPenjualan({ pembayaran: { tunai: 0, nontunai: 10000 } });

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 210000 });

    expect(closed.totaltunai).toBe(10000);
    expect(closed.totalnontunai).toBe(10000);
  });

  it("tanpa Penjualan sama sekali hari itu totaltunai dan totalnontunai 0", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    expect(closed.totaltunai).toBe(0);
    expect(closed.totalnontunai).toBe(0);
  });

  it("Penjualan berstatus dibatalkan tidak ikut dijumlahkan", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput());
    const penjualan = await buatPenjualan({ pembayaran: { tunai: 10000, nontunai: 0 } });
    const { cancelPenjualan } = await import("@/lib/server/penjualan/service");
    await cancelPenjualan(db, penjualan.kodejual);

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    expect(closed.totaltunai).toBe(0);
  });

  it("Pembayaran dari Penjualan di Lokasi lain pada tanggal yang sama tidak ikut dijumlahkan", async () => {
    await siapkanDasar();
    await buatLokasi(db, "LOK02");
    await openShift(db, globalDb, openInput());
    await buatPenjualan({ kodelokasi: "LOK02", pembayaran: { tunai: 10000, nontunai: 0 } });

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    expect(closed.totaltunai).toBe(0);
  });

  it("Pembayaran dari Penjualan di Lokasi yang sama pada tanggal lain tidak ikut dijumlahkan", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput());
    await buatPenjualan({ tanggal: "2026-08-22", pembayaran: { tunai: 10000, nontunai: 0 } });

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    expect(closed.totaltunai).toBe(0);
  });
});

describe("Selisih dihitung terhadap Modal Awal ditambah total tunai sistem", () => {
  it("kasaktual sama persis dengan (modalawal + totaltunai) menghasilkan selisih 0", async () => {
    await siapkanDasar();
    await openShift(db, globalDb, openInput({ modalawal: 200000 }));
    await buatPenjualan({ pembayaran: { tunai: 10000, nontunai: 0 } });

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 210000 });

    expect(closed.selisih).toBe(0);
  });

  it("kasaktual lebih besar menghasilkan selisih positif", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput({ modalawal: 200000 }));

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 205000 });

    expect(closed.selisih).toBe(5000);
  });

  it("kasaktual lebih kecil menghasilkan selisih negatif", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput({ modalawal: 200000 }));

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 195000 });

    expect(closed.selisih).toBe(-5000);
  });

  it("kasaktual negatif ditolak", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());

    await expect(
      closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: -1 }),
    ).rejects.toThrow(/negatif/);
  });
});

describe("Menutup Shift yang sudah tertutup ditolak", () => {
  it("Tutup Shift yang belum pernah dibuka ditolak", async () => {
    await buatLokasi(db);

    await expect(
      closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 }),
    ).rejects.toThrow(/belum dibuka/);
  });

  it("Tutup Shift dengan kodelokasi yang nonaktif ditolak", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());
    await db.lokasi.update({ where: { kodelokasi: "LOK01" }, data: { status: 0 } });

    await expect(
      closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 }),
    ).rejects.toThrow(/nonaktif/);
  });

  it("Tutup Shift yang Setoran Kasir-nya sudah ada ditolak, Setoran Kasir lama tidak berubah", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());
    const pertama = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    await expect(
      closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 999999 }),
    ).rejects.toThrow(/sudah ditutup/);

    const status = await getShiftStatus(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });
    expect(status.kasaktual).toBe(pertama.kasaktual);
  });

  it("dua closeShift dipanggil paralel untuk Modal Awal yang sama menghasilkan tepat satu sukses", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());

    const hasil = await Promise.allSettled([
      closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 }),
      closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 }),
    ]);

    expect(hasil.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(hasil.filter((r) => r.status === "rejected")).toHaveLength(1);
  });
});

describe("Batal Tutup Kasir mengembalikan Shift ke status terbuka", () => {
  it("membatalkan penutupan menghapus Setoran Kasir dan status kembali TERBUKA", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());
    await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    const dibatalkan = await cancelCloseShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(dibatalkan.status).toBe("TERBUKA");
  });

  it("Modal Awal tidak berubah maupun terhapus saat Batal Tutup Kasir", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput({ modalawal: 200000 }));
    await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    const dibatalkan = await cancelCloseShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(dibatalkan.modalawal).toBe(200000);
  });

  it("membatalkan penutupan yang belum pernah ditutup ditolak", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());

    await expect(cancelCloseShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" })).rejects.toThrow(/belum ditutup/);
  });

  it("membatalkan penutupan untuk Shift yang belum pernah dibuka ditolak", async () => {
    await buatLokasi(db);

    await expect(cancelCloseShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" })).rejects.toThrow(/belum pernah dibuka/);
  });

  it("membatalkan penutupan dengan kodelokasi yang nonaktif ditolak", async () => {
    await buatLokasi(db);
    await openShift(db, globalDb, openInput());
    await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });
    await db.lokasi.update({ where: { kodelokasi: "LOK01" }, data: { status: 0 } });

    await expect(cancelCloseShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" })).rejects.toThrow(/nonaktif/);
  });
});

describe("Nama Kasir diambil dari Database Global lewat satu jalur lookup", () => {
  it("idkasir yang Penggunanya ada di Database Global mengembalikan nama Pengguna tersebut", async () => {
    await buatLokasi(db);

    const shift = await openShift(db, globalDb, openInput());

    expect(shift.namakasir).toBe("Budi Kasir");
  });

  it("idkasir yang Penggunanya tidak ada di Database Global mengembalikan nilai fallback", async () => {
    await buatLokasi(db);

    const shift = await openShift(db, globalDb, openInput({ idkasir: "tidak-ada" }));

    expect(shift.namakasir).toBeTruthy();
    expect(shift.namakasir).not.toBe("");
  });

  it("nama Kasir pada status terbuka dan pada Setoran Kasir untuk idkasir yang sama berasal dari jalur lookup yang sama", async () => {
    await buatLokasi(db);
    const dibuka = await openShift(db, globalDb, openInput());
    const ditutup = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    expect(ditutup.namakasir).toBe(dibuka.namakasir);
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

  it("Buka Shift di Perusahaan A tidak memengaruhi status Shift Perusahaan B dengan kodelokasi dan tanggal yang sama", async () => {
    await buatLokasi(db);
    await buatLokasi(dbLain);
    await openShift(db, globalDb, openInput());

    const statusLain = await getShiftStatus(dbLain, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    expect(statusLain.status).toBe("BELUM_DIBUKA");
  }, 30_000);

  it("Tutup Shift Perusahaan A hanya menjumlahkan Penjualan dari Database Perusahaan A", async () => {
    await siapkanDasar();
    await siapkanDasar(dbLain);
    await openShift(db, globalDb, openInput());
    await openShift(dbLain, globalDb, openInput());
    await createPenjualan(dbLain, {
      tanggal: TANGGAL, jenistransaksi: "POS", kodecustomer: "CUST01", kodelokasi: "LOK01",
      items: [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "TIDAK", diskon: 0 }],
      pembayaran: { tunai: 10000, nontunai: 0 },
    });

    const closed = await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    expect(closed.totaltunai).toBe(0);
  }, 30_000);

  it("Batal Tutup Kasir di Perusahaan A tidak memengaruhi Setoran Kasir Perusahaan B", async () => {
    await buatLokasi(db);
    await buatLokasi(dbLain);
    await openShift(db, globalDb, openInput());
    await openShift(dbLain, globalDb, openInput());
    await closeShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });
    await closeShift(dbLain, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01", kasaktual: 200000 });

    await cancelCloseShift(db, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });

    const statusLain = await getShiftStatus(dbLain, globalDb, { tanggal: TANGGAL, kodelokasi: "LOK01" });
    expect(statusLain.status).toBe("TERTUTUP");
  }, 30_000);
});
