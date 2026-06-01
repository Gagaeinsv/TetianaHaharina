import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ success: false, error: 'Дата є обов’язковою' }, { status: 400 });
    }

    // Get all bookings on this date that are not cancelled
    const activeBookings = await prisma.booking.findMany({
      where: {
        date,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      select: {
        timeSlot: true
      }
    });

    const busySlots = activeBookings.map(b => b.timeSlot);
    return NextResponse.json({ success: true, busySlots });
  } catch (error) {
    console.error('Error fetching busy slots:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при отриманні зайнятих слотів' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { clientName, clientPhone, clientEmail, date, timeSlot, serviceId, paymentMethod } = body;

    // Validation
    if (!clientName || !clientName.trim()) {
      return NextResponse.json({ success: false, error: 'Ім’я є обов’язковим' }, { status: 400 });
    }
    if (!clientPhone || !clientPhone.trim()) {
      return NextResponse.json({ success: false, error: 'Телефон є обов’язковим' }, { status: 400 });
    }
    if (!clientEmail || !clientEmail.trim()) {
      return NextResponse.json({ success: false, error: 'Email є обов’язковим' }, { status: 400 });
    }
    if (!date) {
      return NextResponse.json({ success: false, error: 'Дата є обов’язковою' }, { status: 400 });
    }
    if (!timeSlot) {
      return NextResponse.json({ success: false, error: 'Час є обов’язковим' }, { status: 400 });
    }
    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'Послуга є обов’язковою' }, { status: 400 });
    }

    const serviceIdInt = parseInt(serviceId);
    const service = await prisma.service.findUnique({ where: { id: serviceIdInt } });
    if (!service) {
      return NextResponse.json({ success: false, error: 'Послугу не знайдено' }, { status: 400 });
    }

    // Create Booking
    const booking = await prisma.booking.create({
      data: {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientEmail: clientEmail.trim(),
        date,
        timeSlot,
        serviceId: serviceIdInt,
        paymentMethod: paymentMethod || 'IBAN',
        status: 'PENDING',
        paymentStatus: 'PENDING',
      },
      include: {
        service: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Запис успішно створено',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при створенні запису: ' + error.message },
      { status: 500 }
    );
  }
}

// Protected route to update booking status (accessed by admin)
export async function PUT(request) {
  try {
    const { checkAuth } = await import('@/lib/auth');
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Неавторизований доступ' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, paymentStatus } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID запису є обов’язковим' }, { status: 400 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: 'Статус запису оновлено', booking: updated });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при оновленні запису' },
      { status: 500 }
    );
  }
}
