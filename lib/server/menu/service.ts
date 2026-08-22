import type { AksesMenuParams, MenuNode, MenuRow } from "@/lib/server/menu/types";

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
