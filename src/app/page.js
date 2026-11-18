'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Modal from '@/components/Modal';
import BookingWidget from '@/components/BookingWidget';
import { getFallbackPayload } from '@/lib/defaultData';
import { getTelegramUrl, getViberUrl, getWhatsappUrl } from '@/lib/scheduleUtils';

const SPEC_ICONS = ['👨‍👩‍👧', '🧭', '🤍', '🌸', '🤝', '🛡️', '🌍', '🏳️‍🌈'];

const FORMAT_FINDER_ITEMS = [
  {
    id: 'personal',
    icon: '🧭',
    label: 'Особистий запит і тривога',
    situation: 'Тривога, емоційне вигорання, адаптація в новій країні або складні стосунки',
    recommendation: 'Індивідуальна психологічна сесія',
    duration: '50 хв • Онлайн',
    description:
      'Безпечний простір 1-на-1, де ми розберемо ваш стан без тиску та сформуємо стійкі внутрішні опори.',
    matchCategory: 'INDIVIDUAL',
    matchKeyword: 'індивід',
  },
  {
    id: 'family',
    icon: '👨‍👩‍👧',
    label: 'Дитина або криза в родині',
    situation: 'Труднощі у стосунках із дитиною, конфлікти в сім’ї або батьківське виснаження',
    recommendation: 'Консультація з дитячо-батьківських стосунків',
    duration: '60 хв • Онлайн',
    description:
      'Поглиблена розмова про вікові кризи, поведінку дитини та повернення взаєморозуміння без почуття провини.',
    matchCategory: 'FAMILY',
    matchKeyword: 'дитяч',
  },
  {
    id: 'teen',
    icon: '🌱',
    label: 'Підтримка для підлітка (12+)',
    situation: 'Самооцінка, тривожність, емоційні гойдалки, адаптація чи труднощі в школі',
    recommendation: 'Дитячо-батьківська та підліткова підтримка',
    duration: '50–60 хв • Онлайн',
    description:
      'Делікатна робота з підлітком (за згодою батьків) та формування довірливого контакту в родині.',
    matchCategory: 'FAMILY',
    matchKeyword: 'дитяч',
  },
  {
    id: 'colleague',
    icon: '🤝',
    label: 'Для практикуючого психолога',
    situation: 'Складний клієнтський кейс, професійне вигорання або пошук колегіальної опори',
    recommendation: 'Інтервізійна зустріч для колег',
    duration: '50 хв • Онлайн',
    description:
      'Професійний колегіальний розбір кейсів у підтримуючому полі з інтервізоркою та координаторкою ПЦ «Перспектива».',
    matchCategory: 'SUPERVISION',
    matchKeyword: 'інтервіз',
  },
];

const CLIENT_REVIEWS = [
  {
    id: 'rev-1',
    tag: 'Індивідуальна терапія • Перший досвід роботи з психологом',
    source: 'Соціальний проєкт психологічної підтримки',
    quote:
      '«Це була моя перша праця з психологом, маю велике задоволення від роботи з Тетяною! Вона допомогла мені почати роботу над собою, дала зрозуміти, на які аспекти життя я маю звернути більше уваги, щоб допомогти сама собі. Дуже раджу всім не боятися і працювати з психологом — з Тетяною цей досвід був максимально дбайливим.»',
    imgPath: '/cert1.jpg',
    imgTitle: 'Оригінал відгуку клієнтки (соціальний проєкт)',
  },
  {
    id: 'rev-2',
    tag: 'Індивідуальна консультація • Пошук внутрішніх ресурсів',
    source: 'Соціальний проєкт психологічної підтримки',
    quote:
      '«Чудовий психолог, який глибоко знає свою справу. Вміє підібрати потрібні ключі та професійно знаходить індивідуальний підхід. Велика вдячність за час, чуйність і кваліфіковану допомогу!»',
    imgPath: '/cert2.jpg',
    imgTitle: 'Оригінал відгуку клієнта (соціальний проєкт)',
  },
  {
    id: 'rev-3',
    tag: 'Дитячо-батьківські стосунки • Сімейна підтримка',
    source: 'Приватна онлайн-консультація',
    quote:
      '«Звернулися через постійну напругу у спілкуванні з дитиною-підлітком та власне батьківське виснаження. Тетяна допомогла побачити потреби дитини без почуття провини, знизити градус конфліктів у родині та повернути теплий діалог.»',
    imgPath: null,
    imgTitle: '',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Як часто потрібно проходити сесії?',
    a: 'Зазвичай зустрічі проходять один раз на тиждень. Це оптимальна частота для стабільної роботи над запитом, формування опори та інтеграції змін у повсякденне життя.',
  },
  {
    q: 'Яка тривалість однієї консультації?',
    a: 'Індивідуальна консультація та інтервізія тривають 50 хвилин. Сімейна або дитячо-батьківська консультація триває 60 хвилин.',
  },
  {
    q: 'Чи можу я самостійно перенести або скасувати запис?',
    a: 'Так, у вашому Особистому кабінеті клієнта ви можете обрати іншу вільну дату або скасувати сесію без втрати оплати не пізніше ніж за 24 години до зустрічі.',
  },
  {
    q: 'Як відбувається оплата та де взяти посилання на зустріч?',
    a: 'Одразу після вибору часу в календарі на сайті ви отримуєте код запису та реквізити (ФОП IBAN, Monobank або PayPal). Після підтвердження запису посилання на Zoom / Google Meet з’явиться у вашому Особистому кабінеті та прийде в месенджер.',
  },
  {
    q: 'Чи є консультації конфіденційними?',
    a: 'Так, повна конфіденційність є базовим етичним правилом моєї практики. Будь-які деталі вашої історії залишаються у суворій таємниці, за винятком випадків загрози життю.',
  },
  {
    q: 'З якого віку ви працюєте з підлітками?',
    a: 'Я працюю з підлітками від 12 років. Терапія неповнолітніх клієнтів проводиться виключно за поінформованою згодою хоча б одного з батьків або опікунів.',
  },
];

const ANXIETY_ITEMS = [
  {
    q: 'Що буде на першій зустрічі?',
    a: 'Це спокійне знайомство. Ми поговоримо про те, що турбує вас зараз, і чого б ви хотіли від терапії. Не обов’язково формулювати запит ідеально заздалегідь — ми разом окреслимо напрямок.',
  },
  {
    q: 'Чи потрібно спеціально готуватися до сесії?',
    a: 'Спеціальна підготовка не потрібна. Достатньо стабільного інтернету, тихого місця, де вам буде комфортно говорити наодинці, та 50–60 хвилин вільного часу.',
  },
  {
    q: 'Як зрозуміти, що формат мені підходить?',
    a: 'Орієнтуйтеся на відчуття контакту, безпеки та поваги під час першої консультації. Хороший терапевтичний альянс завжди будується на довірі та відсутності тиску.',
  },
];

export default function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [activeFinderIdx, setActiveFinderIdx] = useState(0);
  const [activeFaq, setActiveFaq] = useState(0);
  const [openAnxiety, setOpenAnxiety] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickContactOpen, setQuickContactOpen] = useState(false);

  const [legalModal, setLegalModal] = useState({ isOpen: false, title: '', content: '' });
  const [certModal, setCertModal] = useState({ isOpen: false, imgPath: '', title: '' });

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch('/api/content');
        const json = await res.json();
        if (active && json.success) {
          setData(json);
          if (json.services?.length > 0) setSelectedServiceId(json.services[0].id);
        } else if (active) {
          const fb = getFallbackPayload();
          setData(fb);
          setSelectedServiceId(fb.services[0].id);
        }
      } catch {
        if (active) {
          const fb = getFallbackPayload();
          setData(fb);
          setSelectedServiceId(fb.services[0].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const openLegalDoc = (type) => {
    const doc = data?.legalDocs?.find((d) => d.type === type);
    if (doc) {
      setLegalModal({ isOpen: true, title: doc.title, content: doc.content });
    }
  };

  const scrollToBooking = (serviceId) => {
    if (serviceId) setSelectedServiceId(serviceId);
    setMobileMenuOpen(false);
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading || !data) {
    return (
      <div className="site-loader">
        <div className="spinner" />
        <p>Завантажуємо простір турботи...</p>
      </div>
    );
  }

  const { profile, services = [] } = data;
  const paymentSettings = profile?.paymentSettings;

  const getMatchedService = (finderItem) => {
    if (!services.length) return null;
    return (
      services.find(
        (s) => s.category?.toUpperCase() === finderItem.matchCategory
      ) ||
      services.find((s) =>
        s.name.toLowerCase().includes(finderItem.matchKeyword)
      ) ||
      services[0]
    );
  };

  return (
    <div className="gagarina-site">
      {/* Sticky Glass Header */}
      <header className="g-header">
        <div className="container g-header-inner">
          <Link href="/" className="g-brand">
            <span className="g-brand-name">{profile.name}</span>
            <span className="g-brand-role">Психолог • Інтервізорка</span>
          </Link>

          <nav className={`g-nav ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>Про мене</a>
            <a href="#specializations" onClick={() => setMobileMenuOpen(false)}>Напрямки</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>Послуги</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Як проходить</a>
            <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Відгуки</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="g-nav-actions">
              <Link href="/cabinet" className="btn btn-secondary g-nav-cab" onClick={() => setMobileMenuOpen(false)}>
                Особистий кабінет
              </Link>
              <a href="#booking" className="btn btn-primary g-nav-cta" onClick={() => setMobileMenuOpen(false)}>
                Записатися
              </a>
            </div>
          </nav>

          <button
            type="button"
            className={`g-burger ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Меню"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="g-hero">
        <div className="container g-hero-grid">
          <div className="g-hero-content">
            <span className="g-hero-pill">
              🌿 {profile.experience}+ років практичного досвіду • Онлайн по всьому світу
            </span>
            <h1>Простір безпеки, прийняття та психологічної підтримки</h1>
            <p className="g-hero-sub">{profile.subtitle}</p>
            <p className="g-hero-lead">
              Офіційні онлайн-консультації у правовому полі України. Допомагаю повернути внутрішню опору, налагодити контакт із дітьми й близькими та пройти складні життєві зміни без осуду.
            </p>

            <div className="g-hero-btns">
              <a href="#booking" className="btn btn-primary btn-lg">
                Записатися на сесію
              </a>
              <Link href="/cabinet" className="btn btn-secondary btn-lg">
                Мій кабінет клієнта
              </Link>
            </div>

            <div className="g-trust-pills">
              <span>⚖️ Офіційно ФОП</span>
              <span>🔒 100% Конфіденційність</span>
              <span>🏳️‍🌈 ЛГБТ-френдлі</span>
              <span>🌍 Допомога в адаптації</span>
            </div>
          </div>

          <div className="g-hero-media">
            <div className="g-arch-frame">
              <Image
                src="/avatar.jpg"
                alt={profile.name}
                width={800}
                height={1000}
                priority
                className="g-hero-portrait"
              />
            </div>
            <div className="g-float-card">
              <div className="g-float-num">{profile.experience} років</div>
              <div className="g-float-text">
                практики • волонтерка ГО «Разом» та ГО «Ранні пташки»
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calm Principles Bar */}
      <section className="g-principles">
        <div className="container">
          <div className="g-principles-grid">
            <div className="g-principle-item">
              <span className="g-p-icon">🤍</span>
              <div>
                <h3>Безоціночність</h3>
                <p>Приймаю ваші почуття та життєвий досвід без критики і порад «як правильно».</p>
              </div>
            </div>
            <div className="g-principle-item">
              <span className="g-p-icon">🔐</span>
              <div>
                <h3>Конфіденційність</h3>
                <p>Суворе дотримання професійної таємниці та етичного кодексу психолога.</p>
              </div>
            </div>
            <div className="g-principle-item">
              <span className="g-p-icon">🌱</span>
              <div>
                <h3>Дбайливий темп</h3>
                <p>Рухаємося зі швидкістю, до якої готова ваша психіка, без тиску та поспіху.</p>
              </div>
            </div>
            <div className="g-principle-item">
              <span className="g-p-icon">🤝</span>
              <div>
                <h3>Партнерство</h3>
                <p>Терапія — це діалог, у якому ми разом знаходимо ваші власні стійкі рішення.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with Editorial Portrait Showcase & Professional Standards */}
      <section id="about" className="g-about">
        <div className="container g-about-grid">
          <div className="g-about-media">
            <div className="g-about-showcase">
              <div className="g-portrait-main">
                <Image
                  src="/avatar4.jpg"
                  alt={`${profile.name} — практикуючий психолог`}
                  width={800}
                  height={600}
                />
                <div className="g-portrait-caption">
                  <span>{profile.name}</span>
                  <small>Практикуючий психолог • Інтервізорка</small>
                </div>
              </div>

              <div className="g-portrait-sub-row">
                <div className="g-portrait-secondary">
                  <Image
                    src="/avatar5.jpg"
                    alt={`${profile.name} — атмосфера довіри`}
                    width={600}
                    height={700}
                  />
                </div>

                <div className="g-standards-card">
                  <span className="g-std-badge">Етика та супервізія</span>
                  <h4>Професійні стандарти</h4>
                  <ul className="g-std-list">
                    <li>✦ Понад 2000+ годин практики</li>
                    <li>✦ Координаторка ПЦ «Перспектива»</li>
                    <li>✦ Волонтерка ГО «Разом» та ГО «Ранні пташки»</li>
                    <li>✦ Регулярна супервізія та інтервізія</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="g-about-body">
            <span className="g-sec-badge">Про мене та досвід</span>
            <h2>{profile.name}</h2>
            <p className="g-about-sub">{profile.title} — {profile.subtitle}</p>
            <p className="g-about-bio">{profile.bio}</p>

            <div className="g-org-tags">
              <span>ГО «Соціальний проєкт «Разом»»</span>
              <span>ГО «Ранні пташки»</span>
              <span>Гейткіпер</span>
              <span>Координаторка ПЦ «Перспектива»</span>
            </div>

            <div className="g-facts-box">
              <h3>Ключова інформація</h3>
              <ul>
                <li><strong>Освіта:</strong> Вища психологічна, регулярна інтервізія та супервізія</li>
                <li><strong>Досвід практики:</strong> {profile.experience} років (понад 2000+ годин консультацій)</li>
                <li><strong>Координація:</strong> Курси підвищення кваліфікації психологів ПЦ «Перспектива»</li>
                <li><strong>Формат роботи:</strong> Онлайн (Zoom, Google Meet, месенджери)</li>
                <li><strong>Мови:</strong> Українська, російська</li>
                <li><strong>Легальність:</strong> Офіційний ФОП 3 групи, відкриті реквізити та оферта</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Specializations Section */}
      <section id="specializations" className="g-specs">
        <div className="container">
          <div className="g-sec-header center">
            <span className="g-sec-badge">Напрямки роботи</span>
            <h2>З якими запитами я допомагаю</h2>
            <p>
              Дбайливий підхід до дорослих, батьків, підлітків та колег-психологів залежно від вашої життєвої ситуації.
            </p>
          </div>

          <div className="g-specs-grid">
            {profile.specializations.map((spec, idx) => (
              <div key={spec.id || idx} className="g-spec-card">
                <div className="g-spec-icon">{SPEC_ICONS[idx % SPEC_ICONS.length]}</div>
                <h3>{spec.name}</h3>
                <p>
                  {spec.description ||
                    'Професійна психологічна підтримка, заснована на доказових методах і дбайливому ставленні.'}
                </p>
                <button
                  type="button"
                  onClick={() => scrollToBooking()}
                  className="g-spec-link"
                >
                  Обговорити на сесії →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services & Pricing Section */}
      <section id="services" className="g-services">
        <div className="container">
          <div className="g-sec-header center">
            <span className="g-sec-badge">Послуги та Тарифи</span>
            <h2>Формати консультацій</h2>
            <p>Прозора вартість, чіткі межі та вибір зручного часу в онлайн-календарі.</p>
          </div>

          {/* Interactive Format Finder */}
          <div className="g-finder-box">
            <div className="g-finder-head">
              <span className="g-sec-badge">Швидкий підбір за 10 секунд</span>
              <h3>Не впевнені, який формат обрати? Оберіть вашу ситуацію</h3>
            </div>

            <div className="g-finder-tabs" role="tablist" aria-label="Підбір формату консультації">
              {FORMAT_FINDER_ITEMS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activeFinderIdx === idx}
                  className={`g-finder-tab ${activeFinderIdx === idx ? 'active' : ''}`}
                  onClick={() => setActiveFinderIdx(idx)}
                >
                  <span className="g-finder-tab-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {(() => {
              const activeItem = FORMAT_FINDER_ITEMS[activeFinderIdx] || FORMAT_FINDER_ITEMS[0];
              const matchedService = getMatchedService(activeItem);
              return (
                <div className="g-finder-result">
                  <div className="g-finder-result-info">
                    <span className="g-finder-rec-pill">
                      Рекомендований формат • {activeItem.duration}
                    </span>
                    <h4>{matchedService ? matchedService.name : activeItem.recommendation}</h4>
                    <p className="g-finder-situation">
                      <strong>Ваш запит:</strong> {activeItem.situation}
                    </p>
                    <p className="g-finder-desc">{activeItem.description}</p>
                  </div>
                  <div className="g-finder-result-cta">
                    {matchedService && (
                      <div className="g-finder-price">
                        <small>Вартість сесії</small>
                        <strong>{matchedService.priceUah} грн</strong>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => scrollToBooking(matchedService?.id)}
                      className="btn btn-primary"
                    >
                      Записатися на цей формат →
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="g-services-grid">
            {services.map((s) => (
              <div key={s.id} className="g-service-card">
                <div className="g-srv-meta-top">
                  <span>⏱️ {s.duration} хвилин</span>
                  <span>💻 Онлайн</span>
                </div>
                <h3>{s.name}</h3>
                <p className="g-srv-desc">{s.description}</p>
                <div className="g-srv-bottom">
                  <div className="g-srv-price">
                    <small>Вартість сесії</small>
                    <strong>{s.priceUah} грн</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToBooking(s.id)}
                    className="btn btn-primary w-full"
                  >
                    Обрати та записатися
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works & Anxiety Reduction */}
      <section id="how-it-works" className="g-process">
        <div className="container">
          <div className="g-sec-header center">
            <span className="g-sec-badge">Прозорий процес</span>
            <h2>Як відбувається наша співпраця</h2>
            <p>Зрозумілий маршрут від вибору години у календарі до самої онлайн-зустрічі.</p>
          </div>

          <div className="g-timeline">
            <div className="g-step-card">
              <span className="g-step-num">01</span>
              <h3>Запис у календарі</h3>
              <p>Обираєте зручні дату й час без довгого листування. Одразу отримуєте код запису.</p>
            </div>
            <div className="g-step-card">
              <span className="g-step-num">02</span>
              <h3>Оплата та кабінет</h3>
              <p>Сплачуєте зручним способом ФОП та відстежуєте статус і посилання на сесію у кабінеті.</p>
            </div>
            <div className="g-step-card">
              <span className="g-step-num">03</span>
              <h3>Перша зустріч</h3>
              <p>У комфортній та конфіденційній обстановці знайомимося, досліджуємо запит і цілі.</p>
            </div>
            <div className="g-step-card">
              <span className="g-step-num">04</span>
              <h3>Системні зміни</h3>
              <p>Рухаємося в індивідуальному темпі для досягнення стійкого відчуття внутрішньої опори.</p>
            </div>
          </div>

          <div className="g-anxiety-box">
            <div className="g-anxiety-intro">
              <span className="g-sec-badge">Підтримка перед стартом</span>
              <h3>Це нормально — хвилюватися перед першою сесією</h3>
              <p>
                Багато клієнтів сумніваються, про що говорити і як усе відбуватиметься. Натисніть на питання, щоб дізнатися деталі.
              </p>
              <div className="g-anxiety-photo-wrap">
                <Image src="/avatar5.jpg" alt={profile.name} width={480} height={360} />
              </div>
            </div>

            <div className="g-anxiety-list">
              {ANXIETY_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className={`g-accordion-item ${openAnxiety === idx ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="g-accordion-btn"
                    onClick={() => setOpenAnxiety(openAnxiety === idx ? -1 : idx)}
                  >
                    <span>{item.q}</span>
                    <b>{openAnxiety === idx ? '−' : '+'}</b>
                  </button>
                  {openAnxiety === idx && <p className="g-accordion-body">{item.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Client Reviews Section */}
      <section id="reviews" className="g-reviews-sec">
        <div className="container">
          <div className="g-sec-header center">
            <span className="g-sec-badge">Відгуки клієнтів</span>
            <h2>Живі історії та досвід роботи</h2>
            <p>
              Зворотний зв’язок від клієнтів після індивідуальних консультацій, сімейної підтримки та участі у соціальних проєктах.
            </p>
          </div>

          <div className="g-reviews-grid">
            {CLIENT_REVIEWS.map((rev) => (
              <article key={rev.id} className="g-review-card">
                <div className="g-review-top">
                  <span className="g-review-tag">{rev.tag}</span>
                </div>
                <blockquote className="g-review-quote">{rev.quote}</blockquote>
                <div className="g-review-foot">
                  <span className="g-review-source">{rev.source}</span>
                  {rev.imgPath && (
                    <button
                      type="button"
                      className="g-review-proof-btn"
                      onClick={() =>
                        setCertModal({
                          isOpen: true,
                          imgPath: rev.imgPath,
                          title: rev.imgTitle,
                        })
                      }
                    >
                      🔎 Переглянути оригінал відгуку
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="g-originals-strip">
            <div className="g-originals-info">
              <span className="g-sec-badge">Перевірені відгуки</span>
              <h3>Оригінали публікацій із соціального проєкту</h3>
              <p>
                Натисніть на будь-яку картку, щоб відкрити збережений оригінал відгуку у повному розмірі.
              </p>
            </div>
            <div className="g-originals-thumbs">
              <button
                type="button"
                className="g-orig-thumb"
                onClick={() =>
                  setCertModal({
                    isOpen: true,
                    imgPath: '/cert1.jpg',
                    title: 'Відгук клієнтки — соціальний проєкт «Разом»',
                  })
                }
              >
                <Image src="/cert1.jpg" alt="Оригінал відгуку клієнтки №1" width={600} height={450} />
                <span>🔎 Переглянути оригінал №1</span>
              </button>
              <button
                type="button"
                className="g-orig-thumb"
                onClick={() =>
                  setCertModal({
                    isOpen: true,
                    imgPath: '/cert2.jpg',
                    title: 'Відгук клієнта — соціальний проєкт',
                  })
                }
              >
                <Image src="/cert2.jpg" alt="Оригінал відгуку клієнта №2" width={600} height={450} />
                <span>🔎 Переглянути оригінал №2</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Calendar Section */}
      <section id="booking" className="g-booking-sec">
        <div className="container">
          <div className="g-sec-header center">
            <span className="g-sec-badge">Онлайн-запис</span>
            <h2>Оберіть день та час консультації</h2>
            <p>
              Усі вільні години оновлюються в реальному часі. Вже записувались?{' '}
              <Link href="/cabinet" className="g-inline-link">
                Відкрийте Особистий кабінет клієнта →
              </Link>
            </p>
          </div>

          <div className="g-booking-shell">
            <BookingWidget
              profile={profile}
              services={services}
              paymentSettings={paymentSettings}
              preselectedServiceId={selectedServiceId}
              onSelectService={setSelectedServiceId}
            />
          </div>

          <div className="g-microcopy-banner">
            🤍 Перший крок можна зробити у спокійному темпі. Якщо ви не впевнені, який формат обрати — оберіть «Індивідуальну сесію», і ми зорієнтуємося разом.
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="g-faq-sec">
        <div className="container g-faq-wrap">
          <div className="g-sec-header center">
            <span className="g-sec-badge">Часті запитання</span>
            <h2>Організаційні деталі</h2>
          </div>

          <div className="g-faq-list">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className={`g-faq-item ${activeFaq === idx ? 'open' : ''}`}>
                <button
                  type="button"
                  className="g-faq-btn"
                  onClick={() => setActiveFaq(activeFaq === idx ? -1 : idx)}
                >
                  <span>{item.q}</span>
                  <b>{activeFaq === idx ? '▲' : '▼'}</b>
                </button>
                {activeFaq === idx && <div className="g-faq-ans">{item.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="g-footer">
        <div className="container g-footer-grid">
          <div className="g-footer-brand">
            <h3>{profile.name}</h3>
            <p className="g-footer-role">{profile.title}</p>
            <p className="g-footer-fop">
              ФОП {profile.name}
              <br />
              ЄДРПОУ: {paymentSettings?.edrpou}
              <br />
              Спрощена система оподаткування, 3 група
            </p>
          </div>

          <div className="g-footer-col">
            <h4>Клієнтам та Правова інформація</h4>
            <Link href="/cabinet" className="g-footer-link">
              👤 Особистий кабінет клієнта
            </Link>
            <button type="button" onClick={() => openLegalDoc('OFFER')} className="g-footer-link">
              📄 Публічна оферта (Договір)
            </button>
            <button type="button" onClick={() => openLegalDoc('PRIVACY')} className="g-footer-link">
              🔒 Політика конфіденційності
            </button>
            <Link href="/admin" className="g-footer-link muted">
              🔐 Вхід у кабінет фахівчині
            </Link>
          </div>

          <div className="g-footer-col">
            <h4>Зв’язок</h4>
            <p>📞 {profile.phone} (Україна / Viber)</p>
            <p>🟢 {profile.whatsapp} (WhatsApp)</p>
            <div className="g-footer-socials">
              <a href={getTelegramUrl(profile.telegram || profile.phone)} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
              <a href={getViberUrl(profile.phone)} target="_blank" rel="noopener noreferrer">
                Viber
              </a>
              <a href={getWhatsappUrl(profile.whatsapp || profile.phone)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              {profile.facebook && (
                <a href={profile.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="g-footer-bottom">
          © {new Date().getFullYear()} {profile.name}. Професійна психологічна практика у правовому полі України.
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="g-sticky-cta">
        <a href="#booking" className="btn btn-primary w-full">
          Записатися на консультацію
        </a>
      </div>

      {/* Floating Quick-Contact Messenger Widget */}
      <div className={`g-quick-contact ${quickContactOpen ? 'open' : ''}`}>
        {quickContactOpen && (
          <div className="g-qc-popover" role="region" aria-label="Швидкий зв’язок">
            <div className="g-qc-head">
              <strong>Швидке запитання психологині</strong>
              <button
                type="button"
                className="g-qc-close"
                onClick={() => setQuickContactOpen(false)}
                aria-label="Закрити"
              >
                ×
              </button>
            </div>
            <p className="g-qc-sub">Оберіть зручний месенджер — відповім між консультаціями.</p>
            <div className="g-qc-links">
              <a
                href={getTelegramUrl(profile.telegram || profile.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="g-qc-link tg"
              >
                ✈️ Написати в Telegram
              </a>
              <a
                href={getViberUrl(profile.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="g-qc-link vb"
              >
                📞 Написати у Viber
              </a>
              <a
                href={getWhatsappUrl(profile.whatsapp || profile.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="g-qc-link wa"
              >
                🟢 Написати у WhatsApp
              </a>
            </div>
          </div>
        )}
        <button
          type="button"
          className="g-qc-trigger"
          onClick={() => setQuickContactOpen((prev) => !prev)}
          aria-expanded={quickContactOpen}
        >
          <span>💬</span>
          <span className="g-qc-label">Швидкий зв’язок</span>
        </button>
      </div>

      {/* Legal Modal */}
      <Modal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        title={legalModal.title}
      >
        <div className="legal-content-pre">{legalModal.content}</div>
      </Modal>

      {/* Review Original Image Lightbox Modal */}
      <Modal
        isOpen={certModal.isOpen}
        onClose={() => setCertModal({ ...certModal, isOpen: false })}
        title={certModal.title}
      >
        <div className="cert-modal-body">
          {certModal.imgPath && (
            <Image
              src={certModal.imgPath}
              alt={certModal.title}
              width={900}
              height={900}
              className="cert-large-img"
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
