import { findBarangByKode } from "@/lib/server/barang/repository";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import { findCustomerByKode } from "@/lib/server/customer/repository";
import { simpanDenganKode } from "@/lib/server/kodedokumen/service";
import { findLokasiByKode } from "@/lib/server/lokasi/repository";
import {
  findAllPenjualan,
  findConfigPpn,
  findPenjualanByKode,
  insertPenjualanLengkap,
  updateStatusPenjualanByKode,
  type InsertPenjualanItemData,
} from "@/lib/server/penjualan/repository";
import type { CreatePenjualanInput, Penjualan } from "@/lib/server/penjualan/types";
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

  const transaksiItems: (TransaksiItem & { idbarang: number })[] = [];
  for (const item of input.items) {
    if (!(item.qty > 0)) {
      throw new Error(`Jumlah barang "${item.kodebarang}" harus lebih dari nol`, { cause: "INPUT_TIDAK_SAH" });
    }

    const barang = await findBarangByKode(db, item.kodebarang);
    if (!barang) {
      throw new Error(`Barang dengan kode "${item.kodebarang}" tidak ditemukan`, { cause: "TIDAK_DITEMUKAN" });
    }

    transaksiItems.push({
      ...withComputedAmounts(
        { kodebarang: item.kodebarang, namabarang: barang.namabarang, satuan: barang.satuan, qty: item.qty, harga: item.harga, pakaiPpn: item.pakaiPpn, diskon: item.diskon },
        ppnRate,
      ),
      idbarang: barang.idbarang,
    });
  }

  const { diskon, grandtotal, ppn, total } = calculateHeaderTotals(transaksiItems);

  const items: InsertPenjualanItemData[] = transaksiItems.map((item) => ({
    idbarang: item.idbarang,
    qty     : item.qty,
    harga   : item.harga,
    pakaippn: item.pakaiPpn,
    diskon  : item.diskon,
    ppn     : item.ppn,
    subtotal: item.subtotal,
  }));

  const tunai = input.pembayaran ? input.pembayaran.tunai : grandtotal;
  const nontunai = input.pembayaran ? input.pembayaran.nontunai : 0;
  const totalBayar = tunai + nontunai;
  if (totalBayar < grandtotal) {
    throw new Error("Jumlah pembayaran kurang dari grand total", { cause: "PEMBAYARAN_KURANG" });
  }
  const kembalian = totalBayar - grandtotal;

  const tgltrans = new Date(input.tanggal);

  const kodejual = await db.$transaction(async (tx) => {
    const kode = await simpanDenganKode(tx, "jual", tgltrans, async (kode) => {
      await insertPenjualanLengkap(tx, kode, {
        tgltrans,
        jenistransaksi: input.jenistransaksi,
        idcustomer    : customer.idcustomer,
        idlokasi      : lokasi.idlokasi,
        total,
        diskon,
        ppn,
        grandtotal,
        items,
        pembayaran: { tunai, nontunai, kembalian },
      });

      return kode;
    });

    return kode;
  });

  const created = await findPenjualanByKode(db, kodejual);

  return created!;
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

  await updateStatusPenjualanByKode(db, kodejual, alasanbatal?.trim() || null);

  const updated = await findPenjualanByKode(db, kodejual);

  return updated!;
}
