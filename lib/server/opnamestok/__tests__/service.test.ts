import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { hitungSaldoStok } from "@/lib/server/kartustok/repository";
import {
  cancelOpnameStok,
  createOpnameStok,
  findOpnameStok,
  listOpnameStok,
  updateOpnameStok,
} from "@/lib/server/opnamestok/service";
import { getTestDb, resetTables } from "@/lib/test/db";

const DOMAIN_TABLES = ["opnamestokdtl", "opnamestok", "kartustok", "jurnal", "barang", "lokasi"];

let db: DatabasePerusahaanClient;

beforeEach(() => {
  db = getTestDb();
});

afterEach(async () => {
  await resetTables(db, DOMAIN_TABLES);
});

let nomorBarang = 0;
let nomorTrans = 0;

async function buatLokasi(kode = "LOK01", status = 1): Promise<number> {
  const lokasi = await db.lokasi.create({ data: { kodelokasi: kode, namalokasi: `Lokasi ${kode}`, status } });

  return lokasi.idlokasi;
}

async function buatBarang(
  opsi: { kode?: string; pakaistok?: boolean; status?: number; satuan?: string } = {},
): Promise<{ idbarang: number; kodebarang: string }> {
  nomorBarang += 1;
  const kodebarang = opsi.kode ?? `B${String(nomorBarang).padStart(4, "0")}`;
  const barang = await db.barang.create({
    data: {
      kodebarang,
      namabarang: `Barang ${kodebarang}`,
      satuan    : opsi.satuan ?? "PCS",
      hargabeli : 1000,
      hargajual : 1500,
      pakaistok : opsi.pakaistok ?? true,
      status    : opsi.status ?? 1,
    },
  });

  return { idbarang: barang.idbarang, kodebarang };
}

async function gerakStok(
  idbarang: number,
  idlokasi: number,
  mk      : "M" | "K",
  jml     : number,
  tgl     = "2026-08-01",
): Promise<string> {
  nomorTrans += 1;
  const kodetrans = `SEED${nomorTrans}`;
  await db.kartustok.create({
    data: {
      jenistransaksi: mk === "M" ? "PEMBELIAN" : "PENJUALAN",
      idtrans       : nomorTrans,
      urutan        : 1,
      kodetrans,
      tgltrans      : new Date(tgl),
      idlokasi,
      idbarang,
      jml,
      mk,
      catatan       : "SEED",
    },
  });

  return kodetrans;
}

async function kartuStokOpname(kodeopname: string) {
  return db.kartustok.findMany({
    where  : { jenistransaksi: "OPNAME STOK", kodetrans: kodeopname },
    orderBy: { urutan: "asc" },
  });
}

describe("Saldo stok dibaca dari Kartu Stok", () => {
  it("Barang tanpa satu pun Kartu Stok mengembalikan 0", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang } = await buatBarang();

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));

    expect(saldo).toHaveLength(1);
    expect(saldo[0]).toMatchObject({ idbarang, jmlsistem: 0 });
  });

  it("Pembelian 10 lalu Penjualan 3 di Lokasi yang sama menghasilkan saldo 7", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    await gerakStok(idbarang, idlokasi, "K", 3);

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));

    expect(saldo[0].jmlsistem).toBe(7);
  });

  it("Kartu Stok Barang yang sama di Lokasi lain tidak ikut terhitung", async () => {
    const idlokasi = await buatLokasi("LOK01");
    const idlokasiLain = await buatLokasi("LOK02");
    const { idbarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    await gerakStok(idbarang, idlokasiLain, "M", 99);

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));

    expect(saldo[0].jmlsistem).toBe(10);
  });

  it("baris yang dicabut (mis. Pembelian dibatalkan) tidak lagi terhitung", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang } = await buatBarang();
    const dibatalkan = await gerakStok(idbarang, idlokasi, "M", 10);
    await gerakStok(idbarang, idlokasi, "M", 5);
    await db.kartustok.deleteMany({ where: { kodetrans: dibatalkan } });

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));

    expect(saldo[0].jmlsistem).toBe(5);
  });

  it("saldo dikembalikan untuk seluruh Barang berstok aktif, termasuk yang belum bergerak", async () => {
    const idlokasi = await buatLokasi();
    const a = await buatBarang();
    const b = await buatBarang();
    await gerakStok(a.idbarang, idlokasi, "M", 4);

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));

    expect(saldo.map((item) => item.idbarang).sort()).toEqual([a.idbarang, b.idbarang].sort());
    expect(saldo.find((item) => item.idbarang === b.idbarang)?.jmlsistem).toBe(0);
  });

  it("Barang non-stok dan Barang nonaktif tidak pernah muncul", async () => {
    const idlokasi = await buatLokasi();
    await buatBarang({ pakaistok: false });
    await buatBarang({ status: 0 });
    const aktif = await buatBarang();

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));

    expect(saldo).toHaveLength(1);
    expect(saldo[0].idbarang).toBe(aktif.idbarang);
  });

  it("Kartu Stok yang tanggalnya sama persis dengan tanggal batas ikut terhitung, yang setelahnya tidak", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10, "2026-08-20");
    await gerakStok(idbarang, idlokasi, "K", 4, "2026-08-25");

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-22"));
    expect(saldo[0].jmlsistem).toBe(10);

    const saldoBatas = await hitungSaldoStok(db, idlokasi, new Date("2026-08-20"));
    expect(saldoBatas[0].jmlsistem).toBe(10);
  });
});

describe("Selisih menentukan arah Kartu Stok", () => {
  it("sistem 10 fisik 12: satu Kartu Stok masuk sejumlah 2", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 12 }],
    });

    const kst = await kartuStokOpname(dok.kodeopname);
    expect(kst).toHaveLength(1);
    expect(kst[0].mk).toBe("M");
    expect(Number(kst[0].jml)).toBe(2);
  });

  it("sistem 10 fisik 7: satu Kartu Stok keluar sejumlah 3", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 7 }],
    });

    const kst = await kartuStokOpname(dok.kodeopname);
    expect(kst).toHaveLength(1);
    expect(kst[0].mk).toBe("K");
    expect(Number(kst[0].jml)).toBe(3);
  });

  it("sistem 10 fisik 10: baris tersimpan dengan selisih 0 dan tidak ada Kartu Stok terbit", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 10 }],
    });

    expect(dok.items).toHaveLength(1);
    expect(dok.items[0].selisih).toBe(0);
    expect(await kartuStokOpname(dok.kodeopname)).toHaveLength(0);
  });

  it("sistem 0 fisik 4: satu Kartu Stok masuk sejumlah 4", async () => {
    await buatLokasi();
    const { kodebarang } = await buatBarang();

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 4 }],
    });

    const kst = await kartuStokOpname(dok.kodeopname);
    expect(kst).toHaveLength(1);
    expect(kst[0].mk).toBe("M");
    expect(Number(kst[0].jml)).toBe(4);
  });

  it("tiga Barang (lebih, kurang, sama) menerbitkan dua Kartu Stok urut 1 dan 2, tiga baris dokumen tersimpan", async () => {
    const idlokasi = await buatLokasi();
    const lebih = await buatBarang();
    const kurang = await buatBarang();
    const sama = await buatBarang();
    await gerakStok(lebih.idbarang, idlokasi, "M", 10);
    await gerakStok(kurang.idbarang, idlokasi, "M", 10);
    await gerakStok(sama.idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [
        { kodebarang: lebih.kodebarang, jmlfisik: 12 },
        { kodebarang: kurang.kodebarang, jmlfisik: 8 },
        { kodebarang: sama.kodebarang, jmlfisik: 10 },
      ],
    });

    expect(dok.items).toHaveLength(3);
    const kst = await kartuStokOpname(dok.kodeopname);
    expect(kst.map((row) => row.urutan)).toEqual([1, 2]);
    expect(kst.every((row) => Number(row.jml) > 0)).toBe(true);
  });

  it("hasil opname menjadi saldo baru", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);

    await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 12 }],
    });

    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));
    expect(saldo[0].jmlsistem).toBe(12);
  });

  it("menyimpan dokumen tidak menerbitkan satu baris Jurnal pun", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 5 }],
    });

    expect(await db.jurnal.count({ where: { kodetrans: dok.kodeopname } })).toBe(0);
    expect(await db.jurnal.count()).toBe(0);
  });
});

describe("Jumlah menurut sistem adalah milik server", () => {
  it("client mengirim jmlsistem 999 tidak berpengaruh", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 12, jmlsistem: 999 }],
    });

    expect(dok.items[0].jmlsistem).toBe(10);
    expect(dok.items[0].selisih).toBe(2);
    expect(Number((await kartuStokOpname(dok.kodeopname))[0].jml)).toBe(2);
  });

  it("satuan disalin dari Barang saat simpan; mengubah satuan Barang setelahnya tidak mengubah dokumen", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang({ satuan: "PCS" });
    await gerakStok(idbarang, idlokasi, "M", 10);

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 10 }],
    });

    await db.barang.update({ where: { idbarang }, data: { satuan: "BOX" } });

    const dibaca = await findOpnameStok(db, dok.kodeopname);
    expect(dibaca?.items[0].satuan).toBe("PCS");
  });
});

describe("Batas tanggal dan dokumen mundur", () => {
  it("Kartu Stok setelah tanggal dokumen tidak terhitung", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10, "2026-08-20");
    await gerakStok(idbarang, idlokasi, "K", 4, "2026-08-25");

    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-22",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 10 }],
    });

    expect(dok.items[0].jmlsistem).toBe(10);
    expect(dok.items[0].selisih).toBe(0);
  });

  it("dokumen bertanggal mundur diterima; setelah hari ini ditolak", async () => {
    await buatLokasi();
    const { kodebarang } = await buatBarang();

    await expect(
      createOpnameStok(db, { tanggal: "2026-01-05", kodelokasi: "LOK01", items: [{ kodebarang, jmlfisik: 1 }] }),
    ).resolves.toBeDefined();

    await expect(
      createOpnameStok(db, { tanggal: "2999-01-01", kodelokasi: "LOK01", items: [{ kodebarang, jmlfisik: 1 }] }),
    ).rejects.toThrow(/hari ini/);
  });

  it("menyisipkan dokumen mundur tidak mengubah jmlsistem tersimpan dokumen sesudahnya", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10, "2026-08-10");

    const dok25 = await createOpnameStok(db, {
      tanggal   : "2026-08-25",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 10 }],
    });
    expect(dok25.items[0].jmlsistem).toBe(10);

    await createOpnameStok(db, {
      tanggal   : "2026-08-20",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 30 }],
    });

    const dibaca = await findOpnameStok(db, dok25.kodeopname);
    expect(dibaca?.items[0].jmlsistem).toBe(10);
  });
});

describe("Edit dokumen", () => {
  async function buatDokumen(kodebarang: string, jmlfisik: number) {
    return createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik }],
    });
  }

  it("mengedit mencabut Kartu Stok lama lalu menerbitkan yang baru", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await buatDokumen(kodebarang, 12);

    await updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang, jmlfisik: 15 }] });

    const kst = await kartuStokOpname(dok.kodeopname);
    expect(kst).toHaveLength(1);
    expect(Number(kst[0].jml)).toBe(5);
  });

  it("edit menjadi fisik sama dengan sistem menghapus seluruh Kartu Stok dan mengembalikan saldo", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await buatDokumen(kodebarang, 12);

    await updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang, jmlfisik: 10 }] });

    expect(await kartuStokOpname(dok.kodeopname)).toHaveLength(0);
    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));
    expect(saldo[0].jmlsistem).toBe(10);
  });

  it("edit tanpa mengubah apa pun menghasilkan Kartu Stok identik, bukan selisih berganda", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await buatDokumen(kodebarang, 12);

    await updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang, jmlfisik: 12 }] });

    const kst = await kartuStokOpname(dok.kodeopname);
    expect(kst).toHaveLength(1);
    expect(Number(kst[0].jml)).toBe(2);
    const dibaca = await findOpnameStok(db, dok.kodeopname);
    expect(dibaca?.items[0].jmlsistem).toBe(10);
  });

  it("edit ke fisik lebih tinggi lagi menghitung selisih terhadap saldo tanpa dokumen ini", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await buatDokumen(kodebarang, 12);

    await updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang, jmlfisik: 20 }] });

    const kst = await kartuStokOpname(dok.kodeopname);
    expect(Number(kst[0].jml)).toBe(10);
  });

  it("nomor urut baris dirapikan ulang mulai dari 1 saat Barang dihapus/ditambah", async () => {
    const idlokasi = await buatLokasi();
    const a = await buatBarang();
    const b = await buatBarang();
    await gerakStok(a.idbarang, idlokasi, "M", 10);
    await gerakStok(b.idbarang, idlokasi, "M", 10);
    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [
        { kodebarang: a.kodebarang, jmlfisik: 12 },
        { kodebarang: b.kodebarang, jmlfisik: 12 },
      ],
    });

    await updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang: b.kodebarang, jmlfisik: 12 }] });

    const rows = await db.opnamestokdtl.findMany({
      where  : { opnamestok: { kodeopname: dok.kodeopname } },
      orderBy: { urutan: "asc" },
    });
    expect(rows.map((row) => row.urutan)).toEqual([1]);
  });

  it("tanggal dan lokasi yang dikirim client saat edit diabaikan", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await buatDokumen(kodebarang, 12);

    const diedit = await updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang, jmlfisik: 13 }] });

    expect(diedit.tanggal).toBe(dok.tanggal);
    expect(diedit.kodelokasi).toBe(dok.kodelokasi);
    expect(diedit.kodeopname).toBe(dok.kodeopname);
  });

  it("dokumen dibatalkan menolak edit", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await buatDokumen(kodebarang, 12);
    await cancelOpnameStok(db, dok.kodeopname, "salah lokasi");

    await expect(
      updateOpnameStok(db, dok.kodeopname, { items: [{ kodebarang, jmlfisik: 13 }] }),
    ).rejects.toThrow(/dibatalkan/);
  });
});

describe("Batal dokumen", () => {
  it("membatalkan mengubah status, menyimpan alasan, mencabut Kartu Stok, dan mengembalikan saldo", async () => {
    const idlokasi = await buatLokasi();
    const { idbarang, kodebarang } = await buatBarang();
    await gerakStok(idbarang, idlokasi, "M", 10);
    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 12 }],
    });

    const dibatalkan = await cancelOpnameStok(db, dok.kodeopname, "  hitung ulang  ");

    expect(dibatalkan.status).toBe("D");
    expect(dibatalkan.alasanbatal).toBe("hitung ulang");
    expect(await kartuStokOpname(dok.kodeopname)).toHaveLength(0);
    const saldo = await hitungSaldoStok(db, idlokasi, new Date("2026-08-28"));
    expect(saldo[0].jmlsistem).toBe(10);
  });

  it("membatalkan dokumen yang sudah dibatalkan ditolak", async () => {
    await buatLokasi();
    const { kodebarang } = await buatBarang();
    const dok = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 1 }],
    });
    await cancelOpnameStok(db, dok.kodeopname);

    await expect(cancelOpnameStok(db, dok.kodeopname)).rejects.toThrow(/dibatalkan/);
  });

  it("membatalkan dokumen yang tidak ada ditolak dengan pesan yang menyebut kodenya", async () => {
    await expect(cancelOpnameStok(db, "OS9999999999")).rejects.toThrow(/OS9999999999/);
  });
});

describe("Input tidak sah ditolak", () => {
  beforeEach(async () => {
    await buatLokasi();
  });

  it("dokumen tanpa satu pun baris ditolak", async () => {
    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "LOK01", items: [] }),
    ).rejects.toThrow(/minimal 1 baris/);
  });

  it("Barang non-stok ditolak dengan pesan menyebut kodenya", async () => {
    const { kodebarang } = await buatBarang({ pakaistok: false });

    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "LOK01", items: [{ kodebarang, jmlfisik: 1 }] }),
    ).rejects.toThrow(new RegExp(kodebarang));
  });

  it("Barang nonaktif ditolak dengan pesan menyebut kodenya", async () => {
    const { kodebarang } = await buatBarang({ status: 0 });

    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "LOK01", items: [{ kodebarang, jmlfisik: 1 }] }),
    ).rejects.toThrow(new RegExp(kodebarang));
  });

  it("Barang yang sama dua kali ditolak dengan pesan menyebut kodenya", async () => {
    const { kodebarang } = await buatBarang();

    await expect(
      createOpnameStok(db, {
        tanggal   : "2026-08-28",
        kodelokasi: "LOK01",
        items     : [{ kodebarang, jmlfisik: 1 }, { kodebarang, jmlfisik: 2 }],
      }),
    ).rejects.toThrow(new RegExp(kodebarang));
  });

  it("jumlah fisik negatif ditolak", async () => {
    const { kodebarang } = await buatBarang();

    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "LOK01", items: [{ kodebarang, jmlfisik: -1 }] }),
    ).rejects.toThrow(/negatif/);
  });

  it("Lokasi tidak ada ditolak; Lokasi nonaktif ditolak dengan pesan jelas", async () => {
    const { kodebarang } = await buatBarang();
    await buatLokasi("MATI", 0);

    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "GHOST", items: [{ kodebarang, jmlfisik: 1 }] }),
    ).rejects.toThrow(/tidak ditemukan/);

    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "MATI", items: [{ kodebarang, jmlfisik: 1 }] }),
    ).rejects.toThrow(/nonaktif/);
  });

  it("Barang dengan kode tidak ada ditolak dengan pesan menyebut kodenya", async () => {
    await expect(
      createOpnameStok(db, { tanggal: "2026-08-28", kodelokasi: "LOK01", items: [{ kodebarang: "B-GHOST", jmlfisik: 1 }] }),
    ).rejects.toThrow(/B-GHOST/);
  });

  it("penolakan pada satu baris membuat seluruh dokumen tidak tersimpan", async () => {
    const ok = await buatBarang();

    await expect(
      createOpnameStok(db, {
        tanggal   : "2026-08-28",
        kodelokasi: "LOK01",
        items     : [{ kodebarang: ok.kodebarang, jmlfisik: 1 }, { kodebarang: "B-GHOST", jmlfisik: 2 }],
      }),
    ).rejects.toThrow();

    expect(await db.opnamestok.count()).toBe(0);
    expect(await db.opnamestokdtl.count()).toBe(0);
    expect(await db.kartustok.count({ where: { jenistransaksi: "OPNAME STOK" } })).toBe(0);
  });
});

describe("Kode Dokumen, daftar, dan saldo terpublikasi", () => {
  it("dokumen pertama mendapat Kode Dokumen berawalan OS bertanggal, berikutnya nomor urut berikutnya", async () => {
    await buatLokasi();
    const { kodebarang } = await buatBarang();

    const pertama = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 1 }],
    });
    const kedua = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 2 }],
    });

    expect(pertama.kodeopname).toMatch(/^OS260828/);
    expect(pertama.kodeopname.endsWith("0001")).toBe(true);
    expect(kedua.kodeopname.endsWith("0002")).toBe(true);
  });

  it("mengubah awalan lewat Config hanya memengaruhi dokumen berikutnya", async () => {
    await buatLokasi();
    const { kodebarang } = await buatBarang();

    const lama = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 1 }],
    });

    await db.config.update({
      where: { modul_config: { modul: "OPNAME STOK", config: "AWALAN" } },
      data : { nilai: "OPN" },
    });

    try {
      const baru = await createOpnameStok(db, {
        tanggal   : "2026-08-28",
        kodelokasi: "LOK01",
        items     : [{ kodebarang, jmlfisik: 2 }],
      });

      expect(lama.kodeopname.startsWith("OS")).toBe(true);
      expect(baru.kodeopname.startsWith("OPN")).toBe(true);
      expect((await findOpnameStok(db, lama.kodeopname))?.kodeopname).toBe(lama.kodeopname);
    } finally {
      await db.config.update({
        where: { modul_config: { modul: "OPNAME STOK", config: "AWALAN" } },
        data : { nilai: "OS" },
      });
    }
  });

  it("daftar dokumen membedakan yang dibatalkan dari yang tersimpan", async () => {
    await buatLokasi();
    const { kodebarang } = await buatBarang();
    const a = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 1 }],
    });
    const b = await createOpnameStok(db, {
      tanggal   : "2026-08-28",
      kodelokasi: "LOK01",
      items     : [{ kodebarang, jmlfisik: 2 }],
    });
    await cancelOpnameStok(db, b.kodeopname);

    const daftar = await listOpnameStok(db);
    expect(daftar.find((item) => item.kodeopname === a.kodeopname)?.status).toBe("S");
    expect(daftar.find((item) => item.kodeopname === b.kodeopname)?.status).toBe("D");
  });
});
