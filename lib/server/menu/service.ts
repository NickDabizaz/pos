import { findMenuByKode, setStatusUsermenu } from "@/lib/server/menu/repository";
import type { AksesMenuParams, MenuNode, MenuRow, ToggleHakMenuParams } from "@/lib/server/menu/types";
import { findMembershipDenganOwner } from "@/lib/server/perusahaan/repository";
import { cekPemanggilOwner } from "@/lib/server/perusahaan/service";
import type { GlobalClient } from "@/lib/server/user/types";

const PEMETAAN_RUTE_MENU: Record<string, string> = {
  "GET /api/menu/tree": "MDATA-LOK",
};

export function kodemenuUntukRute(rute: string): string {
  const kodemenu = PEMETAAN_RUTE_MENU[rute];
  if (!kodemenu) {
    throw new Error(`Rute "${rute}" belum terdaftar di pemetaan rute-menu`, { cause: "RUTE_TIDAK_TERDAFTAR" });
  }

  return kodemenu;
}

export function seluruhKodemenuTerpetakan(): string[] {
  const seluruhKodemenu = Object.values(PEMETAAN_RUTE_MENU);

  return seluruhKodemenu;
}

export function bolehAksesMenu(params: AksesMenuParams & { kodemenu: string }): boolean {
  const diizinkan = params.isOwner || params.kodemenuDiizinkan.has(params.kodemenu);

  return diizinkan;
}

export function filterMenuUntukPengguna(tree: MenuNode[], params: AksesMenuParams): MenuNode[] {
  const hasil: MenuNode[] = [];

  for (const node of tree) {
    if (node.jenis === "DETAIL") {
      if (bolehAksesMenu({ ...params, kodemenu: node.kodemenu })) {
        hasil.push(node);
      }
      continue;
    }

    const children = filterMenuUntukPengguna(node.children, params);
    if (params.isOwner || children.length > 0) {
      hasil.push({ ...node, children });
    }
  }

  return hasil;
}

async function setHakMenu(db: GlobalClient, params: ToggleHakMenuParams, status: number): Promise<void> {
  await cekPemanggilOwner(db, params.idpemanggil, params.idperusahaan);

  const target = await findMembershipDenganOwner(db, params.idusertarget, params.idperusahaan);
  if (!target) {
    throw new Error("Pengguna tersebut bukan anggota Perusahaan ini", { cause: "BUKAN_ANGGOTA" });
  }
  if (target.isowner) {
    throw new Error("Owner selalu melewati Hak Menu, sehingga tidak dapat diatur", { cause: "TARGET_OWNER" });
  }

  const menu = await findMenuByKode(db, params.kodemenu);
  if (!menu) {
    throw new Error(`Menu "${params.kodemenu}" tidak ditemukan`, { cause: "MENU_TIDAK_DITEMUKAN" });
  }
  if (menu.jenis !== "DETAIL") {
    throw new Error("Hak Menu hanya berlaku untuk menu berjenis DETAIL", { cause: "BUKAN_MENU_DETAIL" });
  }

  await setStatusUsermenu(db, params.idusertarget, params.idperusahaan, params.kodemenu, status);
}

export async function nyalakanHakMenu(db: GlobalClient, params: ToggleHakMenuParams): Promise<void> {
  await setHakMenu(db, params, 1);
}

export async function matikanHakMenu(db: GlobalClient, params: ToggleHakMenuParams): Promise<void> {
  await setHakMenu(db, params, 0);
}

export function buildMenuTree(rows: MenuRow[]): MenuNode[] {
  const nodeMap = new Map<string, MenuNode>();
  for (const row of rows) {
    nodeMap.set(row.kodemenu, {
      kodemenu: row.kodemenu,
      namamenu: row.namamenu,
      jenis   : row.jenis as MenuNode["jenis"],
      urutan  : row.urutan,
      children: [],
    });
  }

  const tree: MenuNode[] = [];

  for (const row of rows) {
    const node = nodeMap.get(row.kodemenu)!;
    const parent = row.kodeinduk ? nodeMap.get(row.kodeinduk) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      tree.push(node);
    }
  }

  return tree;
}
