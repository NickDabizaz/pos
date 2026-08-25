import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabasePerusahaan } from "@/lib/server/databaseperusahaan/service";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { cancelKas, createKas, findKas, listKas, updateKas } from "@/lib/server/kas/service";
import type { CreateKasInput, JenisKas, UpdateKasInput } from "@/lib/server/kas/types";
import { getTestDb, resetTables } from "@/lib/test/db";
import { dropDatabase, uniqueDatabaseName } from "@/prisma/__tests__/testDatabase";

const DOMAIN_TABLES = ["kasdtl", "kas", "jurnal", "lokasi"];

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

function buildInput(overrides: Partial<CreateKasInput> = {}): CreateKasInput {
  return {
    tanggal   : "2026-08-24",
    jenis     : "MASUK",
    kodelokasi: "LOK01",
    rincian   : [{ keterangan: "Setoran modal", nominal: 100000 }],
    ...overrides,
  };
}

async function bacaJumlahBaris(): Promise<{ kas: number; kasdtl: number }> {
  const [kas, kasdtl] = await Promise.all([db.kas.count(), db.kasdtl.count()]);

  return { kas, kasdtl };
}

describe("Kas dan rincian tersimpan sebagai satu transaksi database", () => {
  it("Kas jenis MASUK dengan 1 rincian tersimpan sekaligus", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput());

    expect(created.rincian).toHaveLength(1);
    expect(await bacaJumlahBaris()).toEqual({ kas: 1, kasdtl: 1 });
  });

  it("Kas dengan beberapa rincian tersimpan lengkap dalam satu panggilan, urutan berurutan mulai 1", async () => {
    await buatLokasi(db);

    const created = await createKas(
      db,
      buildInput({
        rincian: [
          { keterangan: "Setoran modal", nominal: 100000 },
          { keterangan: "Hasil penjualan online", nominal: 50000 },
          { keterangan: "Pengembalian dana", nominal: 25000 },
        ],
      }),
    );

    expect(created.rincian.map((item) => item.keterangan)).toEqual([
      "Setoran modal",
      "Hasil penjualan online",
      "Pengembalian dana",
    ]);
    const rows = await db.kasdtl.findMany({ orderBy: { urutan: "asc" } });
    expect(rows.map((row) => row.urutan)).toEqual([1, 2, 3]);
  });

  it("rincian kedua gagal (nominal negatif) menyebabkan tidak ada baris kas maupun kasdtl yang tersisa", async () => {
    await buatLokasi(db);

    await expect(
      createKas(
        db,
        buildInput({
          rincian: [
            { keterangan: "Setoran modal", nominal: 100000 },
            { keterangan: "Salah input", nominal: -1 },
          ],
        }),
      ),
    ).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ kas: 0, kasdtl: 0 });
  });

  it("rincian terakhir gagal karena nominal nol menyebabkan header kas juga tidak tersimpan", async () => {
    await buatLokasi(db);

    await expect(
      createKas(
        db,
        buildInput({
          rincian: [
            { keterangan: "Setoran modal", nominal: 100000 },
            { keterangan: "Nominal nol", nominal: 0 },
          ],
        }),
      ),
    ).rejects.toThrow();

    expect(await bacaJumlahBaris()).toEqual({ kas: 0, kasdtl: 0 });
  });
});

describe("Grand total Kas selalu sama dengan jumlah seluruh rinciannya", () => {
  it("grandtotal dihitung server, mengabaikan nilai apa pun dari klien", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput());

    expect(created.grandtotal).toBe(100000);
  });

  it("Kas dengan 3 rincian bernominal berbeda tersimpan dengan grandtotal = jumlah ketiganya", async () => {
    await buatLokasi(db);

    const created = await createKas(
      db,
      buildInput({
        rincian: [
          { keterangan: "A", nominal: 50000 },
          { keterangan: "B", nominal: 125000 },
          { keterangan: "C", nominal: 75000 },
        ],
      }),
    );

    expect(created.grandtotal).toBe(250000);
  });

  it("Kas dengan 1 rincian tersimpan dengan grandtotal sama persis dengan nominal rincian itu", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput({ rincian: [{ keterangan: "Satu-satunya", nominal: 42000 }] }));

    expect(created.grandtotal).toBe(42000);
  });

  it("Kas jenis KELUAR menyimpan grandtotal sebagai jumlah positif, tidak ada pembalikan tanda", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput({ jenis: "KELUAR" }));

    expect(created.grandtotal).toBe(100000);
  });
});

describe("Kode Kas dibuat oleh generator Kode Dokumen dan tidak pernah kembar", () => {
  it("kodekas mengikuti format Config modul kas", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput({ tanggal: "2026-08-24" }));

    expect(created.kodekas).toMatch(/^KS2608240001$/);
  });

  it("dua Kas berurutan pada tanggal yang sama mendapat nomor urut berurutan", async () => {
    await buatLokasi(db);

    const pertama = await createKas(db, buildInput({ tanggal: "2026-08-24" }));
    const kedua = await createKas(db, buildInput({ tanggal: "2026-08-24" }));

    expect(pertama.kodekas).toBe("KS2608240001");
    expect(kedua.kodekas).toBe("KS2608240002");
  });

  it("dua createKas paralel menghasilkan dua kodekas berbeda, tidak ada yang gagal karena duplikat", async () => {
    await buatLokasi(db);

    const [a, b] = await Promise.all([
      createKas(db, buildInput({ tanggal: "2026-08-25" })),
      createKas(db, buildInput({ tanggal: "2026-08-25" })),
    ]);

    expect(a.kodekas).not.toBe(b.kodekas);
    expect(await db.kas.count()).toBe(2);
  });
});

describe("Pembatalan Kas mengubah status tanpa menghapus barisnya", () => {
  it("membatalkan Kas berstatus S mengubah status jadi D dan mencatat alasanbatal, baris tetap utuh", async () => {
    await buatLokasi(db);
    const created = await createKas(db, buildInput());

    const cancelled = await cancelKas(db, created.kodekas, "Salah input nominal");

    expect(cancelled.status).toBe("D");
    expect(cancelled.alasanbatal).toBe("Salah input nominal");
    expect(cancelled.rincian).toHaveLength(1);
    expect(await bacaJumlahBaris()).toEqual({ kas: 1, kasdtl: 1 });
  });

  it("grandtotal pada header tidak berubah akibat pembatalan", async () => {
    await buatLokasi(db);
    const created = await createKas(db, buildInput());

    const cancelled = await cancelKas(db, created.kodekas);

    expect(cancelled.grandtotal).toBe(created.grandtotal);
  });

  it("membatalkan Kas yang sudah berstatus D ditolak", async () => {
    await buatLokasi(db);
    const created = await createKas(db, buildInput());
    await cancelKas(db, created.kodekas);

    await expect(cancelKas(db, created.kodekas)).rejects.toThrow(/sudah dibatalkan/);
  });

  it("membatalkan kodekas yang tidak ada ditolak dengan error tidak ditemukan", async () => {
    await expect(cancelKas(db, "KS0000000000")).rejects.toThrow(/tidak ditemukan/);
  });
});

describe("Jenis Kas harus MASUK atau KELUAR", () => {
  it("jenis di luar MASUK/KELUAR ditolak, tidak ada apa pun yang tersimpan", async () => {
    await buatLokasi(db);

    await expect(
      createKas(db, { ...buildInput(), jenis: "LAINNYA" as CreateKasInput["jenis"] }),
    ).rejects.toThrow(/[Jj]enis.*tidak sah/);
    expect(await bacaJumlahBaris()).toEqual({ kas: 0, kasdtl: 0 });
  });
});

describe("Lokasi pada Kas harus sah — tidak ditemukan maupun nonaktif ditolak", () => {
  it("kodelokasi yang tidak terdaftar ditolak, tidak ada apa pun yang tersimpan", async () => {
    await expect(createKas(db, buildInput({ kodelokasi: "TIDAKADA" }))).rejects.toThrow(/Lokasi.*tidak ditemukan/);
    expect(await bacaJumlahBaris()).toEqual({ kas: 0, kasdtl: 0 });
  });

  it("kodelokasi yang terdaftar tapi nonaktif ditolak sebagai Lokasi tidak sah", async () => {
    await buatLokasi(db, "LOK01", 0);

    await expect(createKas(db, buildInput())).rejects.toThrow(/Lokasi.*nonaktif/);
  });

  it("Kas dengan kodelokasi yang sah dan aktif tersimpan normal", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput());

    expect(created.kodelokasi).toBe("LOK01");
  });
});

describe("Rincian Kas tidak boleh kosong", () => {
  it("createKas tanpa rincian sama sekali ditolak, tidak ada header kas yang tersimpan", async () => {
    await buatLokasi(db);

    await expect(createKas(db, buildInput({ rincian: [] }))).rejects.toThrow(/rincian/i);
    expect(await bacaJumlahBaris()).toEqual({ kas: 0, kasdtl: 0 });
  });
});

describe("Nominal tiap rincian harus lebih dari nol", () => {
  it("nominal 0 ditolak", async () => {
    await buatLokasi(db);

    await expect(
      createKas(db, buildInput({ rincian: [{ keterangan: "Nol", nominal: 0 }] })),
    ).rejects.toThrow();
  });

  it("nominal negatif ditolak", async () => {
    await buatLokasi(db);

    await expect(
      createKas(db, buildInput({ rincian: [{ keterangan: "Negatif", nominal: -50000 }] })),
    ).rejects.toThrow();
  });

  it("nominal pecahan kecil positif diterima", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput({ rincian: [{ keterangan: "Kecil", nominal: 500 }] }));

    expect(created.rincian[0].nominal).toBe(500);
  });
});

describe("Daftar dan detail Kas", () => {
  it("listKas mengembalikan Kas yang sudah dibuat", async () => {
    await buatLokasi(db);
    await createKas(db, buildInput());

    const items = await listKas(db);

    expect(items).toHaveLength(1);
  });

  it("findKas dengan kode yang tidak ada mengembalikan null", async () => {
    expect(await findKas(db, "KS0000000000")).toBeNull();
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

  it("Kas dibuat di Perusahaan A tidak muncul saat membaca Kas dari Perusahaan B", async () => {
    await buatLokasi(db);
    await createKas(db, buildInput());

    const itemsLain = await listKas(dbLain);

    expect(itemsLain).toHaveLength(0);
  }, 30_000);

  it("penomoran kodekas di Perusahaan A tidak dipengaruhi jumlah Kas di Perusahaan B, keduanya mulai dari nomor urut 1", async () => {
    await buatLokasi(db);
    await createKas(db, buildInput({ tanggal: "2026-08-26" }));

    await buatLokasi(dbLain);
    const createdLain = await createKas(dbLain, buildInput({ tanggal: "2026-08-26" }));

    expect(createdLain.kodekas).toBe("KS2608260001");
  }, 30_000);

  it("edit Kas di Perusahaan A tidak mengubah dokumen bernomor sama di Perusahaan B", async () => {
    await buatLokasi(db);
    const createdA = await createKas(db, buildInput({ tanggal: "2026-08-26" }));

    await buatLokasi(dbLain);
    const createdB = await createKas(dbLain, buildInput({ tanggal: "2026-08-26" }));
    expect(createdA.kodekas).toBe(createdB.kodekas);

    await updateKas(db, createdA.kodekas, buildUpdateInput({
      jenis  : "KELUAR",
      rincian: [{ keterangan: "Bayar listrik", nominal: 150000 }],
    }));

    const utuhB = await findKas(dbLain, createdB.kodekas);
    expect(utuhB?.jenis).toBe("MASUK");
    expect(utuhB?.rincian).toEqual(createdB.rincian);
    expect(utuhB?.grandtotal).toBe(createdB.grandtotal);
  }, 30_000);
});

function buildUpdateInput(overrides: Partial<UpdateKasInput> = {}): UpdateKasInput {
  return {
    jenis  : "MASUK",
    rincian: [{ keterangan: "Setoran modal", nominal: 90000 }],
    ...overrides,
  };
}

async function buatKasSiapEdit(overrides: Partial<CreateKasInput> = {}) {
  await buatLokasi(db);

  return createKas(
    db,
    buildInput({
      rincian: [
        { keterangan: "Setoran modal", nominal: 100000 },
        { keterangan: "Hasil penjualan online", nominal: 125000 },
        { keterangan: "Pengembalian dana", nominal: 25000 },
      ],
      ...overrides,
    }),
  );
}

describe("Edit Kas — replace rincian atomik dan benar", () => {
  it("Kas dengan 3 rincian lama diedit menjadi 1 rincian — setelah updateKas kasdtl hanya berisi baris baru itu", async () => {
    const created = await buatKasSiapEdit();

    const hasil = await updateKas(db, created.kodekas, buildUpdateInput({
      rincian: [{ keterangan: "Koreksi setoran", nominal: 75000 }],
    }));

    expect(hasil.rincian).toEqual([{ keterangan: "Koreksi setoran", nominal: 75000 }]);
    expect(await bacaJumlahBaris()).toEqual({ kas: 1, kasdtl: 1 });
    const baris = await db.kasdtl.findMany();
    expect(baris[0].keterangan).toBe("Koreksi setoran");
    expect(baris[0].nominal.toString()).toBe("75000");
  });

  it("urutan rincian hasil edit berurutan mulai 1", async () => {
    const created = await buatKasSiapEdit();

    const hasil = await updateKas(db, created.kodekas, buildUpdateInput({
      rincian: [
        { keterangan: "Pemasukan bunga", nominal: 5000 },
        { keterangan: "Setoran modal", nominal: 90000 },
      ],
    }));

    expect(hasil.rincian.map((item) => item.keterangan)).toEqual(["Pemasukan bunga", "Setoran modal"]);

    const baris = await db.kasdtl.findMany({ orderBy: { urutan: "asc" } });
    expect(baris.map((barisItem) => barisItem.urutan)).toEqual([1, 2]);
    expect(baris[0].keterangan).toBe("Pemasukan bunga");
    expect(baris[1].keterangan).toBe("Setoran modal");
  });

  it("kegagalan validasi di tengah (rincian kedua nominal negatif) menyisakan data lama utuh", async () => {
    const created = await buatKasSiapEdit();

    await expect(
      updateKas(db, created.kodekas, buildUpdateInput({
        rincian: [
          { keterangan: "Rincian sah", nominal: 50000 },
          { keterangan: "Salah input", nominal: -1 },
        ],
      })),
    ).rejects.toThrow();

    const utuh = await findKas(db, created.kodekas);
    expect(utuh?.rincian).toHaveLength(3);
    expect(utuh?.grandtotal).toBe(created.grandtotal);
  });
});

describe("Edit Kas — grandtotal otoritatif server", () => {
  it("grandtotal fiktif kiriman client diabaikan — tersimpan jumlah nominal rincian hasil hitung server", async () => {
    const created = await buatKasSiapEdit();

    const hasil = await updateKas(db, created.kodekas, {
      jenis     : "MASUK",
      rincian   : [{ keterangan: "Setoran modal", nominal: 40000 }],
      grandtotal: 999999,
    } as unknown as UpdateKasInput);

    expect(hasil.grandtotal).toBe(40000);

    const barisHeader = await db.kas.findFirst();
    expect(barisHeader?.grandtotal.toString()).toBe("40000");
  });

  it("rincian diganti dari total 250.000 menjadi total 90.000 — header grandtotal ikut menjadi 90.000", async () => {
    const created = await buatKasSiapEdit();
    expect(created.grandtotal).toBe(250000);

    const hasil = await updateKas(db, created.kodekas, buildUpdateInput({
      rincian: [
        { keterangan: "Setoran modal", nominal: 40000 },
        { keterangan: "Hasil penjualan online", nominal: 50000 },
      ],
    }));

    expect(hasil.grandtotal).toBe(90000);
    expect(await findKas(db, created.kodekas)).toMatchObject({ grandtotal: 90000 });
  });
});

describe("Edit Kas — aturan khusus jenis dan rincian", () => {
  it("jenis berubah dari MASUK menjadi KELUAR saat edit — tersimpan KELUAR", async () => {
    const created = await buatKasSiapEdit();

    const hasil = await updateKas(db, created.kodekas, buildUpdateInput({ jenis: "KELUAR" }));

    expect(hasil.jenis).toBe("KELUAR");
    expect(await findKas(db, created.kodekas)).toMatchObject({ jenis: "KELUAR" });
  });

  it("jenis di luar MASUK/KELUAR ditolak dengan pesan jenis tidak sah — tidak ada perubahan tersisa", async () => {
    const created = await buatKasSiapEdit();

    await expect(
      updateKas(db, created.kodekas, buildUpdateInput({
        jenis  : "LAINNYA" as UpdateKasInput["jenis"],
        rincian: [{ keterangan: "Rincian pengganti", nominal: 1000 }],
      })),
    ).rejects.toThrow(/[Jj]enis.*tidak sah/);

    const utuh = await findKas(db, created.kodekas);
    expect(utuh?.jenis).toBe(created.jenis);
    expect(utuh?.rincian).toEqual(created.rincian);
  });

  it("rincian kosong atau ada rincian bernominal nol/negatif ditolak seperti aturan create — data lama utuh", async () => {
    const created = await buatKasSiapEdit();

    await expect(updateKas(db, created.kodekas, buildUpdateInput({ rincian: [] }))).rejects.toThrow(/minimal 1/);
    await expect(
      updateKas(db, created.kodekas, buildUpdateInput({ rincian: [{ keterangan: "Nominal nol", nominal: 0 }] })),
    ).rejects.toThrow(/harus lebih dari nol/);
    await expect(
      updateKas(db, created.kodekas, buildUpdateInput({ rincian: [{ keterangan: "Nominal negatif", nominal: -5000 }] })),
    ).rejects.toThrow(/harus lebih dari nol/);

    const utuh = await findKas(db, created.kodekas);
    expect(utuh?.rincian).toHaveLength(3);
    expect(utuh?.grandtotal).toBe(created.grandtotal);
  });
});

describe("Guard edit Kas — status dan keberadaan dokumen", () => {
  it("edit Kas berstatus S berhasil dan statusnya tetap S tanpa alasanbatal", async () => {
    const created = await buatKasSiapEdit();

    const hasil = await updateKas(db, created.kodekas, buildUpdateInput());

    expect(hasil.status).toBe("S");
    expect(hasil.alasanbatal).toBeNull();
    expect(hasil.kodekas).toBe(created.kodekas);
  });

  it("edit Kas berstatus D ditolak dengan pesan sudah dibatalkan — data tidak berubah", async () => {
    const created = await buatKasSiapEdit();
    await cancelKas(db, created.kodekas);

    await expect(updateKas(db, created.kodekas, buildUpdateInput())).rejects.toThrow(/sudah dibatalkan/);

    const utuh = await findKas(db, created.kodekas);
    expect(utuh?.status).toBe("D");
    expect(utuh?.rincian).toHaveLength(3);
  });

  it("edit kodekas yang tidak ada ditolak dengan error tidak ditemukan", async () => {
    await buatLokasi(db);

    await expect(updateKas(db, "KS0000000000", buildUpdateInput())).rejects.toThrow(/tidak ditemukan/);
  });

  it("setelah edit sukses, jalur batal biasa masih bekerja — status S ke D dengan alasanbatal tercatat, rincian hasil edit tetap utuh", async () => {
    const created = await buatKasSiapEdit();

    const hasilEdit = await updateKas(db, created.kodekas, buildUpdateInput({
      rincian: [{ keterangan: "Koreksi setoran", nominal: 75000 }],
    }));
    const batal = await cancelKas(db, created.kodekas, "Salah input nominal");

    expect(batal.status).toBe("D");
    expect(batal.alasanbatal).toBe("Salah input nominal");
    expect(batal.rincian).toEqual(hasilEdit.rincian);
    expect(await bacaJumlahBaris()).toEqual({ kas: 1, kasdtl: 1 });
  });
});

describe("Edit Kas — field terkunci tidak bergeser", () => {
  it("input edit menyertakan tanggal dan kodelokasi palsu — tgltrans, idlokasi, kodekas di database tetap nilai semula", async () => {
    const created = await buatKasSiapEdit();

    const hasil = await updateKas(db, created.kodekas, {
      ...buildUpdateInput(),
      tanggal   : "2001-01-01",
      kodelokasi: "PALSU",
    } as unknown as UpdateKasInput & { tanggal: string; kodelokasi: string });

    expect(hasil.kodekas).toBe(created.kodekas);
    expect(hasil.tanggal).toBe(created.tanggal);
    expect(hasil.kodelokasi).toBe(created.kodelokasi);
    expect(hasil.namalokasi).toBe(created.namalokasi);
  });
});

describe("Kas menulis Jurnal sebagai turunannya", () => {
  it("create Kas MASUK menulis satu baris Jurnal DEBET per rincian, nominal dan keterangannya mengikuti", async () => {
    await buatLokasi(db);

    const created = await createKas(db, buildInput({
      jenis     : "MASUK" as JenisKas,
      rincian   : [
        { keterangan: "Setoran modal", nominal: 100000 },
        { keterangan: "Hasil penjualan online", nominal: 50000 },
      ],
    }));

    const jurnal = await db.jurnal.findMany({ orderBy: { urutan: "asc" } });
    expect(jurnal.map((row) => row.saldo)).toEqual(["DEBET", "DEBET"]);
    expect(jurnal.map((row) => row.amount.toString())).toEqual(["100000", "50000"]);
    expect(jurnal.map((row) => row.catatan)).toEqual([
      "KAS MASUK SETORAN MODAL",
      "KAS MASUK HASIL PENJUALAN ONLINE",
    ]);
    expect(jurnal.every((row) => row.kodetrans === created.kodekas)).toBe(true);
    expect(await db.kartustok.count()).toBe(0);
  });

  it("create Kas KELUAR menulis baris Jurnal sisi KREDIT", async () => {
    await buatLokasi(db);

    await createKas(db, buildInput({ jenis: "KELUAR" as JenisKas }));

    const jurnal = await db.jurnal.findMany();
    expect(jurnal.map((row) => row.saldo)).toEqual(["KREDIT"]);
    expect(jurnal[0].jenistransaksi).toBe("KAS KELUAR");
    expect(jurnal[0].catatan).toBe("KAS KELUAR SETORAN MODAL");
  });

  it("edit Kas mengganti isi Jurnal, tidak menduplikasi — termasuk saat jenis berganti MASUK ke KELUAR", async () => {
    await buatLokasi(db);
    const created = await createKas(db, buildInput());

    await updateKas(db, created.kodekas, buildUpdateInput({
      jenis  : "KELUAR" as JenisKas,
      rincian: [{ keterangan: "Bayar listrik", nominal: 75000 }],
    }));

    const jurnal = await db.jurnal.findMany();
    expect(jurnal).toHaveLength(1);
    expect(jurnal[0].jenistransaksi).toBe("KAS KELUAR");
    expect(jurnal[0].saldo).toBe("KREDIT");
    expect(jurnal[0].amount.toString()).toBe("75000");
    expect(jurnal[0].catatan).toBe("KAS KELUAR BAYAR LISTRIK");
  });

  it("batal Kas menghapus Jurnal secara keras, header tetap ada", async () => {
    await buatLokasi(db);
    const created = await createKas(db, buildInput());

    await cancelKas(db, created.kodekas, "salah input");

    expect(await db.kas.count()).toBe(1);
    expect(await db.jurnal.count()).toBe(0);
  });
});
