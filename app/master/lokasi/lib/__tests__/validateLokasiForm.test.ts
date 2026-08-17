import { describe, expect, it } from "vitest";

import { validateLokasiForm } from "@/app/master/lokasi/lib/validateLokasiForm";
import type { Lokasi } from "@/app/master/lokasi/lib/types";

const validLokasi: Lokasi = {
  kodelokasi: "LOK-0001",
  namalokasi: "Toko Utama",
  keterangan: "Display etalase",
  status    : 1,
};

describe("validateLokasiForm", () => {
  it("returns no errors for a valid lokasi", () => {
    expect(validateLokasiForm(validLokasi)).toEqual({});
  });

  it("requires kodelokasi when skipKodelokasi is not set", () => {
    const errors = validateLokasiForm({ ...validLokasi, kodelokasi: "" });
    expect(errors.kodelokasi).toBe("Kode lokasi wajib diisi");
  });

  it("skips kodelokasi validation when skipKodelokasi is true", () => {
    const errors = validateLokasiForm(
      { ...validLokasi, kodelokasi: "" },
      { skipKodelokasi: true },
    );
    expect(errors.kodelokasi).toBeUndefined();
  });

  it("requires namalokasi", () => {
    const errors = validateLokasiForm({ ...validLokasi, namalokasi: "   " });
    expect(errors.namalokasi).toBe("Nama lokasi wajib diisi");
  });
});
