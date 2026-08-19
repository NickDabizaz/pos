import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";

import mariadb, { type Connection } from "mariadb";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";

const REPO_ROOT = path.resolve(__dirname, "../..");

export type PrismaSchema = "global" | "perusahaan";

const SCHEMA_ENV_VAR: Record<PrismaSchema, string> = {
  global    : "GLOBAL_DATABASE_URL",
  perusahaan: "PERUSAHAAN_DATABASE_URL",
};

/** Generates a throwaway database name for one test run — never reused across runs. */
export function uniqueDatabaseName(schema: PrismaSchema): string {
  return `pos_test_${schema}_${Date.now()}_${randomBytes(3).toString("hex")}`;
}

export function databaseUrl(name: string): string {
  return `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${name}`;
}

async function withAdminConnection<T>(fn: (conn: Connection) => Promise<T>): Promise<T> {
  const conn = await mariadb.createConnection({
    host    : DB_HOST,
    port    : DB_PORT,
    user    : DB_USER,
    password: DB_PASSWORD,
  });
  try {
    return await fn(conn);
  } finally {
    await conn.end();
  }
}

export async function createDatabase(name: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`CREATE DATABASE \`${name}\``));
}

export async function dropDatabase(name: string): Promise<void> {
  await withAdminConnection((conn) => conn.query(`DROP DATABASE IF EXISTS \`${name}\``));
}

/** Runs `prisma migrate deploy` for the given schema against the given database, via the real CLI. */
export function migrateDeploy(schema: PrismaSchema, name: string): void {
  execFileSync(
    "npx",
    ["prisma", "migrate", "deploy", "--config", `prisma/${schema}/prisma.config.ts`],
    {
      cwd  : REPO_ROOT,
      env  : { ...process.env, [SCHEMA_ENV_VAR[schema]]: databaseUrl(name) },
      stdio: "pipe",
      shell: true,
    },
  );
}

export async function listTables(name: string): Promise<string[]> {
  return withAdminConnection(async (conn) => {
    const rows: Array<{ TABLE_NAME: string }> = await conn.query(
      "SELECT TABLE_NAME FROM information_schema.tables WHERE TABLE_SCHEMA = ?",
      [name],
    );
    return rows.map((row) => row.TABLE_NAME);
  });
}

export async function listColumns(name: string, table: string): Promise<string[]> {
  return withAdminConnection(async (conn) => {
    const rows: Array<{ COLUMN_NAME: string }> = await conn.query(
      "SELECT COLUMN_NAME FROM information_schema.columns WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [name, table],
    );
    return rows.map((row) => row.COLUMN_NAME);
  });
}

/**
 * Creates a throwaway database, runs the real migration CLI against it, and hands back a
 * Prisma client pointed at it plus a teardown to disconnect and drop the database.
 */
export async function setUpMigratedDatabase<TClient>(
  schema: PrismaSchema,
  createClient: (adapter: PrismaMariaDb) => TClient,
): Promise<{ dbName: string; prisma: TClient; tearDown: () => Promise<void> }> {
  const dbName = uniqueDatabaseName(schema);
  await createDatabase(dbName);
  migrateDeploy(schema, dbName);

  const url = new URL(databaseUrl(dbName));
  const prisma = createClient(
    new PrismaMariaDb({
      host    : url.hostname,
      port    : Number(url.port),
      user    : url.username,
      password: url.password,
      database: dbName,
    }),
  );

  const tearDown = async () => {
    const client = prisma as { $disconnect: () => Promise<void> };
    await client.$disconnect();
    await dropDatabase(dbName);
  };

  return { dbName, prisma, tearDown };
}
