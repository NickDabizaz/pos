export interface MenuRow {
  kodemenu : string;
  kodeinduk: string | null;
  namamenu : string;
  jenis    : string;
  urutan   : string | null;
}

export interface MenuNode {
  kodemenu: string;
  namamenu: string;
  jenis   : "HEADER" | "DETAIL";
  urutan  : string | null;
  children: MenuNode[];
}
