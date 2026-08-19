import { getTenantClient } from "@/lib/server/provisioning/repository";
import type { TenantClient } from "@/lib/server/provisioning/types";

/**
 * Nama Database Perusahaan test yang persisten dan dipakai ulang antar `vitest run` (beda
 * dari `prisma/__tests__/testDatabase.ts`, yang membuat database throwaway per run untuk
 * menguji schema/migration itu sendiri). Disiapkan sekali lewat `globalSetup`
 * (`vitest.globalSetup.ts`) memakai jalur Provisioning yang sama dengan produksi
 * (`provisionDatabase`), sehingga migration tenant ikut teruji oleh pemakaiannya sendiri.
 *
 * Cara menyiapkan di mesin baru: tidak perlu langkah manual — jalankan `npm run test`.
 * `globalSetup` memanggil `provisionDatabase` otomatis sebelum test pertama berjalan, dan
 * memakai ulang database ini (tanpa migrate dari nol) di run-run berikutnya. Syaratnya
 * hanya MariaDB menyala di `DB_HOST`/`DB_PORT` (lihat `.env`) dengan user yang punya hak
 * `CREATE DATABASE`, `CREATE/ALTER/DROP TABLE`, dan baca/tulis baris — user `root` lokal
 * tanpa password (default project ini) sudah mencukupi.
 */
export const TEST_DATABASE_NAME = process.env.TEST_DATABASE_NAME ?? "pos_test_perusahaan";

/** Client tenant tersambung ke Database Perusahaan test persisten. */
export function getTestDb(): TenantClient {
  return getTenantClient(TEST_DATABASE_NAME);
}

/**
 * Menghapus seluruh baris pada tabel-tabel yang diberikan, dipanggil di `afterEach` test
 * integrasi supaya test berikutnya mulai dari keadaan bersih tanpa menyentuh tabel lain.
 * FK checks dimatikan sementara supaya urutan `namaTabel` tidak perlu mengikuti urutan
 * foreign key antar tabel.
 */
export async function resetTables(db: TenantClient, namaTabel: string[]): Promise<void> {
  if (namaTabel.length === 0) {
    return;
  }

  // FOREIGN_KEY_CHECKS is a session variable: it only affects the connection that set it, so
  // the whole sequence must run on one connection — hence $transaction rather than separate
  // $executeRawUnsafe calls, which the pool could otherwise hand out to different connections.
  await db.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const table of namaTabel) {
        await tx.$executeRawUnsafe(`DELETE FROM \`${table}\``);
      }
    } finally {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }
  });
}
