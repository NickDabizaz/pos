import { describe, expect, it } from "vitest";

import { buatKonteksLaporanOpnameStok, renderLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/render";
import type { TransaksiLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/types";

function buatTransaksi(overrides: Partial<TransaksiLaporanOpnameStok> = {}): TransaksiLaporanOpnameStok {
  return {
    kodeopname     : "OP2608240001",
    tgltrans       : new Date("2026-08-24T00:00:00.000Z"),
    namalokasi     : "Toko Pusat",
    status         : "S",
    detail         : [
      { namabarang: "Lebih", satuan: "PCS", jmlsistem: 10, jmlfisik: 12, selisih: 2 },
      { namabarang: "Kurang", satuan: "PCS", jmlsistem: 10, jmlfisik: 8, selisih: -2 },
    ],
    jmlDisembunyikan: 1,
    ...overrides,
  };
}

const konteks = buatKonteksLaporanOpnameStok("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render laporan opname stok", () => {
  it("baris grup + detail selisih; catatan barang sesuai disembunyikan", () => {
    const html = renderLaporanOpnameStok([buatTransaksi()], konteks);

    expect((html.match(/class="grup/g) ?? []).length).toBe(1);
    expect(html).toContain("Lebih (PCS)");
    expect(html).toContain("1 barang sesuai disembunyikan");
  });

  it("TOTAL SELISIH menjumlahkan selisih semua detail", () => {
    const html = renderLaporanOpnameStok(
      [buatTransaksi({ detail: [{ namabarang: "A", satuan: "PCS", jmlsistem: 10, jmlfisik: 13, selisih: 3 }], jmlDisembunyikan: 0 })],
      konteks,
    );

    expect(html).toContain("TOTAL SELISIH (1 transaksi)");
    expect(html).toContain("<td class=\"angka\">3</td>");
  });

  it("Opname D membawa penanda", () => {
    expect(renderLaporanOpnameStok([buatTransaksi({ status: "D" })], konteks)).toContain("DIBATALKAN");
  });

  it("nol transaksi -> pesan tidak ada data", () => {
    const html = renderLaporanOpnameStok([], konteks);
    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });
});
