import type { PrismaClient } from "@/lib/generated/prisma-perusahaan/client";

export type TenantClient = PrismaClient;

export type ConfigRow = {
  modul : string;
  config: string;
  nilai : string;
};
