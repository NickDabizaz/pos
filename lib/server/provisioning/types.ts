import type { PrismaClient } from "@/lib/generated/prisma-perusahaan/client";

/** Client Prisma tersambung ke satu Database Perusahaan tertentu. */
export type TenantClient = PrismaClient;

export type ConfigRow = {
  modul : string;
  config: string;
  nilai : string;
};
