import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    // Provisions the persistent test Database Perusahaan once before the whole suite runs
    // (see vitest.globalSetup.ts). Runs in a separate process from test files, so it cannot
    // share JS instances with them directly — test files reconnect via lib/test/db.ts using
    // the same fixed database name.
    globalSetup: "./vitest.globalSetup.ts",
    // Integration test files share one persistent Database Perusahaan (see lib/test/db.ts) and
    // reset overlapping tables (lokasi, customer, jual, ...) in afterEach. Running test files in
    // parallel lets one file's resetTables wipe rows another file is mid-transaction with,
    // producing flaky foreign-key violations. Serialize file execution to keep the shared
    // database consistent; tests within a single file still run in their normal order.
    fileParallelism: false,
  },
});
