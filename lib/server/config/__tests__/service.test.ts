import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { bacaTema, listConfig, updateConfig } from "@/lib/server/config/service";
import { buildDefaultConfigRows, createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import {
  disposeDatabasePerusahaanClient,
  getDatabasePerusahaanClient,
  seedDefaultConfig,
} from "@/lib/server/databaseperusahaan/repository";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import { createPenjualan } from "@/lib/server/penjualan/service";
import type { CreatePenjualanInput } from "@/lib/server/penjualan/types";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const TABEL_YANG_DIPAKAI = ["config", "bayar", "jualdtl", "jual", "kartustok", "jurnal", "barang", "lokasi", "customer"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, TABEL_YANG_DIPAKAI);
  await seedDefaultConfig(db, buildDefaultConfigRows());
});

async function buatLokasi(target: DatabasePerusahaanClient): Promise<void> {
  await target.lokasi.create({ data: { kodelokasi: "LOK01", namalokasi: "Lokasi Test", status: 1 } });
}

async function buatCustomer(target: DatabasePerusahaanClient): Promise<void> {
  await target.customer.create({ data: { kodecustomer: "CUST01", namacustomer: "Customer Test", status: 1 } });
}

async function buatBarang(target: DatabasePerusahaanClient): Promise<void> {
  await target.barang.create({
    data: { kodebarang: "BRG01", namabarang: "Barang Test", satuan: "Pcs", hargabeli: 9000, hargajual: 10000 },
  });
}

function buildInput(overrides: Partial<CreatePenjualanInput> = {}): CreatePenjualanInput {
  return {
    tanggal       : "2026-08-26",
    jenistransaksi: "POS",
    kodecustomer  : "CUST01",
    kodelokasi    : "LOK01",
    items         : [{ kodebarang: "BRG01", qty: 1, harga: 10000, pakaiPpn: "EXCLUDE", diskon: 0 }],
    pembayaran    : { tunai: 11000, nontunai: 0 },
    ...overrides,
  };
}

describe("Nilai tidak sah ditolak tanpa mengubah nilai lama", () => {
  it("awalan kosong pada modul barang ditolak dan nilai lama B tetap tersimpan", async () => {
    await updateConfig(db, { modul: "barang", config: "awalan", nilai: "B" });

    await expect(updateConfig(db, { modul: "barang", config: "awalan", nilai: "" })).rejects.toThrow(
      /modul "barang".*kunci "awalan"/i,
    );

    const kelompok = await listConfig(db);
    const barang = kelompok.find((k) => k.modul === "barang");
    const awalan = barang?.items.find((item) => item.config === "awalan");
    expect(awalan?.nilai).toBe("B");
  });

  it("pakaitanggal bernilai 2 ditolak dengan pesan yang menyebut kuncinya dan nilai tersimpan tetap 0", async () => {
    await updateConfig(db, { modul: "jual", config: "pakaitanggal", nilai: "0" });

    await expect(updateConfig(db, { modul: "jual", config: "pakaitanggal", nilai: "2" })).rejects.toThrow(
      /kunci "pakaitanggal"/,
    );

    const kelompok = await listConfig(db);
    const jual = kelompok.find((k) => k.modul === "jual");
    expect(jual?.items.find((item) => item.config === "pakaitanggal")?.nilai).toBe("0");
  });

  it.each(["abc", "0", "-1", "3.5"])("panjangnomor bernilai %s ditolak dengan pesan yang menyebut kuncinya", async (nilai) => {
    await expect(updateConfig(db, { modul: "barang", config: "panjangnomor", nilai })).rejects.toThrow(
      /kunci "panjangnomor"/,
    );
  });

  it("persentase bernilai sepuluh ditolak dengan pesan yang menyebut modul dan kuncinya", async () => {
    await expect(updateConfig(db, { modul: "ppn", config: "persentase", nilai: "sepuluh" })).rejects.toThrow(
      /modul "ppn".*kunci "persentase"/i,
    );
  });

  it("status ppn bernilai aktif ditolak karena hanya 0 atau 1 yang sah", async () => {
    await expect(updateConfig(db, { modul: "ppn", config: "status", nilai: "aktif" })).rejects.toThrow(
      /kunci "status"/,
    );
  });

  it("tema bernilai biru ditolak karena hanya terang atau gelap yang sah", async () => {
    await expect(updateConfig(db, { modul: "tampilan", config: "tema", nilai: "biru" })).rejects.toThrow(
      /kunci "tema"/,
    );
  });

  it("modul pajak tidak dikenal ditolak tanpa menulis apa pun ke tabel config", async () => {
    const jumlahSebelum = await db.config.count();

    await expect(updateConfig(db, { modul: "pajak", config: "persentase", nilai: "11" })).rejects.toThrow(
      /modul "pajak" tidak dikenal/i,
    );

    expect(await db.config.count()).toBe(jumlahSebelum);
  });
});

describe("Nilai pada batas tetap sah", () => {
  it.each(["0", "100"])("persentase bernilai %s diterima dan tersimpan", async (nilai) => {
    const row = await updateConfig(db, { modul: "ppn", config: "persentase", nilai });

    expect(row.nilai).toBe(nilai);
  });

  it("persentase desimal 10.5 diterima sedangkan 101 dan -1 ditolak", async () => {
    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "10.5" });
    const kelompok = await listConfig(db);
    expect(kelompok.find((k) => k.modul === "ppn")?.items.find((i) => i.config === "persentase")?.nilai).toBe("10.5");

    await expect(updateConfig(db, { modul: "ppn", config: "persentase", nilai: "101" })).rejects.toThrow();
    await expect(updateConfig(db, { modul: "ppn", config: "persentase", nilai: "-1" })).rejects.toThrow();
  });

  it("panjangnomor bernilai 1 diterima", async () => {
    const row = await updateConfig(db, { modul: "barang", config: "panjangnomor", nilai: "1" });

    expect(row.nilai).toBe("1");
  });

  it("awalan dengan angka dan tanda hubung BRG-01 diterima", async () => {
    const row = await updateConfig(db, { modul: "customer", config: "awalan", nilai: "BRG-01" });

    expect(row.nilai).toBe("BRG-01");
  });

  it("awalan barang 16 karakter dengan panjangnomor 4 pas di batas kolom kodebarang diterima", async () => {
    const row = await updateConfig(db, { modul: "barang", config: "awalan", nilai: "ABCDEFGHIJKLMNOP" });

    expect(row.nilai).toBe("ABCDEFGHIJKLMNOP");
  });

  it("panjangnomor 5 pada awalan 16 karakter melampaui kolom dan ditolak dengan pesan batas panjang kode", async () => {
    await updateConfig(db, { modul: "barang", config: "awalan", nilai: "ABCDEFGHIJKLMNOP" });

    await expect(updateConfig(db, { modul: "barang", config: "panjangnomor", nilai: "5" })).rejects.toThrow(
      /batas panjang kode|melebihi/i,
    );
  });

  it("pakaitanggal jual dinyalakan saat awalannya 24 karakter ditolak karena tanggal ikut dihitung", async () => {
    await updateConfig(db, { modul: "jual", config: "pakaitanggal", nilai: "0" });
    await updateConfig(db, { modul: "jual", config: "awalan", nilai: "ABCDEFGHIJKLMNOPQRSTUVWX" });

    await expect(updateConfig(db, { modul: "jual", config: "pakaitanggal", nilai: "1" })).rejects.toThrow(
      /batas panjang kode|melebihi/i,
    );
  });
});

async function siapkanPenjualanDanConfigJual(target: DatabasePerusahaanClient): Promise<void> {
  await buatLokasi(target);
  await buatCustomer(target);
  await buatBarang(target);
  await updateConfig(target, { modul: "jual", config: "awalan", nilai: "JL" });
  await updateConfig(target, { modul: "jual", config: "pakaitanggal", nilai: "1" });
  await updateConfig(target, { modul: "jual", config: "panjangnomor", nilai: "4" });
}

describe("Perubahan Config langsung berlaku", () => {
  it("persentase diubah menjadi 10 sehingga Penjualan barang Rp10.000 berikutnya dikenakan PPN Rp1.000", async () => {
    await siapkanPenjualanDanConfigJual(db);
    await updateConfig(db, { modul: "ppn", config: "status", nilai: "1" });
    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "11" });
    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "10" });

    const created = await createPenjualan(db, buildInput());

    expect(created.ppn).toBeCloseTo(1000);
  });

  it("ppn status dinyalakan lalu dimatikan kembali dan Penjualan mengikutinya dua arah", async () => {
    await siapkanPenjualanDanConfigJual(db);
    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "11" });

    await updateConfig(db, { modul: "ppn", config: "status", nilai: "1" });
    const denganPpn = await createPenjualan(
      db,
      buildInput({ pembayaran: { tunai: 11100, nontunai: 0 } }),
    );
    expect(denganPpn.ppn).toBeGreaterThan(0);

    await updateConfig(db, { modul: "ppn", config: "status", nilai: "0" });
    const tanpaPpn = await createPenjualan(
      db,
      buildInput({ pembayaran: { tunai: 10000, nontunai: 0 } }),
    );
    expect(tanpaPpn.ppn).toBe(0);
  });

  it("tema diubah menjadi gelap dan pembacaan berikutnya langsung mengembalikan gelap", async () => {
    await updateConfig(db, { modul: "tampilan", config: "tema", nilai: "gelap" });

    expect(await bacaTema(db)).toBe("gelap");
  });

  it("kunci ppn persentase yang barisnya hilang dibuat ulang oleh updateConfig", async () => {
    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "11" });
    await db.config.delete({ where: { modul_config: { modul: "ppn", config: "persentase" } } });

    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "10" });

    const row = await db.config.findUnique({ where: { modul_config: { modul: "ppn", config: "persentase" } } });
    expect(row?.nilai).toBe("10");
  });
});

async function buatBarangDenganKode(target: DatabasePerusahaanClient, kodebarang: string) {
  return target.barang.create({
    data: { kodebarang, namabarang: `Barang ${kodebarang}`, satuan: "Pcs", hargabeli: 9000, hargajual: 10000 },
  });
}

async function aturFormatBarang(target: DatabasePerusahaanClient, awalan: string, pakaitanggal: "0" | "1", panjangnomor: string) {
  await updateConfig(target, { modul: "barang", config: "awalan", nilai: awalan });
  await updateConfig(target, { modul: "barang", config: "pakaitanggal", nilai: pakaitanggal });
  await updateConfig(target, { modul: "barang", config: "panjangnomor", nilai: panjangnomor });
}

describe("Format baru hanya berlaku untuk dokumen berikutnya", () => {
  it("awalan barang diubah B menjadi RG setelah B0001 sampai B0003 terbit dan Barang berikutnya mendapat RG0001", async () => {
    await buatBarangDenganKode(db, "B0001");
    await buatBarangDenganKode(db, "B0002");
    await buatBarangDenganKode(db, "B0003");
    await aturFormatBarang(db, "B", "0", "4");

    const kode = await simpanDenganKode(db, "barang", new Date("2026-08-26"), (k) =>
      buatBarangDenganKode(db, k).then(() => k),
    );
    expect(kode).toBe("B0004");

    await updateConfig(db, { modul: "barang", config: "awalan", nilai: "RG" });

    const kodeBerikutnya = await simpanDenganKode(db, "barang", new Date("2026-08-26"), (k) =>
      buatBarangDenganKode(db, k).then(() => k),
    );

    expect(kodeBerikutnya).toBe("RG0001");
    const semuaKode = (await db.barang.findMany({ orderBy: { idbarang: "asc" } })).map((b) => b.kodebarang);
    expect(semuaKode).toEqual(["B0001", "B0002", "B0003", "B0004", "RG0001"]);
    const lama = await db.barang.findMany({ where: { kodebarang: { startsWith: "B" } } });
    expect(lama.map((b) => b.kodebarang).sort()).toEqual(["B0001", "B0002", "B0003", "B0004"]);
  });

  it("panjangnomor diubah dari 4 menjadi 6 setelah B0007 dan Barang berikutnya mendapat B000008", async () => {
    await aturFormatBarang(db, "B", "0", "4");
    await buatBarangDenganKode(db, "B0007");
    await updateConfig(db, { modul: "barang", config: "panjangnomor", nilai: "6" });

    const kode = await simpanDenganKode(db, "barang", new Date("2026-08-26"), (k) =>
      buatBarangDenganKode(db, k).then(() => k),
    );

    expect(kode).toBe("B000008");
    const lama = await db.barang.findUnique({ where: { kodebarang: "B0007" } });
    expect(lama?.kodebarang).toBe("B0007");
  });

  it("pakaitanggal jual dimatikan setelah JL2608190003 terbit dan Penjualan berikutnya melanjutkan nomor lama menjadi JL2608190004", async () => {
    await updateConfig(db, { modul: "jual", config: "awalan", nilai: "JL" });
    await updateConfig(db, { modul: "jual", config: "pakaitanggal", nilai: "1" });
    await updateConfig(db, { modul: "jual", config: "panjangnomor", nilai: "4" });
    const lokasi = await db.lokasi.create({ data: { kodelokasi: "LOK01", namalokasi: "Lokasi Test", status: 1 } });
    const customer = await db.customer.create({ data: { kodecustomer: "CUST01", namacustomer: "Customer Test", status: 1 } });
    const tgltrans = new Date("2026-08-19");
    await db.jual.create({
      data: {
        kodejual: "JL2608190003", tgltrans, jenistransaksi: "POS",
        idcustomer: customer.idcustomer, idlokasi: lokasi.idlokasi,
        total: 0, diskon: 0, ppn: 0, grandtotal: 0,
      },
    });
    await updateConfig(db, { modul: "jual", config: "pakaitanggal", nilai: "0" });

    const kode = await simpanDenganKode(db, "jual", tgltrans, async (k) => {
      await db.jual.create({
        data: {
          kodejual: k, tgltrans, jenistransaksi: "POS",
          idcustomer: customer.idcustomer, idlokasi: lokasi.idlokasi,
          total: 0, diskon: 0, ppn: 0, grandtotal: 0,
        },
      });
      return k;
    });

    expect(kode).toBe("JL2608190004");
    const lama = await db.jual.findUnique({ where: { kodejual: "JL2608190003" } });
    expect(lama?.status).toBe("S");
  });

  it("awalan barang diubah saat dua penyimpanan berjalan bersamaan dan kedua kode tetap berbeda tanpa galat unique index", async () => {
    await aturFormatBarang(db, "B", "0", "4");

    const simpan = (k: string) => buatBarangDenganKode(db, k).then(() => k);
    const p1 = simpanDenganKode(db, "barang", new Date("2026-08-26"), simpan);
    const p2 = simpanDenganKode(db, "barang", new Date("2026-08-26"), simpan);
    await updateConfig(db, { modul: "barang", config: "awalan", nilai: "RG" });
    const [k1, k2] = await Promise.all([p1, p2]);

    expect(new Set([k1, k2]).size).toBe(2);
  });

  it("dua perubahan tema bersamaan meninggalkan tepat satu baris tema berisi salah satu nilai yang dikirim", async () => {
    const [hasil] = await Promise.all([
      updateConfig(db, { modul: "tampilan", config: "tema", nilai: "gelap" }),
      updateConfig(db, { modul: "tampilan", config: "tema", nilai: "terang" }),
    ]);

    const rows = await db.config.findMany({ where: { modul: "tampilan", config: "tema" } });
    expect(rows).toHaveLength(1);
    expect(["terang", "gelap"]).toContain(rows[0].nilai);
    void hasil;
  });
});

describe("Isolasi antar Perusahaan dan provisioning segar", () => {
  let dbLain: DatabasePerusahaanClient;
  let namaDbLain: string;

  beforeAll(async () => {
    namaDbLain = uniqueDatabaseName("perusahaan");
    dbLain = await createDatabasePerusahaan(namaDbLain);
  }, 30_000);

  beforeEach(async () => {
    await resetTables(dbLain, ["config"]);
    await seedDefaultConfig(dbLain, buildDefaultConfigRows());
  });

  afterAll(async () => {
    await dropDatabase(namaDbLain);
    await disposeDatabasePerusahaanClient(namaDbLain);
  });

  it("persentase diubah menjadi 8 di Perusahaan A dan Perusahaan B tetap menunjukkan 11", async () => {
    await updateConfig(db, { modul: "ppn", config: "persentase", nilai: "8" });

    const kelompokB = await listConfig(dbLain);
    expect(kelompokB.find((k) => k.modul === "ppn")?.items.find((i) => i.config === "persentase")?.nilai).toBe("11");
  });

  it("tema diubah gelap di Perusahaan A dan tema Perusahaan B tetap terang", async () => {
    await updateConfig(db, { modul: "tampilan", config: "tema", nilai: "gelap" });

    expect(await bacaTema(dbLain)).toBe("terang");
  });

  it("awalan jual diubah XX di Perusahaan A dan Penjualan pertama Perusahaan B tetap dirakit JL2608260001 dari config B sendiri", async () => {
    await updateConfig(db, { modul: "jual", config: "awalan", nilai: "XX" });

    const kode = await simpanDenganKode(dbLain, "jual", new Date("2026-08-26"), async (k) => k);

    expect(kode).toBe("JL2608260001");
  });

  it("tema gelap yang tersimpan tetap terbaca oleh client database yang dibuat baru setelah koneksi lama ditutup", async () => {
    await updateConfig(dbLain, { modul: "tampilan", config: "tema", nilai: "gelap" });

    await disposeDatabasePerusahaanClient(namaDbLain);
    const clientBaru = getDatabasePerusahaanClient(namaDbLain);

    expect(await bacaTema(clientBaru)).toBe("gelap");
  });

  it("listConfig pada Database Perusahaan hasil provisioning mengembalikan 24 baris dalam 9 kelompok modul", async () => {
    const kelompok = await listConfig(dbLain);

    expect(kelompok.map((k) => k.modul)).toEqual([
      "barang", "beli", "customer", "jual", "kas", "lokasi", "ppn", "supplier", "tampilan",
    ]);
    const jumlahBaris = kelompok.reduce((acc, k) => acc + k.items.length, 0);
    expect(jumlahBaris).toBe(24);
    for (const grup of kelompok) {
      if (["beli", "barang", "customer", "jual", "kas", "lokasi", "supplier"].includes(grup.modul)) {
        expect(grup.items.map((i) => i.config)).toEqual(["awalan", "pakaitanggal", "panjangnomor"]);
      }
    }
    expect(kelompok.find((k) => k.modul === "ppn")?.items.map((i) => i.config)).toEqual(["persentase", "status"]);
    expect(kelompok.find((k) => k.modul === "tampilan")?.items.map((i) => i.config)).toEqual(["tema"]);
  });
});

describe("Pengelompokan dan nilai default (shallow)", () => {
  it("baris tampilan tema yang hilang membuat pembacaan untuk tampilan jatuh ke default terang", async () => {
    await resetTables(db, ["config"]);

    expect(await bacaTema(db)).toBe("terang");
  });

  it("seluruh baris config dihapus membuat listConfig mengembalikan daftar kelompok kosong tanpa error", async () => {
    await resetTables(db, ["config"]);

    expect(await listConfig(db)).toEqual([]);
  });

  it("baris jenis baru dimasukkan langsung ke tabel dan tampil pada listConfig tanpa perubahan skema", async () => {
    await db.config.create({ data: { modul: "tampilan", config: "warna", nilai: "#0ea5e9" } });

    const kelompok = await listConfig(db);
    const tampilan = kelompok.find((k) => k.modul === "tampilan");
    expect(tampilan?.items.find((i) => i.config === "warna")?.nilai).toBe("#0ea5e9");
  });

  it("modul baru muncul sebagai kelompok tersendiri pada listConfig", async () => {
    await db.config.create({ data: { modul: "pajakdaerah", config: "persentase", nilai: "0" } });

    const kelompok = await listConfig(db);
    expect(kelompok.find((k) => k.modul === "pajakdaerah")?.items.map((i) => i.config)).toEqual(["persentase"]);
  });
});
