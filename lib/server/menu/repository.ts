import type { GlobalClient } from "@/lib/server/user/types";
import type { MenuRow } from "@/lib/server/menu/types";

export async function findActiveMenuRows(db: GlobalClient): Promise<MenuRow[]> {
  const rows = await db.menu.findMany({
    where  : { status: 1 },
    orderBy: { urutan: "asc" },
  });

  return rows;
}

export async function findKodemenuHakMenuAktif(
  db          : GlobalClient,
  iduser      : string,
  idperusahaan: number,
): Promise<string[]> {
  const rows = await db.usermenu.findMany({
    where : { iduser, idperusahaan, status: 1 },
    select: { kodemenu: true },
  });
  const kodemenuAktif = rows.map((row) => row.kodemenu);

  return kodemenuAktif;
}

export async function findMenuByKode(db: GlobalClient, kodemenu: string): Promise<{ kodemenu: string; jenis: string } | null> {
  const menu = await db.menu.findUnique({
    where : { kodemenu },
    select: { kodemenu: true, jenis: true },
  });

  return menu;
}

export async function setStatusUsermenu(
  db          : GlobalClient,
  iduser      : string,
  idperusahaan: number,
  kodemenu    : string,
  status      : number,
): Promise<void> {
  await db.usermenu.upsert({
    where : { iduser_idperusahaan_kodemenu: { iduser, idperusahaan, kodemenu } },
    create: { iduser, idperusahaan, kodemenu, status },
    update: { status },
  });
}

export async function deleteUsermenuUntukAnggota(db: GlobalClient, iduser: string, idperusahaan: number): Promise<void> {
  await db.usermenu.deleteMany({ where: { iduser, idperusahaan } });
}
