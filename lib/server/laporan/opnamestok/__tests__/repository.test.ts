import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findBarisLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/repository";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["opnamestokdtl", "opnamestok", "lokasi", "barang"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

async function buatLokasi(kode = "LOK01", nama = "Toko Pusat") {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: kode, namalokasi: nama } });

  return lokasi.idlokasi;
}

async function buatBarang(nama: string) {
  const barang = await db.barang.create({
    data: { kodebarang: `B-${nama}`, namabarang: nama, satuan: "PCS", hargabeli: 1000, hargajual: 1500 },
  });

  return barang.idbarang;
}

describe("repository laporan opname stok", () => {
  it("default hanya detail berselisih; tampilkanSemua memunculkan seluruh detail", async () => {
    const idlokasi = await buatLokasi();
    const [lebih, kurang, sama] = [await buatBarang("Lebih"), await buatBarang("Kurang"), await buatBarang("Sama")];

    await db.opnamestok.create({
      data: {
        kodeopname: "OP2608240001",
        tgltrans  : new Date("2026-08-24"),
        idlokasi,
        details: {
          create: [
            { urutan: 1, idbarang: lebih, satuan: "PCS", jmlsistem: 10, jmlfisik: 12, selisih: 2 },
            { urutan: 2, idbarang: kurang, satuan: "PCS", jmlsistem: 10, jmlfisik: 8, selisih: -2 },
            { urutan: 3, idbarang: sama, satuan: "PCS", jmlsistem: 10, jmlfisik: 10, selisih: 0 },
          ],
        },
      },
    });

    const ringkas = await findBarisLaporanOpnameStok(db);
    expect(ringkas[0].detail).toHaveLength(2);
    expect(ringkas[0].jmlDisembunyikan).toBe(1);

    const semua = await findBarisLaporanOpnameStok(db, { tampilkanSemua: true });
    expect(semua[0].detail).toHaveLength(3);
    expect(semua[0].jmlDisembunyikan).toBe(0);
  });

  it("satuan diambil dari opnamestokdtl, bukan join ke barang", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang("Barang X");

    await db.opnamestok.create({
      data: {
        kodeopname: "OP2608240001",
        tgltrans  : new Date("2026-08-24"),
        idlokasi,
        details: { create: [{ urutan: 1, idbarang, satuan: "DUS", jmlsistem: 5, jmlfisik: 7, selisih: 2 }] },
      },
    });

    await db.barang.update({ where: { idbarang }, data: { satuan: "PCS" } });

    const rows = await findBarisLaporanOpnameStok(db);
    expect(rows[0].detail[0].satuan).toBe("DUS");
  });

  it("Opname D disembunyikan default", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang("Barang Y");

    await db.opnamestok.create({
      data: {
        kodeopname: "OP2608240002",
        tgltrans  : new Date("2026-08-24"),
        idlokasi,
        status    : "D",
        details   : { create: [{ urutan: 1, idbarang, satuan: "PCS", jmlsistem: 5, jmlfisik: 6, selisih: 1 }] },
      },
    });

    expect(await findBarisLaporanOpnameStok(db)).toHaveLength(0);
    expect(await findBarisLaporanOpnameStok(db, { termasukDibatalkan: true })).toHaveLength(1);
  });

  it("idlokasi menyaring ke Lokasi terpilih", async () => {
    const idlokasi = await buatLokasi();
    const lain = await buatLokasi("LOK02", "Gudang");
    const idbarang = await buatBarang("Barang Z");

    for (const [kode, lok] of [["OP2608240001", idlokasi], ["OP2608240002", lain]] as const) {
      await db.opnamestok.create({
        data: {
          kodeopname: kode,
          tgltrans  : new Date("2026-08-24"),
          idlokasi  : lok,
          details   : { create: [{ urutan: 1, idbarang, satuan: "PCS", jmlsistem: 5, jmlfisik: 7, selisih: 2 }] },
        },
      });
    }

    const rows = await findBarisLaporanOpnameStok(db, { idlokasi: [idlokasi] });
    expect(rows.map((row) => row.kodeopname)).toEqual(["OP2608240001"]);
  });
});
