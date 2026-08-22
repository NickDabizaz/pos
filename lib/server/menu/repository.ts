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
