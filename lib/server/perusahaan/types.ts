import type { PrismaClient } from "@/lib/generated/prisma-global/client";

export type GlobalClient = PrismaClient;

export type PerusahaanRow = {
  idperusahaan  : number;
  kodeperusahaan: string;
  namaperusahaan: string;
  namadatabase  : string;
  status        : number;
};

export type DaftarPerusahaanInput = {
  iduser        : string;
  namaperusahaan: string;
  generateKode  : boolean;
  kodeperusahaan: string;
};

export type DaftarPerusahaanDeps = {
  buatDatabase: (namadatabase: string) => Promise<unknown>;
};

export type PilihPerusahaanInput = {
  iduser      : string;
  idsesi      : string;
  idperusahaan: number;
};
