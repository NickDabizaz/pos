import { findBarangByKode } from "@/lib/server/barang/repository";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import {
  findAllPembelian,
  findConfigPpn,
  findPembelianByKode,
  insertPembelianLengkap,
  updatePembelianLengkap,
  updateStatusPembelianByKode,
  type InsertPembelianItemData,
} from "@/lib/server/pembelian/repository";
import type { CreatePembelianInput, CreatePembelianItemInput, Pembelian, UpdatePembelianInput } from "@/lib/server/pembelian/types";
import { findSupplierByKode } from "@/lib/server/supplier/repository";
import { calculateHeaderTotals, withComputedAmounts } from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

function pesanTidakDitemukan(kodebeli: string): string {
  return `Pembelian dengan kode "${kodebeli}" tidak ditemukan`;
}

async function bacaPpnRate(db: DatabasePerusahaanClient): Promise<number> {
  const rows = await findConfigPpn(db);
  const nilai = Object.fromEntries(rows.map((row) => [row.config, row.nilai]));
  const aktif = nilai.status === "1";
  const persentase = Number(nilai.persentase) || 0;
  const rate = aktif ? persentase / 100 : 0;

  return rate;
}

type TransaksiItemDenganBarang = TransaksiItem & { idbarang: number };

async function cekDanHitungItems(
  db      : DatabasePerusahaanClient,
  items   : CreatePembelianItemInput[],
  ppnRate : number,
): Promise<TransaksiItemDenganBarang[]> {
  const hasil: TransaksiItemDenganBarang[] = [];

  for (const item of items) {
    if (!(item.qty > 0)) {
      throw new Error(`Jumlah barang "${item.kodebarang}" harus lebih dari nol`, { cause: "INPUT_TIDAK_SAH" });
    }
    if (item.harga < 0) {
      throw new Error(`Harga barang "${item.kodebarang}" tidak boleh negatif`, { cause: "INPUT_TIDAK_SAH" });
    }

    const barang = await findBarangByKode(db, item.kodebarang);
    if (!barang) {
      throw new Error(`Barang dengan kode "${item.kodebarang}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
    }

    hasil.push({
      ...withComputedAmounts(
        { kodebarang: item.kodebarang, namabarang: barang.namabarang, satuan: barang.satuan, qty: item.qty, harga: item.harga, pakaiPpn: item.pakaiPpn, diskon: item.diskon },
        ppnRate,
      ),
      idbarang: barang.idbarang,
    });
  }

  return hasil;
}

function toInsertItems(transaksiItems: TransaksiItemDenganBarang[]): InsertPembelianItemData[] {
  const items = transaksiItems.map((item) => ({
    idbarang: item.idbarang,
    qty     : item.qty,
    harga   : item.harga,
    pakaippn: item.pakaiPpn,
    diskon  : item.diskon,
    ppn     : item.ppn,
    subtotal: item.subtotal,
  }));

  return items;
}

export async function listPembelian(db: DatabasePerusahaanClient): Promise<Pembelian[]> {
  const rows = await findAllPembelian(db);

  return rows;
}

export async function findPembelian(db: DatabasePerusahaanClient, kodebeli: string): Promise<Pembelian | null> {
  const row = await findPembelianByKode(db, kodebeli);

  return row;
}

export async function createPembelian(db: DatabasePerusahaanClient, input: CreatePembelianInput): Promise<Pembelian> {
  if (input.items.length === 0) {
    throw new Error("Pembelian harus memiliki minimal 1 baris barang", { cause: "INPUT_TIDAK_SAH" });
  }

  const lokasi = await findLokasiByKode(db, input.kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (lokasi.status !== 1) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const supplier = await findSupplierByKode(db, input.kodesupplier);
  if (!supplier) {
    throw new Error(`Supplier dengan kode "${input.kodesupplier}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (supplier.status !== 1) {
    throw new Error(`Supplier dengan kode "${input.kodesupplier}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const ppnRate = await bacaPpnRate(db);

  const transaksiItems = await cekDanHitungItems(db, input.items, ppnRate);

  const { diskon, grandtotal, ppn, total } = calculateHeaderTotals(transaksiItems);

  const items = toInsertItems(transaksiItems);

  const tgltrans = new Date(input.tanggal);

  const kodebeli = await db.$transaction(async (tx) => {
    const kode = await simpanDenganKode(tx, "beli", tgltrans, async (kode) => {
      await insertPembelianLengkap(tx, kode, {
        tgltrans,
        idsupplier: supplier.idsupplier,
        idlokasi  : lokasi.idlokasi,
        total,
        diskon,
        ppn,
        grandtotal,
        items,
      });

      return kode;
    });

    return kode;
  });

  const created = await findPembelianByKode(db, kodebeli);

  return created!;
}

export async function updatePembelian(
  db      : DatabasePerusahaanClient,
  kodebeli: string,
  input   : UpdatePembelianInput,
): Promise<Pembelian> {
  const existing = await findPembelianByKode(db, kodebeli);
  if (!existing) {
    throw new Error(pesanTidakDitemukan(kodebeli), { cause: "TIDAK_DITEMUKAN" });
  }
  if (existing.status === "D") {
    throw new Error(`Pembelian "${kodebeli}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  const supplier = await findSupplierByKode(db, input.kodesupplier);
  if (!supplier) {
    throw new Error(`Supplier dengan kode "${input.kodesupplier}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (supplier.status !== 1) {
    throw new Error(`Supplier dengan kode "${input.kodesupplier}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  if (input.items.length === 0) {
    throw new Error("Pembelian harus memiliki minimal 1 baris barang", { cause: "INPUT_TIDAK_SAH" });
  }

  const ppnRate = await bacaPpnRate(db);

  const transaksiItems = await cekDanHitungItems(db, input.items, ppnRate);
  const { diskon, grandtotal, ppn, total } = calculateHeaderTotals(transaksiItems);

  await db.$transaction(async (tx) => {
    await updatePembelianLengkap(tx, kodebeli, {
      idsupplier: supplier.idsupplier,
      total     : total,
      diskon    : diskon,
      ppn       : ppn,
      grandtotal: grandtotal,
      items     : toInsertItems(transaksiItems),
    });
  });

  const terbaru = await findPembelianByKode(db, kodebeli);

  return terbaru!;
}

export async function cancelPembelian(
  db          : DatabasePerusahaanClient,
  kodebeli    : string,
  alasanbatal?: string,
): Promise<Pembelian> {
  const existing = await findPembelianByKode(db, kodebeli);
  if (!existing) {
    throw new Error(pesanTidakDitemukan(kodebeli), { cause: "TIDAK_DITEMUKAN" });
  }
  if (existing.status === "D") {
    throw new Error(`Pembelian "${kodebeli}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  await updateStatusPembelianByKode(db, kodebeli, alasanbatal?.trim() || null);

  const updated = await findPembelianByKode(db, kodebeli);

  return updated!;
}
