import type { TenantClient } from "@/lib/server/provisioning/types";
import type { ModulKodeDokumen } from "@/lib/server/kodedokumen/types";

export const MODUL_KODE_FIELD: Record<ModulKodeDokumen, string> = {
  lokasi  : "kodelokasi",
  barang  : "kodebarang",
  customer: "kodecustomer",
  supplier: "kodesupplier",
  jual    : "kodejual",
  beli    : "kodebeli",
  kas     : "kodekas",
};

const FIND_KODE_BY_PREFIX: Record<ModulKodeDokumen, (db: TenantClient, prefix: string) => Promise<string[]>> = {
  lokasi: async (db, prefix) =>
    (await db.lokasi.findMany({ where: { kodelokasi: { startsWith: prefix } }, select: { kodelokasi: true } })).map(
      (row) => row.kodelokasi,
    ),
  barang: async (db, prefix) =>
    (await db.barang.findMany({ where: { kodebarang: { startsWith: prefix } }, select: { kodebarang: true } })).map(
      (row) => row.kodebarang,
    ),
  customer: async (db, prefix) =>
    (
      await db.customer.findMany({ where: { kodecustomer: { startsWith: prefix } }, select: { kodecustomer: true } })
    ).map((row) => row.kodecustomer),
  supplier: async (db, prefix) =>
    (
      await db.supplier.findMany({ where: { kodesupplier: { startsWith: prefix } }, select: { kodesupplier: true } })
    ).map((row) => row.kodesupplier),
  jual: async (db, prefix) =>
    (await db.jual.findMany({ where: { kodejual: { startsWith: prefix } }, select: { kodejual: true } })).map(
      (row) => row.kodejual,
    ),
  beli: async (db, prefix) =>
    (await db.beli.findMany({ where: { kodebeli: { startsWith: prefix } }, select: { kodebeli: true } })).map(
      (row) => row.kodebeli,
    ),
  kas: async (db, prefix) =>
    (await db.kas.findMany({ where: { kodekas: { startsWith: prefix } }, select: { kodekas: true } })).map(
      (row) => row.kodekas,
    ),
};

export async function findKodeByPrefix(db: TenantClient, modul: ModulKodeDokumen, prefix: string): Promise<string[]> {
  return FIND_KODE_BY_PREFIX[modul](db, prefix);
}

export type ConfigRowValue = { config: string; nilai: string };

export async function findConfigForModul(db: TenantClient, modul: ModulKodeDokumen): Promise<ConfigRowValue[]> {
  return db.config.findMany({ where: { modul }, select: { config: true, nilai: true } });
}
