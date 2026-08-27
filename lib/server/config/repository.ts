import { Prisma } from "@/lib/generated/prisma-perusahaan/client";
import type { DatabasePerusahaanClient } from "@/lib/server/databaseperusahaan/types";
import type { ConfigRow } from "@/lib/server/config/types";

export async function findAllConfig(db: DatabasePerusahaanClient): Promise<ConfigRow[]> {
  const rows = await db.config.findMany({ orderBy: [{ modul: "asc" }, { config: "asc" }] });

  return rows;
}

export async function findConfigRowsByModul(db: DatabasePerusahaanClient, modul: string): Promise<ConfigRow[]> {
  const rows = await db.config.findMany({ where: { modul }, orderBy: { config: "asc" } });

  return rows;
}

export async function upsertConfigRow(
  db          : DatabasePerusahaanClient,
  modul       : string,
  config      : string,
  nilai       : string,
): Promise<ConfigRow> {
  try {
    const row = await db.config.upsert({
      where: { modul_config: { modul, config } },
      update: { nilai },
      create: { modul, config, nilai },
    });

    return row;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const row = await db.config.update({ where: { modul_config: { modul, config } }, data: { nilai } });

      return row;
    }
    throw error;
  }
}
