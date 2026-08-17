export interface MenuNode {
  kodemenu: string
  namamenu: string
  jenis   : "HEADER" | "DETAIL"
  urutan  : string | null
  children: MenuNode[]
}
