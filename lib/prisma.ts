import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const isPostgres = process.env.DATABASE_URL?.startsWith("postgres") ?? false;

export const prisma =
  globalForPrisma.prisma ??
  (isPostgres
    ? new PrismaClient({} as unknown as ConstructorParameters<typeof PrismaClient>[0])
    : new PrismaClient({
        adapter: new PrismaBetterSqlite3({
          url: process.env.DATABASE_URL ?? "file:./dev.db",
        }),
      } as unknown as ConstructorParameters<typeof PrismaClient>[0]));

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
