import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const globalForPrisma = globalThis;

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const bundledDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const tmpDbPath = '/tmp/dev.db';

function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('file:')) {
    return process.env.DATABASE_URL;
  }

  if (isServerless) {
    try {
      const needsCopy = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size === 0;
      if (needsCopy && fs.existsSync(bundledDbPath)) {
        fs.copyFileSync(bundledDbPath, tmpDbPath);
      }
    } catch (err) {
      console.warn('Failed to copy prisma/dev.db to /tmp/dev.db:', err);
    }
    return `file:${tmpDbPath}`;
  }

  return `file:${bundledDbPath}`;
}

const resolvedUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedUrl,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
