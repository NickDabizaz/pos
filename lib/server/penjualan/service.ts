import { findBarangByKode } from "@/lib/server/barang/repository";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findCustomerByKode } from "@/lib/server/customer/repository";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import { deleteJurnal } from "@/lib/server/jurnal/repository";
import { insertJurnalPenjualan } from "@/lib/server/jurnal/service";
import { deleteKartuStok } from "@/lib/server/kartustok/repository";
import { insertKartuStokPenjualan, petakanJenisPenjualan } from "@/lib/server/kartustok/service";
import {
  findAllPenjualan,
  findConfigPpn,
  findPenjualanByKode,
  insertPenjualanLengkap,
  updatePenjualanLengkap,
  updateStatusPenjualanByKode,
  type InsertPenjualanItemData,
} from "@/lib/server/penjualan/repository";
import type { CreatePenjualanInput, CreatePenjualanItemInput, Penjualan, UpdatePenjualanInput } from "@/lib/server/penjualan/types";
import { calculateHeaderTotals, withComputedAmounts } from "@/lib/server/transaksi/calculations";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

function pesanTidakDitemukan(kodejual: string): string {
  return `Penjualan dengan kode "${kodejual}" tidak ditemukan`;
}

async function bacaPpnRate(db: DatabasePerusahaanClient): Promise<number> {
  const rows = await findConfigPpn(db);
  const nilai = Object.fromEntries(rows.map((row) => [row.config, row.nilai]));
  const aktif = nilai.status === "1";
  const persentase = Number(nilai.persentase) || 0;
  const rate = aktif ? persentase / 100 : 0;

  return rate;
}

type TransaksiItemDenganBarang = TransaksiItem & { idbarang: number; pakaistok: boolean };

async function cekDanHitungItems(
  db      : DatabasePerusahaanClient,
  items   : CreatePenjualanItemInput[],
  ppnRate : number,
): Promise<TransaksiItemDenganBarang[]> {
  const hasil: TransaksiItemDenganBarang[] = [];

  for (const item of items) {
    if (!(item.qty > 0)) {
      throw new Error(`Jumlah barang "${item.kodebarang}" harus lebih dari nol`, { cause: "INPUT_TIDAK_SAH" });
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
      pakaistok: barang.pakaistok,
    });
  }

  return hasil;
}

function cekDanHitungPembayaran(input: { tunai: number; nontunai: number } | undefined, grandtotal: number): { tunai: number; nontunai: number; kembalian: number } {
  const tunai = input ? input.tunai : grandtotal;
  const nontunai = input ? input.nontunai : 0;
  if (tunai < 0 || nontunai < 0) {
    throw new Error("Komponen pembayaran tidak boleh negatif", { cause: "INPUT_TIDAK_SAH" });
  }
  const totalBayar = tunai + nontunai;
  if (totalBayar < grandtotal) {
    throw new Error("Jumlah pembayaran kurang dari grand total", { cause: "PEMBAYARAN_KURANG" });
  }

  const pembayaran = { tunai, nontunai, kembalian: totalBayar - grandtotal };

  return pembayaran;
}

function toInsertItems(transaksiItems: TransaksiItemDenganBarang[]): InsertPenjualanItemData[] {
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

export async function listPenjualan(db: DatabasePerusahaanClient): Promise<Penjualan[]> {
  const rows = await findAllPenjualan(db);

  return rows;
}

export async function findPenjualan(db: DatabasePerusahaanClient, kodejual: string): Promise<Penjualan | null> {
  const row = await findPenjualanByKode(db, kodejual);

  return row;
}

export async function createPenjualan(db: DatabasePerusahaanClient, input: CreatePenjualanInput): Promise<Penjualan> {
  if (input.items.length === 0) {
    throw new Error("Penjualan harus memiliki minimal 1 baris barang", { cause: "INPUT_TIDAK_SAH" });
  }

  const lokasi = await findLokasiByKode(db, input.kodelokasi);
  if (!lokasi) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (lokasi.status !== 1) {
    throw new Error(`Lokasi dengan kode "${input.kodelokasi}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const customer = await findCustomerByKode(db, input.kodecustomer);
  if (!customer) {
    throw new Error(`Customer dengan kode "${input.kodecustomer}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (customer.status !== 1) {
    throw new Error(`Customer dengan kode "${input.kodecustomer}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  const ppnRate = await bacaPpnRate(db);

  const transaksiItems = await cekDanHitungItems(db, input.items, ppnRate);

  const { diskon, grandtotal, ppn, total } = calculateHeaderTotals(transaksiItems);

  const items = toInsertItems(transaksiItems);

  const pembayaran = cekDanHitungPembayaran(input.pembayaran, grandtotal);

  const tgltrans = new Date(input.tanggal);

  const kodejual = await db.$transaction(async (tx) => {
    const kode = await simpanDenganKode(tx, "jual", tgltrans, async (kode) => {
      const idjual = await insertPenjualanLengkap(tx, kode, {
        tgltrans,
        jenistransaksi: input.jenistransaksi,
        idcustomer    : customer.idcustomer,
        idlokasi      : lokasi.idlokasi,
        total,
        diskon,
        ppn,
        grandtotal,
        items,
        pembayaran: pembayaran,
      });

      await insertKartuStokPenjualan(
        tx,
        { idjual, kodejual: kode, tgltrans, idlokasi: lokasi.idlokasi, jenistransaksi: input.jenistransaksi },
        customer.namacustomer,
        transaksiItems,
      );
      await insertJurnalPenjualan(
        tx,
        { idjual, kodejual: kode, tgltrans, idlokasi: lokasi.idlokasi, jenistransaksi: input.jenistransaksi },
        customer.namacustomer,
        grandtotal,
      );

      return kode;
    });

    return kode;
  });

  const created = await findPenjualanByKode(db, kodejual);

  return created!;
}

export async function updatePenjualan(
  db      : DatabasePerusahaanClient,
  kodejual: string,
  input   : UpdatePenjualanInput,
): Promise<Penjualan> {
  const existing = await findPenjualanByKode(db, kodejual);
  if (!existing) {
    throw new Error(pesanTidakDitemukan(kodejual), { cause: "TIDAK_DITEMUKAN" });
  }
  if (existing.status === "D") {
    throw new Error(`Penjualan "${kodejual}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  const customer = await findCustomerByKode(db, input.kodecustomer);
  if (!customer) {
    throw new Error(`Customer dengan kode "${input.kodecustomer}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
  }
  if (customer.status !== 1) {
    throw new Error(`Customer dengan kode "${input.kodecustomer}" nonaktif, tidak bisa dipakai transaksi baru`, { cause: "INPUT_TIDAK_SAH" });
  }

  if (input.items.length === 0) {
    throw new Error("Penjualan harus memiliki minimal 1 baris barang", { cause: "INPUT_TIDAK_SAH" });
  }

  const ppnRate = await bacaPpnRate(db);

  const transaksiItems = await cekDanHitungItems(db, input.items, ppnRate);
  const { diskon, grandtotal, ppn, total } = calculateHeaderTotals(transaksiItems);
  const pembayaran = cekDanHitungPembayaran(input.pembayaran, grandtotal);

  await db.$transaction(async (tx) => {
    const induk = await updatePenjualanLengkap(tx, kodejual, {
      idcustomer: customer.idcustomer,
      total     : total,
      diskon    : diskon,
      ppn       : ppn,
      grandtotal: grandtotal,
      items     : toInsertItems(transaksiItems),
      pembayaran: pembayaran,
    });

    const jenis = petakanJenisPenjualan(existing.jenistransaksi);
    await deleteKartuStok(tx, jenis, induk.idjual);
    await deleteJurnal(tx, jenis, induk.idjual);

    await insertKartuStokPenjualan(
      tx,
      { idjual: induk.idjual, kodejual, tgltrans: induk.tgltrans, idlokasi: induk.idlokasi, jenistransaksi: existing.jenistransaksi },
      customer.namacustomer,
      transaksiItems,
    );
    await insertJurnalPenjualan(
      tx,
      { idjual: induk.idjual, kodejual, tgltrans: induk.tgltrans, idlokasi: induk.idlokasi, jenistransaksi: existing.jenistransaksi },
      customer.namacustomer,
      grandtotal,
    );
  });

  const terbaru = await findPenjualanByKode(db, kodejual);

  return terbaru!;
}

export async function cancelPenjualan(
  db         : DatabasePerusahaanClient,
  kodejual   : string,
  alasanbatal?: string,
): Promise<Penjualan> {
  const existing = await findPenjualanByKode(db, kodejual);
  if (!existing) {
    throw new Error(pesanTidakDitemukan(kodejual), { cause: "TIDAK_DITEMUKAN" });
  }
  if (existing.status === "D") {
    throw new Error(`Penjualan "${kodejual}" sudah dibatalkan`, { cause: "SUDAH_DIBATALKAN" });
  }

  await db.$transaction(async (tx) => {
    const idjual = await updateStatusPenjualanByKode(tx, kodejual, alasanbatal?.trim() || null);

    const jenis = petakanJenisPenjualan(existing.jenistransaksi);
    await deleteKartuStok(tx, jenis, idjual);
    await deleteJurnal(tx, jenis, idjual);
  });

  const updated = await findPenjualanByKode(db, kodejual);

  return updated!;
}
