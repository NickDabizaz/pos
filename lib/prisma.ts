import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import { PrismaClient } from "@/lib/generated/prisma-global/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

const adapter = new PrismaMariaDb({
  host    : process.env.DB_HOST,
  port    : Number(process.env.DB_PORT ?? 3306),
  user    : process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
