import { execFileSync } from "node:child_process";
import path from "node:path";

import mariadb, { type Connection } from "mariadb";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "@/lib/generated/prisma-perusahaan/client";
import type { ConfigRow, DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";

const ER_DB_CREATE_EXISTS = 1007;

const REPO_ROOT = process.cwd();

const PRISMA_CLI_ENTRY = path.join(REPO_ROOT, "node_modules", "prisma", "build", "index.js");

function adminConnectionConfig() {
  const config = {
    host          : process.env.DB_HOST ?? "localhost",
    port          : Number(process.env.DB_PORT ?? 3306),
    user          : process.env.DB_USER ?? "root",
    password      : process.env.DB_PASSWORD ?? "",
    connectTimeout: 5_000,
  };

  return config;
}

function databasePerusahaanUrl(namadatabase: string): string {
  const config = adminConnectionConfig();
  const url = `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${namadatabase}`;

  return url;
}

async function withAdminConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await mariadb.createConnection(adminConnectionConfig());
  try {
    const hasil = await fn(conn);

    return hasil;
  } finally {
    await conn.end();
  }
}

export async function createDatabasePerusahaanIfNotExists(namadatabase: string): Promise<void> {
  try {
    await withAdminConnection((conn) => conn.query(`CREATE DATABASE \`${namadatabase}\``));
  } catch (error) {
    if ((error as { errno?: number }).errno === ER_DB_CREATE_EXISTS) {
      return;
    }
    throw error;
  }
}

export async function dropDatabasePerusahaan(namadatabase: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`DROP DATABASE IF EXISTS \`${namadatabase}\``));
}

export function migrateDatabasePerusahaan(namadatabase: string): void {
  execFileSync(
    process.execPath,
    [PRISMA_CLI_ENTRY, "migrate", "deploy", "--config", "prisma/perusahaan/prisma.config.ts"],
    {
      cwd  : REPO_ROOT,
      env  : { ...process.env, PERUSAHAAN_DATABASE_URL: databasePerusahaanUrl(namadatabase) },
      stdio: "pipe",
    },
  );
}

const databasePerusahaanClients = new Map<string, PrismaClient>();

export function getDatabasePerusahaanClient(namadatabase: string): DatabasePerusahaanClient {
  const cached = databasePerusahaanClients.get(namadatabase);
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

  databasePerusahaanClients.set(namadatabase, client);

  return client;
}

export async function disposeDatabasePerusahaanClient(namadatabase: string): Promise<void> {
  const client = databasePerusahaanClients.get(namadatabase);
  if (!client) {
    return;
  }

  databasePerusahaanClients.delete(namadatabase);
  await client.$disconnect();
}

export async function seedDefaultConfig(client: DatabasePerusahaanClient, rows: ConfigRow[]): Promise<void> {
  await client.config.createMany({ data: rows, skipDuplicates: true });
}

/** Lokasi & Customer tetap dipakai Kasir POS (kodelokasi "TOKO", kodecustomer "CASH"), lihat lib/client/penjualan konsumen di app/pos. */
export async function seedDefaultMasterData(client: DatabasePerusahaanClient): Promise<void> {
  await client.lokasi.createMany({ data: [{ kodelokasi: "TOKO", namalokasi: "TOKO" }], skipDuplicates: true });
  await client.customer.createMany({ data: [{ kodecustomer: "CASH", namacustomer: "CASH" }], skipDuplicates: true });
}
