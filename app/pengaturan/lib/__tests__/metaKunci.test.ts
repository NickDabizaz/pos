import { describe, expect, it } from "vitest";

import { kelompokDari, labelModul, labelPilihan, metaKunci } from "@/app/pengaturan/lib/metaKunci";

describe("Formatter halaman pengaturan", () => {
  it("kunci dikenal memiliki label dan tipe input pilihan", () => {
    const tema = metaKunci("TEMA");

    expect(tema.label).toBe("Tema Tampilan");
    expect(tema.tipe).toBe("pilihan");
    expect(tema.pilihan).toEqual(["LIGHT", "DARK"]);
  });

  it("modul tak dikenal ditampilkan apa adanya, kunci tak dikenal jatuh ke input teks", () => {
    expect(labelModul("PPN")).toBe("PPN");
    expect(labelModul("PAJAKDAERAH")).toBe("PAJAKDAERAH");
    expect(metaKunci("KUNCIBARU")).toEqual({ label: "KUNCIBARU", tipe: "teks" });
  });

  it("label pilihan tema memakai istilah 'Mode' sedangkan nilai tersimpan tetap token", () => {
    expect(labelPilihan("LIGHT")).toBe("Light Mode");
    expect(labelPilihan("DARK")).toBe("Dark Mode");
    expect(labelPilihan("0")).toBe("0");
  });

  it("setiap modul kode dokumen dipetakan ke kelompok tab yang benar", () => {
    expect(kelompokDari("PPN")).toBe("GLOBAL");
    expect(kelompokDari("TAMPILAN")).toBe("GLOBAL");
    expect(kelompokDari("BARANG")).toBe("MASTER");
    expect(kelompokDari("KAS")).toBe("TRANSAKSI");
  });
});
