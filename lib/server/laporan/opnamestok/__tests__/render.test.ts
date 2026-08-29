import { describe, expect, it } from "vitest";

import { buatKonteksLaporanOpnameStok, renderLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/render";
import type { BarisLaporanOpnameStok } from "@/lib/server/laporan/opnamestok/types";

function buatBaris(overrides: Partial<BarisLaporanOpnameStok> = {}): BarisLaporanOpnameStok {
  return {
    kodeopname: "OP2608240001",
    tgltrans  : new Date("2026-08-24T00:00:00.000Z"),
    namalokasi: "Toko Pusat",
    status    : "S",
    namabarang: "Indomie Goreng",
    satuan    : "PCS",
    jmlsistem : 10,
    jmlfisik  : 10,
    selisih   : 0,
    ...overrides,
  };
}

const konteksKosong = buatKonteksLaporanOpnameStok("Toko Nick", {}, new Date("2026-08-28T10:30:00.000Z"));

describe("render laporan opname stok", () => {
  it("dokumen 3 barang (lebih, kurang, sama) menghasilkan 3 baris; selisih nol tetap tampil", () => {
    const rows = [
      buatBaris({ namabarang: "Lebih", jmlsistem: 10, jmlfisik: 12, selisih: 2 }),
      buatBaris({ namabarang: "Kurang", jmlsistem: 10, jmlfisik: 8, selisih: -2 }),
      buatBaris({ namabarang: "Sama", jmlsistem: 10, jmlfisik: 10, selisih: 0 }),
    ];

    const html = renderLaporanOpnameStok(rows, konteksKosong);

    expect((html.match(/<tr/g) ?? []).length).toBe(4); // header + 3
    expect(html).toContain("Sama");
  });

  it("selisih negatif dirender apa adanya (jmlfisik - jmlsistem)", () => {
    const html = renderLaporanOpnameStok([buatBaris({ jmlsistem: 10, jmlfisik: 8, selisih: -2 })], konteksKosong);

    expect(html).toContain("-2");
  });

  it("satuan diambil dari baris opnamestokdtl, bukan diformat ulang dari nama Barang", () => {
    const html = renderLaporanOpnameStok([buatBaris({ satuan: "DUS" })], konteksKosong);

    expect(html).toContain("DUS");
  });

  it("Opname D disembunyikan default — penanda hanya tampil saat baris D disertakan", () => {
    const html = renderLaporanOpnameStok([buatBaris({ status: "D" })], konteksKosong);

    expect(html).toContain("DIBATALKAN");
  });

  it("nol baris -> dokumen sah dengan pesan tidak ada data", () => {
    const html = renderLaporanOpnameStok([], konteksKosong);

    expect(html).toContain("Tidak ada data");
    expect(html).not.toContain("<tbody>");
  });
});
