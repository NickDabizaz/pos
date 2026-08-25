import type { JenisTransaksiStok } from "@/lib/server/kartustok/types";

const PANJANG_CATATAN_MAKSIMAL = 255;

export type InputCatatanKartuStok =
  | {
      jenistransaksi: Extract<JenisTransaksiStok, "PENJUALAN" | "POS">;
      namabarang    : string;
      namacustomer  : string;
    }
  | {
      jenistransaksi: Extract<JenisTransaksiStok, "PEMBELIAN">;
      namabarang    : string;
      namasupplier  : string;
    };

function potongDanKapitalkan(catatan: string): string {
  const hasil = catatan.toUpperCase().slice(0, PANJANG_CATATAN_MAKSIMAL);

  return hasil;
}

export function buatCatatanKartuStok(input: InputCatatanKartuStok): string {
  let hasil: string;

  if (input.jenistransaksi === "PEMBELIAN") {
    hasil = potongDanKapitalkan(`PEMBELIAN ${input.namabarang} DARI ${input.namasupplier}`);
  } else {
    hasil = potongDanKapitalkan(`${input.jenistransaksi} ${input.namabarang} KE ${input.namacustomer}`);
  }

  return hasil;
}
