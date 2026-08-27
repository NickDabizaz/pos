import { describe, expect, it } from "vitest";

import { labelModul, metaKunci } from "@/app/pengaturan/lib/metaKunci";

describe("Formatter halaman pengaturan", () => {
  it("kunci dikenal memiliki label dan tipe input pilihan", () => {
    const tema = metaKunci("tema");

    expect(tema.label).toBe("Tema Tampilan");
    expect(tema.tipe).toBe("pilihan");
    expect(tema.pilihan).toEqual(["terang", "gelap"]);
  });

  it("modul tak dikenal ditampilkan apa adanya, kunci tak dikenal jatuh ke input teks", () => {
    expect(labelModul("ppn")).toBe("PPN");
    expect(labelModul("pajakdaerah")).toBe("pajakdaerah");
    expect(metaKunci("kunciBaru")).toEqual({ label: "kunciBaru", tipe: "teks" });
  });
});
