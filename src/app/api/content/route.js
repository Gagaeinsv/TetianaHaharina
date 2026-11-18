import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ensureSeeded, getFallbackPayload } from '@/lib/defaultData';
import { getTodayStr } from '@/lib/scheduleUtils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureSeeded(prisma);

    const profile = await prisma.profile.findFirst({
      include: {
        specializations: {
          orderBy: { id: 'asc' },
        },
        paymentSettings: true,
      },
    });

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
    });

    const legalDocs = await prisma.legalDoc.findMany({
      orderBy: { id: 'asc' },
    });

    const scheduleOverrides = await prisma.scheduleOverride.findMany({
      where: {
        date: { gte: getTodayStr() },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({
      success: true,
      profile,
      services,
      legalDocs,
      scheduleOverrides,
    });
  } catch (error) {
    console.error('Error fetching public content, serving fallback data:', error);
    return NextResponse.json(getFallbackPayload());
  }
}
