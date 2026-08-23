import type { Prisma, PrismaClient } from "@/lib/generated/prisma-perusahaan/client";

export type DatabasePerusahaanClient = PrismaClient | Prisma.TransactionClient;

export type ConfigRow = {
  modul : string;
  config: string;
  nilai : string;
};
