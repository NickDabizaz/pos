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
  },
});
