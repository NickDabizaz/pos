import { Prisma } from "@/lib/generated/prisma-global/client";
import type { GlobalClient, LanggananRow } from "@/lib/server/subscription/types";

export type PerusahaanStatusRow = {
  idperusahaan: number;
  status      : number;
};

export async function findPerusahaanById(db: GlobalClient, idperusahaan: number): Promise<PerusahaanStatusRow | null> {
  const perusahaan = await db.perusahaan.findUnique({
    where : { idperusahaan },
    select: { idperusahaan: true, status: true },
  });
  return perusahaan;
}

export async function findLanggananByOrderid(db: GlobalClient, orderid: string): Promise<LanggananRow | null> {
  const langganan = await db.subscription.findUnique({ where: { orderid } });
  return langganan ? toRow(langganan) : null;
}

/** Insert baris `subscription` + aktivasi `perusahaan` dalam satu transaksi (ADR 0002: tidak
 * ada langkah lain selain ini untuk mengaktifkan Perusahaan). */
export async function insertLanggananDanAktifkanPerusahaan(
  db            : GlobalClient,
  idperusahaan  : number,
  orderid       : string,
  paket         : { namapaket: string; hargapaket: number; masaberlakuhari: number },
  tglmulai      : Date,
  tglselesai    : Date,
): Promise<LanggananRow> {
  const langganan = await db.$transaction(async (tx) => {
    const created = await tx.subscription.create({
      data: {
        idperusahaan,
        orderid,
        namapaket      : paket.namapaket,
        hargapaket     : paket.hargapaket,
        masaberlakuhari: paket.masaberlakuhari,
        tglmulai,
        tglselesai,
      },
    });
    await tx.perusahaan.update({ where: { idperusahaan }, data: { status: 1 } });
    return created;
  });

  return toRow(langganan);
}

export function isKonflikOrderid(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (typeof target === "string") {
    return target.includes("orderid");
  }
  if (Array.isArray(target)) {
    return target.includes("orderid");
  }
  return true;
}

function toRow(subscription: {
  idsubscription : number;
  idperusahaan   : number;
  orderid        : string;
  namapaket      : string;
  hargapaket     : Prisma.Decimal;
  masaberlakuhari: number;
  tglmulai       : Date;
  tglselesai     : Date;
  status         : number;
}): LanggananRow {
  return {
    idsubscription : subscription.idsubscription,
    idperusahaan   : subscription.idperusahaan,
    orderid        : subscription.orderid,
    namapaket      : subscription.namapaket,
    hargapaket     : Number(subscription.hargapaket),
    masaberlakuhari: subscription.masaberlakuhari,
    tglmulai       : subscription.tglmulai,
    tglselesai     : subscription.tglselesai,
    status         : subscription.status,
  };
}
