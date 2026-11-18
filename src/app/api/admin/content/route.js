import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { checkAuth } from '@/lib/auth';
import { ensureSeeded } from '@/lib/defaultData';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const isAuthorized = await checkAuth();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Неавторизований доступ' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, specializations, services, paymentSettings, legalDocs } = body;

    await prisma.$transaction(async (tx) => {
      if (profile) {
        const updateProfileData = {
          name: profile.name,
          title: profile.title,
          subtitle: profile.subtitle,
          bio: profile.bio,
          experience: parseInt(profile.experience, 10) || 0,
          phone: profile.phone,
          whatsapp: profile.whatsapp,
          telegram: profile.telegram || '',
          facebook: profile.facebook || '',
          instagram: profile.instagram || '',
          calendlyLink: profile.calendlyLink || '',
          bookingMode: profile.bookingMode || 'INTERNAL',
        };
        if (profile.workingDays !== undefined) {
          updateProfileData.workingDays =
            typeof profile.workingDays === 'string'
              ? profile.workingDays
              : JSON.stringify(profile.workingDays);
        }
        if (profile.defaultSlots !== undefined) {
          updateProfileData.defaultSlots =
            typeof profile.defaultSlots === 'string'
              ? profile.defaultSlots
              : JSON.stringify(profile.defaultSlots);
        }

        await tx.profile.update({
          where: { id: 1 },
          data: updateProfileData,
        });
      }

      if (specializations && Array.isArray(specializations)) {
        await tx.specialization.deleteMany({ where: { profileId: 1 } });
        for (const item of specializations) {
          const specName = typeof item === 'string' ? item : item?.name;
          const specDesc = typeof item === 'string' ? '' : item?.description || '';
          if (specName && specName.trim()) {
            await tx.specialization.create({
              data: {
                name: specName.trim(),
                description: specDesc.trim(),
                profileId: 1,
              },
            });
          }
        }
      }

      if (services && Array.isArray(services)) {
        const currentServices = await tx.service.findMany();
        const incomingIds = services.map((s) => s.id).filter(Boolean);

        for (const current of currentServices) {
          if (!incomingIds.includes(current.id)) {
            const bookingsCount = await tx.booking.count({ where: { serviceId: current.id } });
            if (bookingsCount === 0) {
              await tx.service.delete({ where: { id: current.id } });
            } else {
              await tx.service.update({
                where: { id: current.id },
                data: { isActive: false },
              });
            }
          }
        }

        for (const s of services) {
          const serviceData = {
            name: s.name,
            description: s.description || '',
            duration: parseInt(s.duration, 10) || 50,
            priceUah: parseInt(s.priceUah, 10) || 0,
            category: s.category || 'INDIVIDUAL',
            calendlyLink: s.calendlyLink || '',
            isActive: s.isActive !== undefined ? Boolean(s.isActive) : true,
          };

          if (s.id && currentServices.some((curr) => curr.id === s.id)) {
            await tx.service.update({
              where: { id: s.id },
              data: serviceData,
            });
          } else {
            await tx.service.create({ data: serviceData });
          }
        }
      }

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

export async function GET() {
  try {
    const isAuthorized = await checkAuth();
    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: 'Неавторизований доступ' }, { status: 401 });
    }

    await ensureSeeded(prisma);

    const [profile, services, legalDocs, bookings, scheduleOverrides] = await Promise.all([
      prisma.profile.findFirst({
        include: {
          specializations: { orderBy: { id: 'asc' } },
          paymentSettings: true,
        },
      }),
      prisma.service.findMany({ orderBy: { id: 'asc' } }),
      prisma.legalDoc.findMany({ orderBy: { id: 'asc' } }),
      prisma.booking.findMany({
        include: { service: true },
        orderBy: [{ date: 'desc' }, { timeSlot: 'desc' }],
      }),
      prisma.scheduleOverride.findMany({ orderBy: { date: 'asc' } }),
    ]);

    return NextResponse.json({
      success: true,
      profile,
      services,
      legalDocs,
      bookings,
      scheduleOverrides,
    });
  } catch (error) {
    console.error('Error fetching admin content:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка завантаження даних' },
      { status: 500 }
    );
  }
}
