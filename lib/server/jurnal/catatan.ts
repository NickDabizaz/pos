import type { JenisTransaksi } from "@/lib/server/kartustok/types";

const PANJANG_CATATAN_MAKSIMAL = 255;

export type InputCatatanJurnal =
  | {
      jenistransaksi: Extract<JenisTransaksi, "PENJUALAN" | "POS">;
      namacustomer  : string;
    }
  | {
      jenistransaksi: Extract<JenisTransaksi, "PEMBELIAN">;
      namasupplier  : string;
    }
  | {
      jenistransaksi: Extract<JenisTransaksi, "KAS MASUK" | "KAS KELUAR">;
      keterangan    : string;
    };

function potongDanKapitalkan(catatan: string): string {
  const hasil = catatan.toUpperCase().slice(0, PANJANG_CATATAN_MAKSIMAL);

  return hasil;
}

export function buatCatatanJurnal(input: InputCatatanJurnal): string {
  let hasil: string;

  switch (input.jenistransaksi) {
    case "PENJUALAN":
    case "POS":
      hasil = potongDanKapitalkan(`${input.jenistransaksi} KEPADA ${input.namacustomer}`);
      break;
    case "PEMBELIAN":
      hasil = potongDanKapitalkan(`PEMBELIAN DARI ${input.namasupplier}`);
      break;
    case "KAS MASUK":
    case "KAS KELUAR":
      hasil = potongDanKapitalkan(`${input.jenistransaksi} ${input.keterangan}`);
      break;
  }

  return hasil;
}
