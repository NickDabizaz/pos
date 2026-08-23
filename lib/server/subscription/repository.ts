import { Prisma } from "@/lib/generated/prisma-global/client";
import type { GlobalClient, SubscriptionRow } from "@/lib/server/subscription/types";

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

export async function findSubscriptionByOrderid(db: GlobalClient, orderid: string): Promise<SubscriptionRow | null> {
  const subscription = await db.subscription.findUnique({ where: { orderid } });
  const row = subscription ? toRow(subscription) : null;

  return row;
}

export async function findLatestSubscription(db: GlobalClient, idperusahaan: number): Promise<SubscriptionRow | null> {
  const subscription = await db.subscription.findFirst({
    where  : { idperusahaan },
    orderBy: { tglselesai: "desc" },
  });
  const row = subscription ? toRow(subscription) : null;

  return row;
}

function tglSelesaiDari(tglmulai: Date, masaberlakuhari: number): Date {
  const hasil = new Date(tglmulai);
  hasil.setUTCDate(hasil.getUTCDate() + masaberlakuhari);

  return hasil;
}

/** Date math stays here (not service.ts) — must run inside the same $transaction that locks the Perusahaan row (see FOR UPDATE below). */
export async function insertSubscriptionDanAktifkanPerusahaan(
  db           : GlobalClient,
  idperusahaan : number,
  orderid      : string,
  paket        : { namapaket: string; hargapaket: number; masaberlakuhari: number },
  tglPembayaran: Date,
): Promise<SubscriptionRow> {
  const subscription = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT idperusahaan FROM perusahaan WHERE idperusahaan = ${idperusahaan} FOR UPDATE`;

    const terakhir = await tx.subscription.findFirst({
      where  : { idperusahaan },
      orderBy: { tglselesai: "desc" },
    });

    const perpanjanganDini = terakhir !== null && terakhir.tglselesai.getTime() >= tglPembayaran.getTime();
    const tglmulai         = perpanjanganDini ? terakhir!.tglselesai : tglPembayaran;
    const tglselesai       = tglSelesaiDari(tglmulai, paket.masaberlakuhari);

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

  const row = toRow(subscription);

  return row;
}

export function isKonflikOrderid(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  if (typeof target === "string") {
    const cocok = target.includes("orderid");

    return cocok;
  }
  if (Array.isArray(target)) {
    const cocok = target.includes("orderid");

    return cocok;
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
}): SubscriptionRow {
  const row = {
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

  return row;
}
