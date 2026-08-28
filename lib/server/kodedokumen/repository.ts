import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { ModulKodeDokumen } from "@/lib/server/kodedokumen/types";

export const MODUL_KODE_FIELD: Record<ModulKodeDokumen, string> = {
  LOKASI  : "kodelokasi",
  BARANG  : "kodebarang",
  CUSTOMER: "kodecustomer",
  SUPPLIER: "kodesupplier",
  JUAL    : "kodejual",
  BELI    : "kodebeli",
  KAS     : "kodekas",
  "OPNAME STOK": "kodeopname",
};

const FIND_KODE_BY_PREFIX: Record<ModulKodeDokumen, (db: DatabasePerusahaanClient, prefix: string) => Promise<string[]>> = {
  LOKASI: async (db, prefix) => {
    const rows = await db.lokasi.findMany({ where: { kodelokasi: { startsWith: prefix } }, select: { kodelokasi: true } });
    const kode = rows.map((row) => row.kodelokasi);

    return kode;
  },
  BARANG: async (db, prefix) => {
    const rows = await db.barang.findMany({ where: { kodebarang: { startsWith: prefix } }, select: { kodebarang: true } });
    const kode = rows.map((row) => row.kodebarang);

    return kode;
  },
  CUSTOMER: async (db, prefix) => {
    const rows = await db.customer.findMany({ where: { kodecustomer: { startsWith: prefix } }, select: { kodecustomer: true } });
    const kode = rows.map((row) => row.kodecustomer);

    return kode;
  },
  SUPPLIER: async (db, prefix) => {
    const rows = await db.supplier.findMany({ where: { kodesupplier: { startsWith: prefix } }, select: { kodesupplier: true } });
    const kode = rows.map((row) => row.kodesupplier);

    return kode;
  },
  JUAL: async (db, prefix) => {
    const rows = await db.jual.findMany({ where: { kodejual: { startsWith: prefix } }, select: { kodejual: true } });
    const kode = rows.map((row) => row.kodejual);

    return kode;
  },
  BELI: async (db, prefix) => {
    const rows = await db.beli.findMany({ where: { kodebeli: { startsWith: prefix } }, select: { kodebeli: true } });
    const kode = rows.map((row) => row.kodebeli);

    return kode;
  },
  KAS: async (db, prefix) => {
    const rows = await db.kas.findMany({ where: { kodekas: { startsWith: prefix } }, select: { kodekas: true } });
    const kode = rows.map((row) => row.kodekas);

    return kode;
  },
  "OPNAME STOK": async (db, prefix) => {
    const rows = await db.opnamestok.findMany({ where: { kodeopname: { startsWith: prefix } }, select: { kodeopname: true } });
    const kode = rows.map((row) => row.kodeopname);

    return kode;
  },
};

export async function findKodeByPrefix(db: DatabasePerusahaanClient, modul: ModulKodeDokumen, prefix: string): Promise<string[]> {
  const kode = await FIND_KODE_BY_PREFIX[modul](db, prefix);

  return kode;
}

export type ConfigRowValue = { config: string; nilai: string };

export async function findConfigForModul(db: DatabasePerusahaanClient, modul: ModulKodeDokumen): Promise<ConfigRowValue[]> {
  const rows = await db.config.findMany({ where: { modul }, select: { config: true, nilai: true } });

  return rows;
}
