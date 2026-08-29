import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

// Shallow guard on the hand-edited SeedData block per ADR "fold into init migration": parses the
// INSERT VALUES rows so a future edit can't silently duplicate `urutan` or misparent a node.
const migrationPath = path.resolve(__dirname, "..", "migration.sql");
const sql = readFileSync(migrationPath, "utf8");

type SeedRow = { kodemenu: string; kodeinduk: string | null; namamenu: string; jenis: string; urutan: string };

function parseSeedRows(): SeedRow[] {
  const match = /INSERT INTO `menu`[^;]*VALUES\s*([\s\S]*?);/.exec(sql);
  if (!match) {
    throw new Error("Blok SeedData menu tidak ditemukan di migration.sql");
  }

  const rowPattern = /\(\s*'([^']*)',\s*(NULL|'[^']*'),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*\d+\s*\)/g;
  const rows: SeedRow[] = [];
  let m: RegExpExecArray | null;
  while ((m = rowPattern.exec(match[1])) !== null) {
    rows.push({
      kodemenu : m[1],
      kodeinduk: m[2] === "NULL" ? null : m[2].slice(1, -1),
      namamenu : m[3],
      jenis    : m[4],
      urutan   : m[5],
    });
  }

  return rows;
}

describe("SeedData menu di migration init", () => {
  it("LAPOR di-seed sebagai HEADER urutan 5, dengan tujuh anak DETAIL kodeinduk LAPOR urutan 5.1..5.7", () => {
    const rows = parseSeedRows();
    const lapor = rows.find((row) => row.kodemenu === "LAPOR");
    expect(lapor).toMatchObject({ kodeinduk: null, jenis: "HEADER", urutan: "5" });

    const anak = rows.filter((row) => row.kodeinduk === "LAPOR");
    expect(anak.map((row) => row.kodemenu)).toEqual([
      "LAP-JUL", "LAP-BEL", "LAP-KAS", "LAP-OPS", "LAP-KST", "LAP-PST", "LAP-JRN",
    ]);
    expect(anak.map((row) => row.urutan)).toEqual(["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7"]);
  });

  it("KASIR-TTP, LANGGANAN, PENGGUNA, PENGATURAN digeser ke urutan 6..9 tanpa tabrakan", () => {
    const rows = parseSeedRows();
    const cari = (kode: string) => rows.find((row) => row.kodemenu === kode)?.urutan;

    expect(cari("KASIR-TTP")).toBe("6");
    expect(cari("LANGGANAN")).toBe("7");
    expect(cari("PENGGUNA")).toBe("8");
    expect(cari("PENGATURAN")).toBe("9");
  });

  it("tidak ada dua node top-level (kodeinduk NULL) berbagi urutan yang sama", () => {
    const rows = parseSeedRows();
    const topLevelUrutan = rows.filter((row) => row.kodeinduk === null).map((row) => row.urutan);

    expect(new Set(topLevelUrutan).size).toBe(topLevelUrutan.length);
  });
});
