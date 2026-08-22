import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

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
