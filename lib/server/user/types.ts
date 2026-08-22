import type { PrismaClient } from "@/lib/generated/prisma-global/client";

export type GlobalClient = PrismaClient;

export type PerusahaanMembership = {
  idperusahaan  : number;
  kodeperusahaan: string;
  namaperusahaan: string;
  isowner       : boolean;
  status        : number;
};
