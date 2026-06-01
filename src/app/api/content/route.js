import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const profile = await prisma.profile.findFirst({
      include: {
        specializations: true,
        paymentSettings: true,
      },
    });

    const services = await prisma.service.findMany({
      orderBy: { id: 'asc' },
    });

    const legalDocs = await prisma.legalDoc.findMany({
      orderBy: { id: 'asc' },
    });

    return NextResponse.json({
      success: true,
      profile,
      services,
      legalDocs,
    });
  } catch (error) {
    console.error('Error fetching public content:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при отриманні контенту' },
      { status: 500 }
    );
  }
}
