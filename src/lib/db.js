import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis;

// Force Vercel to trace and bundle the SQLite database file
const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
if (fs.existsSync(dbPath)) {
  try {
    fs.readFileSync(dbPath);
  } catch (e) {
    console.warn("Failed to trace dev.db file", e);
  }
}

// Dynamically resolve absolute database URL at runtime
const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }
  return `file:${dbPath}`;
};

export const prisma = globalForPrisma.prisma || new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
