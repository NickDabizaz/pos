import { execFileSync } from "node:child_process";
import path from "node:path";

import mariadb, { type Connection } from "mariadb";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/lib/generated/prisma-perusahaan/client";
import type { ConfigRow, TenantClient } from "@/lib/server/provisioning/types";

/** MariaDB errno untuk `CREATE DATABASE` pada database yang sudah ada. */
const ER_DB_CREATE_EXISTS = 1007;

/**
 * Root repo sebagai cwd untuk CLI Prisma. Pakai `process.cwd()`, bukan `__dirname` — begitu
 * berkas ini dibundel Turbopack, `__dirname` menunjuk path virtual yang tidak ada di disk.
 */
const REPO_ROOT = process.cwd();

/** Entry CLI Prisma, dijalankan lewat `node` langsung agar tidak bergantung pada `npx`
 * menemukan `cmd.exe` di env proses. */
const PRISMA_CLI_ENTRY = path.join(REPO_ROOT, "node_modules", "prisma", "build", "index.js");

/** Sumber kebenaran tunggal untuk parameter koneksi admin (host/port/user/password). */
function adminConnectionConfig() {
  return {
    host          : process.env.DB_HOST ?? "localhost",
    port          : Number(process.env.DB_PORT ?? 3306),
    user          : process.env.DB_USER ?? "root",
    password      : process.env.DB_PASSWORD ?? "",
    connectTimeout: 5_000,
  };
}

function tenantDatabaseUrl(namadatabase: string): string {
  const config = adminConnectionConfig();
  return `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${namadatabase}`;
}

async function withAdminConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await mariadb.createConnection(adminConnectionConfig());
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

/** Membuat Database Perusahaan bila belum ada; tidak melempar error kalau sudah ada (idempoten). */
export async function ensureTenantDatabaseExists(namadatabase: string): Promise<void> {
  try {
    await withAdminConnection((conn) => conn.query(`CREATE DATABASE \`${namadatabase}\``));
  } catch (error) {
    if ((error as { errno?: number }).errno === ER_DB_CREATE_EXISTS) {
      return;
    }
    throw error;
  }
}

/** Menghapus Database Perusahaan; aman dipanggil meski database sudah tidak ada. */
export async function dropTenantDatabase(namadatabase: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`DROP DATABASE IF EXISTS \`${namadatabase}\``));
}

/** Menjalankan seluruh migration tenant (`prisma/perusahaan`) lewat CLI Prisma asli. */
export function migrateTenantDatabase(namadatabase: string): void {
  execFileSync(
    process.execPath,
    [PRISMA_CLI_ENTRY, "migrate", "deploy", "--config", "prisma/perusahaan/prisma.config.ts"],
    {
      cwd  : REPO_ROOT,
      env  : { ...process.env, PERUSAHAAN_DATABASE_URL: tenantDatabaseUrl(namadatabase) },
      stdio: "pipe",
    },
  );
}

const tenantClients = new Map<string, TenantClient>();

/** Mengembalikan client tenant untuk `namadatabase`, dibuat sekali dan digunakan ulang setelahnya. */
export function getTenantClient(namadatabase: string): TenantClient {
  const cached = tenantClients.get(namadatabase);
  if (cached) {
    return cached;
  }

  const config = adminConnectionConfig();
  const client = new PrismaClient({
    adapter: new PrismaMariaDb({
      host    : config.host,
      port    : config.port,
      user    : config.user,
      password: config.password,
      database: namadatabase,
    }),
  });

  tenantClients.set(namadatabase, client);
  return client;
}

/** Melepas dan menghapus client tenant dari cache, dipakai saat provisioning gagal dan dibersihkan. */
export async function disposeTenantClient(namadatabase: string): Promise<void> {
  const client = tenantClients.get(namadatabase);
  if (!client) {
    return;
  }

  tenantClients.delete(namadatabase);
  await client.$disconnect();
}

/** Mengisi baris Config default; aman dipanggil berulang karena baris yang sudah ada dilewati. */
export async function seedDefaultConfig(client: TenantClient, rows: ConfigRow[]): Promise<void> {
  await client.config.createMany({ data: rows, skipDuplicates: true });
}
