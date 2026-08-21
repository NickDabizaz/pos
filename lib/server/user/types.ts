import type { PrismaClient } from "@/lib/generated/prisma-global/client";

/** Client Prisma tersambung ke Database Global. */
export type GlobalClient = PrismaClient;

export type PerusahaanMembership = {
  idperusahaan  : number;
  kodeperusahaan: string;
  namaperusahaan: string;
  isowner       : boolean;
};
