import type { MenuNode, MenuRow } from "@/lib/server/menu/types";

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
