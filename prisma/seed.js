const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Clear database
  await prisma.booking.deleteMany({});
  await prisma.paymentSetting.deleteMany({});
  await prisma.specialization.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.legalDoc.deleteMany({});
  await prisma.profile.deleteMany({});

  console.log('Cleared database.');

  // 2. Create Profile
  const profile = await prisma.profile.create({
    data: {
      id: 1,
      name: 'Гагаріна Тетяна',
      title: 'Інтервізорка',
      subtitle: 'Психолог, консультант з дитячо-батьківських стосунків',
      bio: 'Волонтер ГО "Соціальний проєкт "Разом" та ГО "Ранні пташки", гейткіпер, Координатор Курсів підвищення кваліфікації психологів Психологічного центру "Перспектива"',
      experience: 14,
      phone: '+380679637225',
      whatsapp: '+393290214199',
      facebook: 'https://www.facebook.com/haharinatetiana',
      calendlyLink: 'https://calendly.com/tetianahaharina',
    }
  });
  console.log('Created profile:', profile.name);

  // 3. Create Specializations
  const specializations = [
    'Дитячо-батьківські стосунки',
    'Підліткова психологія',
    'Вислухати та підтримати',
    'Підтримка у декреті',
    'Конфлікти',
    'Домашнє насилля',
    'Адаптація в новій країні',
    'ЛГБТ-френдлі терапія'
  ];

  for (const spec of specializations) {
    await prisma.specialization.create({
      data: {
        name: spec,
        profileId: 1
      }
    });
  }
  console.log(`Created ${specializations.length} specializations.`);

  // 4. Create Services
  const services = [
    {
      name: 'Індивідуальна сесія (онлайн)',
      description: 'Індивідуальна психологічна консультація для дорослих та підлітків. Робота з тривожністю, особистими кризами, адаптацією, конфліктами та сімейними проблемами.',
      duration: 50,
      priceUah: 1200,
      calendlyLink: 'https://calendly.com/tetianahaharina/individual-session',
    },
    {
      name: 'Консультація з дитячо-батьківських стосунків',
      description: 'Робота з батьками щодо поведінки дітей, вікових криз, налагодження емоційного контакту, підтримки підлітків та вирішення конфліктів.',
      duration: 60,
      priceUah: 1500,
      calendlyLink: 'https://calendly.com/tetianahaharina/parent-child-session',
    },
    {
      name: 'Інтервізійна зустріч',
      description: 'Професійна підтримка для практикуючих психологів. Розбір складних кейсів, аналіз терапевтичного процесу, профілактика професійного вигорання.',
      duration: 50,
      priceUah: 1000,
      calendlyLink: 'https://calendly.com/tetianahaharina/intervision-session',
    }
  ];

  for (const s of services) {
    await prisma.service.create({
      data: s
    });
  }
  console.log(`Created ${services.length} services.`);

  // 5. Create Payment Settings
  const paymentSettings = await prisma.paymentSetting.create({
    data: {
      id: 1,
      profileId: 1,
      iban: 'UA123456789012345678901234567',
      bankName: 'АТ КБ "ПриватБанк" (або АТ "Універсал Банк")',
      edrpou: '1234567890',
      monoLink: 'https://send.monobank.ua/jar/placeholder',
      paypalEmail: 'haharinatetiana.payment@gmail.com',
      useIban: true,
      useMono: true,
      usePaypal: true
    }
  });
  console.log('Created payment settings.');

  // 6. Create Default Legal Documents
  const offerContent = `ДОГОВІР ПУБЛІЧНОЇ ОФЕРТИ
про надання психологічних та консультаційних послуг

Цей договір є офіційною та публічною пропозицією Фізичної особи-підприємця Гагаріної Тетяни (надалі — "Виконавець") для будь-якої фізичної особи (надалі — "Замовник" або "Клієнт"), яка приймає умови цього Договору (акцептує оферту), про надання послуг на нижчезазначених умовах.

1. ПРЕДМЕТ ДОГОВОРУ
1.1. Виконавець зобов’язується надати Клієнту індивідуальні психологічні консультації або консультації з дитячо-батьківських стосунків (надалі — "Послуги"), а Клієнт зобов’язується прийняти та оплатити ці Послуги відповідно до умов цього Договору.

2. ПОРЯДОК НАДАННЯ ПОСЛУГ
2.1. Послуги надаються в онлайн-форматі за допомогою засобів відеозв'язку (Zoom, Google Meet, WhatsApp, Telegram тощо) за попереднім записом.
2.2. Стандартна тривалість однієї індивідуальної консультації становить 50 хвилин.
2.3. Клієнт має право перенести або скасувати сесію не пізніше ніж за 24 години до запланованого часу. У разі скасування менше ніж за 24 години, сесія підлягає оплаті у розмірі 100%.

3. ВАРТІСТЬ ПОСЛУГ ТА ПОРЯДОК РОЗРАХУНКІВ
3.1. Вартість Послуг визначається відповідно до тарифів, опублікованих на Сайті.
3.2. Оплата здійснюється шляхом 100% передоплати або оплати безпосередньо після сесії (за погодженням) офіційними методами:
- Переказом на розрахунковий рахунок ФОП (IBAN).
- Через платіжні посилання Monobank / WayForPay.
- За допомогою платіжної системи PayPal для клієнтів з-за кордону.

4. КОНФІДЕНЦІЙНІСТЬ
4.1. Будь-яка інформація, отримана під час сесій, є суворо конфіденційною та не підлягає розголошенню третім особам, окрім випадків, передбачених законодавством України (загроза життю Клієнта чи третіх осіб).

5. РЕКВІЗИТИ ВИКОНАВЦЯ
ФОП Гагаріна Тетяна
ЄДРПОУ: [Буде вказано в адмінці]
Група спрощеної системи оподаткування: 3 група`;

  const privacyContent = `ПОЛІТИКА КОНФІДЕНЦІЙНОСТІ 
та Згода на обробку персональних даних

Ця Політика конфіденційності описує, як ФОП Гагаріна Тетяна (надалі — "Власник персональних даних") збирає, використовує та захищає інформацію, яку ви надаєте при використанні цього Сайту.

1. ЯКІ ДАНІ МИ ЗБИРАЄМО
1.1. При заповненні форми запису на сесію ми збираємо:
- Ваше ім'я та прізвище.
- Номер телефону.
- Адресу електронної пошти (опціонально).
- Обраний вами месенджер для зв'язку.

2. МЕТА ЗБОРУ ДАНИХ
2.1. Ваші контактні дані використовуються виключно для:
- Організації та підтвердження запису на консультації.
- Направлення інформації про оплату.
- Координації часу проведення сесій.

3. ПРАВОВІ ОСНОВИ ТА ЗАХИСТ ДАНИХ
3.1. Обробка персональних даних здійснюється відповідно до Закону України «Про захист персональних даних».
3.2. Ми не передаємо ваші контактні дані третім особам. Усі дані зберігаються у захищеній базі даних і використовуються конфіденційно.
3.3. Ви маєте право у будь-який момент вимагати видалення ваших персональних даних з нашої системи, звернувшись до психологині за вказаними контактами.`;

  await prisma.legalDoc.create({
    data: {
      type: 'OFFER',
      title: 'Публічний договір (Оферта)',
      content: offerContent
    }
  });

  await prisma.legalDoc.create({
    data: {
      type: 'PRIVACY',
      title: 'Політика конфіденційності',
      content: privacyContent
    }
  });
  console.log('Created default legal documents.');
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
