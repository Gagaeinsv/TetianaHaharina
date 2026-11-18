import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { DEFAULT_SLOTS, DEFAULT_WORKING_DAYS, ensureSeeded } from '@/lib/defaultData';
import { computeDaySchedule, safeParseJsonArray, sortTimeSlots } from '@/lib/scheduleUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureSeeded(prisma);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    const monthParam = searchParams.get('month');

    const profile = await prisma.profile.findFirst();
    const workingDays = safeParseJsonArray(profile?.workingDays, DEFAULT_WORKING_DAYS);
    const defaultSlots = sortTimeSlots(safeParseJsonArray(profile?.defaultSlots, DEFAULT_SLOTS));

    if (dateParam) {
      const [override, bookings] = await Promise.all([
        prisma.scheduleOverride.findUnique({ where: { date: dateParam } }),
        prisma.booking.findMany({
          where: {
            date: dateParam,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: { timeSlot: true },
        }),
      ]);

      const busySlots = bookings.map((b) => b.timeSlot);
      const daySchedule = computeDaySchedule({
        dateStr: dateParam,
        workingDays,
        defaultSlots,
        override,
        busySlots,
      });

      return NextResponse.json({
        success: true,
        workingDays,
        defaultSlots,
        ...daySchedule,
      });
    }

    const now = new Date();
    const targetMonth =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam)
        ? monthParam
        : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [year, month] = targetMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${targetMonth}-01`;
    const endDate = `${targetMonth}-${String(daysInMonth).padStart(2, '0')}`;

    const [overrides, bookings] = await Promise.all([
      prisma.scheduleOverride.findMany({
        where: { date: { gte: startDate, lte: endDate } },
      }),
      prisma.booking.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { date: true, timeSlot: true },
      }),
    ]);

    const overrideMap = new Map(overrides.map((o) => [o.date, o]));
    const busyMap = new Map();
    for (const b of bookings) {
      const list = busyMap.get(b.date) || [];
      list.push(b.timeSlot);
      busyMap.set(b.date, list);
    }

    const days = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${targetMonth}-${String(day).padStart(2, '0')}`;
      days[dateStr] = computeDaySchedule({
        dateStr,
        workingDays,
        defaultSlots,
        override: overrideMap.get(dateStr) || null,
        busySlots: busyMap.get(dateStr) || [],
      });
    }

    return NextResponse.json({
      success: true,
      month: targetMonth,
      workingDays,
      defaultSlots,
      days,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при отриманні розкладу' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const isAuthorized = await checkAuth();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Неавторизований доступ' }, { status: 401 });
    }

    const body = await request.json();

    if (body.type === 'DEFAULT') {
      const workingDays = Array.isArray(body.workingDays)
        ? body.workingDays.map(Number).filter((d) => d >= 0 && d <= 6)
        : DEFAULT_WORKING_DAYS;
      const defaultSlots = sortTimeSlots(
        (Array.isArray(body.defaultSlots) ? body.defaultSlots : DEFAULT_SLOTS).filter((s) =>
          /^\d{2}:\d{2}$/.test(s)
        )
      );

      await prisma.profile.update({
        where: { id: 1 },
        data: {
          workingDays: JSON.stringify(workingDays),
          defaultSlots: JSON.stringify(defaultSlots),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Базовий графік роботи оновлено',
        workingDays,
        defaultSlots,
      });
    }

    const { date, isDayOff, blockedSlots, extraSlots, note } = body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'Некоректна дата' }, { status: 400 });
    }

    const cleanBlocked = sortTimeSlots(
      (Array.isArray(blockedSlots) ? blockedSlots : []).filter((s) => /^\d{2}:\d{2}$/.test(s))
    );
    const cleanExtra = sortTimeSlots(
      (Array.isArray(extraSlots) ? extraSlots : []).filter((s) => /^\d{2}:\d{2}$/.test(s))
    );

    const override = await prisma.scheduleOverride.upsert({
      where: { date },
      update: {
        isDayOff: Boolean(isDayOff),
        blockedSlots: JSON.stringify(cleanBlocked),
        extraSlots: JSON.stringify(cleanExtra),
        note: String(note || ''),
      },
      create: {
        date,
        isDayOff: Boolean(isDayOff),
        blockedSlots: JSON.stringify(cleanBlocked),
        extraSlots: JSON.stringify(cleanExtra),
        note: String(note || ''),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Виняток у розкладі збережено',
      override,
    });
  } catch (error) {
    console.error('Error updating schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при збереженні графіка' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const isAuthorized = await checkAuth();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Неавторизований доступ' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Дата обов’язкова' }, { status: 400 });
    }

    await prisma.scheduleOverride.deleteMany({ where: { date } });
    return NextResponse.json({ success: true, message: 'Налаштування дня скинуто до базового графіка' });
  } catch (error) {
    console.error('Error resetting schedule override:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при скиданні налаштувань дня' },
      { status: 500 }
    );
  }
}
