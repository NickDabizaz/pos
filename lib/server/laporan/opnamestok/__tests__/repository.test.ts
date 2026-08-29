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

async function buatLokasi() {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: "LOK01", namalokasi: "Toko Pusat" } });

  return lokasi.idlokasi;
}

async function buatBarang(nama: string) {
  const barang = await db.barang.create({
    data: { kodebarang: `B-${nama}`, namabarang: nama, satuan: "PCS", hargabeli: 1000, hargajual: 1500 },
  });

  return barang.idbarang;
}

describe("repository laporan opname stok", () => {
  it("dokumen 3 barang (lebih, kurang, sama) menghasilkan 3 baris; baris selisih nol tetap tampil", async () => {
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

    const rows = await findBarisLaporanOpnameStok(db);

    expect(rows).toHaveLength(3);
    expect(rows.find((row) => row.namabarang === "Sama")?.selisih).toBe(0);
  });

  it("satuan diambil dari opnamestokdtl, bukan join ke barang — perubahan satuan Barang tidak mengubah laporan lama", async () => {
    const idlokasi = await buatLokasi();
    const idbarang = await buatBarang("Barang X");

    await db.opnamestok.create({
      data: {
        kodeopname: "OP2608240001",
        tgltrans  : new Date("2026-08-24"),
        idlokasi,
        details: { create: [{ urutan: 1, idbarang, satuan: "DUS", jmlsistem: 5, jmlfisik: 5, selisih: 0 }] },
      },
    });

    await db.barang.update({ where: { idbarang }, data: { satuan: "PCS" } });

    const rows = await findBarisLaporanOpnameStok(db);
    expect(rows[0].satuan).toBe("DUS");
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
        details   : { create: [{ urutan: 1, idbarang, satuan: "PCS", jmlsistem: 5, jmlfisik: 5, selisih: 0 }] },
      },
    });

    expect(await findBarisLaporanOpnameStok(db)).toHaveLength(0);
    expect(await findBarisLaporanOpnameStok(db, { termasukDibatalkan: true })).toHaveLength(1);
  });
});
