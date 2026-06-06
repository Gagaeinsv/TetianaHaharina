import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    // 1. Verify Authentication
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Неавторизований доступ' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile, specializations, services, paymentSettings, legalDocs } = body;

    // 2. Perform updates in a transaction
    await prisma.$transaction(async (tx) => {
      // Update Profile
      if (profile) {
        await tx.profile.update({
          where: { id: 1 },
          data: {
            name: profile.name,
            title: profile.title,
            subtitle: profile.subtitle,
            bio: profile.bio,
            experience: parseInt(profile.experience) || 0,
            phone: profile.phone,
            whatsapp: profile.whatsapp,
            facebook: profile.facebook,
            calendlyLink: profile.calendlyLink || '',
          },
        });
      }

      // Update Specializations (re-create them)
      if (specializations && Array.isArray(specializations)) {
        await tx.specialization.deleteMany({ where: { profileId: 1 } });
        for (const specName of specializations) {
          if (specName && specName.trim()) {
            await tx.specialization.create({
              data: {
                name: specName.trim(),
                profileId: 1,
              },
            });
          }
        }
      }

      // Update Services (re-create them)
      if (services && Array.isArray(services)) {
        // Warning: if we delete services, existing bookings pointing to them will fail or Cascade.
        // In our schema, Service has relation to Booking but without Cascade delete.
        // To be safe, we can update existing services by ID, create new ones, and delete removed ones that have no bookings.
        // Or we can just update them one by one. Let's do a safe update/create loop:
        const currentServices = await tx.service.findMany();
        const incomingIds = services.map(s => s.id).filter(id => !!id);

        // Delete services not in incoming list (only if they have no bookings, to avoid errors)
        for (const current of currentServices) {
          if (!incomingIds.includes(current.id)) {
            // Check if it has bookings
            const bookingsCount = await tx.booking.count({ where: { serviceId: current.id } });
            if (bookingsCount === 0) {
              await tx.service.delete({ where: { id: current.id } });
            }
          }
        }

        // Upsert incoming services
        for (const s of services) {
          const serviceData = {
            name: s.name,
            description: s.description || '',
            duration: parseInt(s.duration) || 50,
            priceUah: parseInt(s.priceUah) || 0,
            calendlyLink: s.calendlyLink || '',
          };

          if (s.id && currentServices.some(curr => curr.id === s.id)) {
            await tx.service.update({
              where: { id: s.id },
              data: serviceData,
            });
          } else {
            await tx.service.create({
              data: serviceData,
            });
          }
        }
      }

      // Update Payment Settings
      if (paymentSettings) {
        await tx.paymentSetting.upsert({
          where: { profileId: 1 },
          update: {
            iban: paymentSettings.iban || '',
            bankName: paymentSettings.bankName || '',
            edrpou: paymentSettings.edrpou || '',
            monoLink: paymentSettings.monoLink || '',
            paypalLink: paymentSettings.paypalLink || '',
            paypalEmail: paymentSettings.paypalEmail || '',
            useIban: !!paymentSettings.useIban,
            useMono: !!paymentSettings.useMono,
            usePaypal: !!paymentSettings.usePaypal,
          },
          create: {
            profileId: 1,
            iban: paymentSettings.iban || '',
            bankName: paymentSettings.bankName || '',
            edrpou: paymentSettings.edrpou || '',
            monoLink: paymentSettings.monoLink || '',
            paypalLink: paymentSettings.paypalLink || '',
            paypalEmail: paymentSettings.paypalEmail || '',
            useIban: !!paymentSettings.useIban,
            useMono: !!paymentSettings.useMono,
            usePaypal: !!paymentSettings.usePaypal,
          },
        });
      }

      // Update Legal Documents
      if (legalDocs && Array.isArray(legalDocs)) {
        for (const doc of legalDocs) {
          if (doc.id) {
            await tx.legalDoc.update({
              where: { id: doc.id },
              data: {
                title: doc.title,
                content: doc.content,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Дані успішно оновлено' });
  } catch (error) {
    console.error('Error updating content:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка при збереженні змін: ' + error.message },
      { status: 500 }
    );
  }
}
export async function GET(request) {
  try {
    // Verify authentication first
    const isAuthorized = await checkAuth(request);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Неавторизований доступ' },
        { status: 401 }
      );
    }

    // Fetch everything including bookings
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

    const bookings = await prisma.booking.findMany({
      include: { service: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({
      success: true,
      profile,
      services,
      legalDocs,
      bookings,
    });
  } catch (error) {
    console.error('Error fetching admin content:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження даних' },
      { status: 500 }
    );
  }
}
