import { beforeEach, describe, expect, it } from "vitest";

import { resetLokasiStoreForTests } from "@/lib/server/lokasi/repository";
import {
  createLokasi,
  deleteLokasi,
  DuplicateKodeError,
  generateKodeLokasi,
  listLokasi,
  LokasiNotFoundError,
  updateLokasi,
} from "@/lib/server/lokasi/service";
import type { Lokasi } from "@/lib/server/lokasi/types";

const newLokasi: Lokasi = {
  kodelokasi: "LOK-9999",
  namalokasi: "Lokasi Baru",
  keterangan: "Deskripsi lokasi baru",
  status    : 1,
};

beforeEach(() => {
  resetLokasiStoreForTests();
});

describe("createLokasi", () => {
  it("adds the item and it shows up in listLokasi", () => {
    createLokasi(newLokasi);

    expect(listLokasi()).toContainEqual(newLokasi);
  });

  it("rejects a kodelokasi that already exists", () => {
    createLokasi(newLokasi);

    expect(() => createLokasi(newLokasi)).toThrow(DuplicateKodeError);
  });
});

describe("updateLokasi", () => {
  it("replaces the item's fields", () => {
    createLokasi(newLokasi);

    const updated = updateLokasi(newLokasi.kodelokasi, {
      ...newLokasi,
      namalokasi: "Lokasi Terupdate",
    });

    expect(updated.namalokasi).toBe("Lokasi Terupdate");
    expect(listLokasi()).toContainEqual({
      ...newLokasi,
      namalokasi: "Lokasi Terupdate",
    });
  });

  it("throws when the kodelokasi does not exist", () => {
    expect(() => updateLokasi("LOK-MISSING", newLokasi)).toThrow(LokasiNotFoundError);
  });
});

describe("deleteLokasi", () => {
  it("removes the item from listLokasi", () => {
    createLokasi(newLokasi);

    deleteLokasi(newLokasi.kodelokasi);

    expect(listLokasi()).not.toContainEqual(newLokasi);
  });

  it("throws when the kodelokasi does not exist", () => {
    expect(() => deleteLokasi("LOK-MISSING")).toThrow(LokasiNotFoundError);
  });
});

describe("generateKodeLokasi", () => {
  it("produces a non-empty code not already used by an existing item", () => {
    const generated = generateKodeLokasi();

    expect(generated).toMatch(/^LOK-AUTO-\d+$/);
    expect(listLokasi().some((item) => item.kodelokasi === generated)).toBe(false);
  });
});
