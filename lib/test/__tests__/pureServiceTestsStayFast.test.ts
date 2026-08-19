import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Membuktikan AC "test service yang tidak menyentuh database tetap berjalan cepat dan tidak
 * ikut terbebani setup ini" (tiket 03). Pendekatan: memverifikasi secara statis bahwa modul
 * lokasi — satu-satunya modul `lib/server/*` yang masih murni in-memory (lihat
 * `lib/server/lokasi/repository.ts`, `resetLokasiStoreForTests`) — dan test-nya tidak
 * mengimpor infrastruktur database test (`lib/test/db.ts`) maupun provisioning
 * (`lib/server/provisioning`) sama sekali.
 *
 * Ini sengaja bukan assertion waktu (mis. "selesai di bawah N ms"): waktu jalan test rentan
 * flaky tergantung beban mesin CI, sedangkan ketiadaan import ke modul yang membuka koneksi
 * MariaDB adalah jaminan struktural — kalau test murni ini pernah mulai memicu
 * `getTestDb`/`resetTables`/`provisionDatabase`, source text-nya pasti berubah dan test ini
 * gagal, sebelum sempat menjadi lambat.
 */
const PURE_MODULE_FILES = [
  "lib/server/lokasi/repository.ts",
  "lib/server/lokasi/service.ts",
  "lib/server/lokasi/__tests__/service.test.ts",
];

const DATABASE_INFRA_IMPORTS = [
  "@/lib/test/db",
  "@/lib/server/provisioning",
  "mariadb",
  "@prisma/adapter-mariadb",
];

const REPO_ROOT = path.resolve(__dirname, "../../..");

describe("test service murni (modul lokasi) tidak mengimpor infrastruktur database test", () => {
  for (const relativePath of PURE_MODULE_FILES) {
    it(`${relativePath} tidak mengimpor lib/test/db, lib/server/provisioning, atau driver MariaDB`, () => {
      const source = readFileSync(path.join(REPO_ROOT, relativePath), "utf-8");

      for (const forbiddenImport of DATABASE_INFRA_IMPORTS) {
        expect(source).not.toContain(forbiddenImport);
      }
    });
  }
});
