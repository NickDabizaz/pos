import type { Barang } from "@/lib/server/barang/types";
import type { TransaksiItem } from "@/lib/server/transaksi/types";

export type ItemLinesTableProps = {
  barangList    : Barang[];
  items         : TransaksiItem[];
  onChangeAction: (items: TransaksiItem[]) => void;
  priceField    : "hargabeli" | "hargajual";
  priceLabel    : string;
};
