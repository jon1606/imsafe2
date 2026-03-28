/**
 * Database client.
 *
 * Uses the in-memory mock store (zero setup, perfect for demo/mockup).
 * To switch to a real PostgreSQL database:
 *   1. Set DATABASE_URL in your environment
 *   2. Run: npx prisma generate && npx prisma db push
 *   3. Replace this file with the standard Prisma singleton:
 *
 *      import { PrismaClient } from "@prisma/client";
 *      const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
 *      export const prisma = globalForPrisma.prisma ?? new PrismaClient();
 *      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
 */

import { mockPrisma } from "@/lib/mock/db";

export const prisma = mockPrisma;
