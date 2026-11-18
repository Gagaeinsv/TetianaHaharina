import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { DEFAULT_SLOTS, DEFAULT_WORKING_DAYS, ensureSeeded } from '@/lib/defaultData';
import {
  computeDaySchedule,
  generateBookingCode,
  safeParseJsonArray,
  sortTimeSlots,
} from '@/lib/scheduleUtils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await ensureSeeded(prisma);
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Дата є обов’язковою' }, { status: 400 });
    }

    const [profile, override, activeBookings] = await Promise.all([
      prisma.profile.findFirst(),
      prisma.scheduleOverride.findUnique({ where: { date } }),
      prisma.booking.findMany({
        where: {
          date,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        select: { timeSlot: true },
      }),
    ]);

    const workingDays = safeParseJsonArray(profile?.workingDays, DEFAULT_WORKING_DAYS);
    const defaultSlots = sortTimeSlots(safeParseJsonArray(profile?.defaultSlots, DEFAULT_SLOTS));
    const busySlots = activeBookings.map((b) => b.timeSlot);

    const daySchedule = computeDaySchedule({
      dateStr: date,
      workingDays,
      defaultSlots,
      override,
      busySlots,
    });

    return NextResponse.json({ success: true, ...daySchedule });
  } catch (error) {
    console.error('Error fetching busy slots:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при отриманні слотів' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureSeeded(prisma);
    const isAdmin = await checkAuth();
    const body = await request.json();
    const {
      clientName,
      clientPhone,
      clientEmail,
      clientTelegram,
      clientNotes,
      date,
      timeSlot,
      serviceId,
      paymentMethod,
      status,
      paymentStatus,
      meetingLink,
      psychologistNote,
    } = body;

    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ success: false, error: 'Ім’я є обов’язковим' }, { status: 400 });
    }
    if (!clientPhone || !clientPhone.trim()) {
      return NextResponse.json({ success: false, error: 'Телефон є обов’язковим' }, { status: 400 });
    }
    if (!clientEmail || !clientEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Email є обов’язковим' }, { status: 400 });
    }
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ success: false, error: 'Некоректна дата' }, { status: 400 });
    }
    if (!timeSlot || !/^\d{2}:\d{2}$/.test(timeSlot)) {
      return NextResponse.json({ success: false, error: 'Оберіть час консультації' }, { status: 400 });
    }
    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'Послуга є обов’язковою' }, { status: 400 });
    }

    const serviceIdInt = parseInt(serviceId, 10);
    const service = await prisma.service.findUnique({ where: { id: serviceIdInt } });
    if (!service) {
      return NextResponse.json({ success: false, error: 'Послугу не знайдено' }, { status: 400 });
    }

    const existingConflict = await prisma.booking.findFirst({
      where: {
        date,
        timeSlot,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (existingConflict) {
      return NextResponse.json(
        { success: false, error: 'Цей час уже зайнятий. Оберіть, будь ласка, інший слот.' },
        { status: 409 }
      );
    }

    if (!isAdmin) {
      const [profile, override] = await Promise.all([
        prisma.profile.findFirst(),
        prisma.scheduleOverride.findUnique({ where: { date } }),
      ]);
      const workingDays = safeParseJsonArray(profile?.workingDays, DEFAULT_WORKING_DAYS);
      const defaultSlots = sortTimeSlots(safeParseJsonArray(profile?.defaultSlots, DEFAULT_SLOTS));
      const daySchedule = computeDaySchedule({
        dateStr: date,
        workingDays,
        defaultSlots,
        override,
        busySlots: [],
      });

      if (daySchedule.isDayOff || !daySchedule.availableSlots.includes(timeSlot)) {
        return NextResponse.json(
          { success: false, error: 'Обраний час недоступний для запису у розкладі.' },
          { status: 400 }
        );
      }
    }

    let bookingCode = generateBookingCode('TG');
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.booking.findFirst({ where: { bookingCode } });
      if (!exists) break;
      bookingCode = generateBookingCode('TG');
    }

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const allowedPayments = ['PENDING', 'PAID'];

    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        clientTelegram: String(clientTelegram || '').trim(),
        clientNotes: String(clientNotes || '').trim(),
        date,
        timeSlot,
        serviceId: serviceIdInt,
        paymentMethod: paymentMethod || 'IBAN',
        status: isAdmin && allowedStatuses.includes(status) ? status : 'PENDING',
        paymentStatus: isAdmin && allowedPayments.includes(paymentStatus) ? paymentStatus : 'PENDING',
        meetingLink: isAdmin ? String(meetingLink || '').trim() : '',
        psychologistNote: isAdmin ? String(psychologistNote || '').trim() : '',
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Запис успішно створено',
      booking,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при створенні запису: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const isAuthorized = await checkAuth();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Неавторизований доступ' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      status,
      paymentStatus,
      meetingLink,
      psychologistNote,
      date,
      timeSlot,
      clientNotes,
      serviceId,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID запису є обов’язковим' }, { status: 400 });
    }

    const existing = await prisma.booking.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Запис не знайдено' }, { status: 404 });
    }

    const targetDate = date || existing.date;
    const targetSlot = timeSlot || existing.timeSlot;

    if (date || timeSlot) {
      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: id },
          date: targetDate,
          timeSlot: targetSlot,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
      });
      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Обраний час вже зайнятий іншим записом' },
          { status: 409 }
        );
      }
    }

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
    if (meetingLink !== undefined) updateData.meetingLink = String(meetingLink).trim();
    if (psychologistNote !== undefined) updateData.psychologistNote = String(psychologistNote).trim();
    if (date !== undefined) updateData.date = date;
    if (timeSlot !== undefined) updateData.timeSlot = timeSlot;
    if (clientNotes !== undefined) updateData.clientNotes = String(clientNotes).trim();
    if (serviceId !== undefined) updateData.serviceId = parseInt(serviceId, 10);

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { service: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Дані запису оновлено',
      booking: updated,
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при оновленні запису' },
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
    let id = searchParams.get('id');
    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID запису обов’язковий' }, { status: 400 });
    }

    await prisma.booking.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Запис видалено' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при видаленні запису' },
      { status: 500 }
    );
  }
}
