import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { DEFAULT_SLOTS, DEFAULT_WORKING_DAYS, ensureSeeded } from '@/lib/defaultData';
import {
  computeDaySchedule,
  getTodayStr,
  normalizePhoneDigits,
  safeParseJsonArray,
  sortTimeSlots,
} from '@/lib/scheduleUtils';

export const dynamic = 'force-dynamic';

function matchesClientQuery(booking, rawQuery) {
  const q = String(rawQuery || '').trim();
  if (!q) return false;

  const upperQ = q.toUpperCase();
  if (booking.bookingCode && booking.bookingCode.toUpperCase() === upperQ) {
    return true;
  }

  const lowerQ = q.toLowerCase();
  if (q.includes('@') && booking.clientEmail && booking.clientEmail.toLowerCase() === lowerQ) {
    return true;
  }

  const queryDigits = normalizePhoneDigits(q);
  const bookingDigits = normalizePhoneDigits(booking.clientPhone);
  if (queryDigits.length >= 9 && bookingDigits.length >= 9) {
    return bookingDigits.slice(-9) === queryDigits.slice(-9);
  }

  return false;
}

export async function GET(request) {
  try {
    await ensureSeeded(prisma);
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query') || '').trim();

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Введіть телефон, Email або код запису' },
        { status: 400 }
      );
    }

    const digits = normalizePhoneDigits(query);
    const looksLikeCode = /^[a-zA-Z]{2}-\d{3,6}$/.test(query);
    const looksLikeEmail = query.includes('@');

    if (!looksLikeCode && !looksLikeEmail && digits.length < 9) {
      return NextResponse.json(
        { success: false, error: 'Введіть повний номер телефону (мінімум 9 цифр), Email або код запису (наприклад TG-1234)' },
        { status: 400 }
      );
    }

    const [allBookings, profile, scheduleOverrides] = await Promise.all([
      prisma.booking.findMany({
        include: { service: true },
        orderBy: [{ date: 'desc' }, { timeSlot: 'desc' }],
      }),
      prisma.profile.findFirst({
        include: { paymentSettings: true },
      }),
      prisma.scheduleOverride.findMany({
        where: { date: { gte: getTodayStr() } },
      }),
    ]);

    const matched = allBookings.filter((b) => matchesClientQuery(b, query));

    return NextResponse.json({
      success: true,
      bookings: matched,
      profile: profile
        ? {
            name: profile.name,
            title: profile.title,
            phone: profile.phone,
            whatsapp: profile.whatsapp,
            telegram: profile.telegram,
            facebook: profile.facebook,
            workingDays: profile.workingDays,
            defaultSlots: profile.defaultSlots,
            paymentSettings: profile.paymentSettings,
          }
        : null,
      scheduleOverrides,
    });
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при пошуку ваших записів' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await ensureSeeded(prisma);
    const body = await request.json();
    const { id, verifyQuery, action, newDate, newTimeSlot } = body;

    if (!id || !verifyQuery || !action) {
      return NextResponse.json({ success: false, error: 'Недостатньо даних для операції' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: 'Запис не знайдено' }, { status: 404 });
    }

    if (!matchesClientQuery(booking, verifyQuery)) {
      return NextResponse.json({ success: false, error: 'Немає доступу до цього запису' }, { status: 403 });
    }

    if (action === 'MARK_PAYMENT_SENT') {
      const marker = 'Клієнт повідомив про оплату';
      const existingNotes = booking.clientNotes ? `${booking.clientNotes}\n` : '';
      const updatedNotes = booking.clientNotes?.includes(marker)
        ? booking.clientNotes
        : `${existingNotes}[${marker}: ${new Date().toLocaleDateString('uk-UA')}]`;

      const updated = await prisma.booking.update({
        where: { id },
        data: { clientNotes: updatedNotes },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Позначку про оплату надіслано фахівчині. Очікуйте підтвердження.',
        booking: updated,
      });
    }

    if (action === 'CANCEL') {
      if (booking.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Завершену сесію не можна скасувати' },
          { status: 400 }
        );
      }

      const updated = await prisma.booking.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        message: 'Запис скасовано',
        booking: updated,
      });
    }

    if (action === 'RESCHEDULE') {
      if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Цю сесію неможливо перенести' },
          { status: 400 }
        );
      }
      if (!newDate || !/^\d{4}-\d{2}-\d{2}$/.test(newDate) || !newTimeSlot) {
        return NextResponse.json(
          { success: false, error: 'Оберіть нову дату та час' },
          { status: 400 }
        );
      }

      const [profile, override, activeOnDate] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.scheduleOverride.findUnique({ where: { date: newDate } }),
        prisma.booking.findMany({
          where: {
            id: { not: id },
            date: newDate,
            status: { in: ['PENDING', 'CONFIRMED'] },
          },
          select: { timeSlot: true },
        }),
      ]);

      const workingDays = safeParseJsonArray(profile?.workingDays, DEFAULT_WORKING_DAYS);
      const defaultSlots = sortTimeSlots(safeParseJsonArray(profile?.defaultSlots, DEFAULT_SLOTS));
      const busySlots = activeOnDate.map((b) => b.timeSlot);
      const daySchedule = computeDaySchedule({
        dateStr: newDate,
        workingDays,
        defaultSlots,
        override,
        busySlots,
      });

      if (daySchedule.isDayOff || !daySchedule.availableSlots.includes(newTimeSlot)) {
        return NextResponse.json(
          { success: false, error: 'Обраний час вже недоступний. Оберіть інший слот.' },
          { status: 409 }
        );
      }

      const reschedNote = `[Перенесено клієнтом з ${booking.date} ${booking.timeSlot}]`;
      const updatedNotes = booking.clientNotes ? `${booking.clientNotes}\n${reschedNote}` : reschedNote;

      const updated = await prisma.booking.update({
        where: { id },
        data: {
          date: newDate,
          timeSlot: newTimeSlot,
          status: 'PENDING',
          clientNotes: updatedNotes,
        },
        include: { service: true },
      });

      return NextResponse.json({
        success: true,
        message: `Сесію перенесено на ${newDate} о ${newTimeSlot}`,
        booking: updated,
      });
    }

    return NextResponse.json({ success: false, error: 'Невідома дія' }, { status: 400 });
  } catch (error) {
    console.error('Error updating client booking:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при оновленні запису' },
      { status: 500 }
    );
  }
}
