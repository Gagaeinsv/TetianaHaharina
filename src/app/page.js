'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import BookingWidget from '@/components/BookingWidget';
import { getFallbackPayload } from '@/lib/defaultData';
import { getTelegramUrl, getViberUrl, getWhatsappUrl } from '@/lib/scheduleUtils';

const SPEC_ICONS = ['👨‍👩‍👧', '🧭', '🤍', '🌸', '🤝', '🛡️', '🌍', '🏳️‍🌈'];

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
  const [activeFaq, setActiveFaq] = useState(0);
  const [openAnxiety, setOpenAnxiety] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              <img src="/avatar.jpg" alt={profile.name} className="g-hero-portrait" />
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

      {/* About Section with Photo Collage & Certificates */}
      <section id="about" className="g-about">
        <div className="container g-about-grid">
          <div className="g-about-media">
            <div className="g-collage">
              <div className="g-col-photo tall">
                <img src="/avatar5.jpg" alt={`${profile.name} — портрет`} />
              </div>
              <div className="g-col-stack">
                <div className="g-col-photo">
                  <img src="/avatar4.jpg" alt="Консультаційна практика" />
                </div>
                <div className="g-col-photo">
                  <img src="/avatar2.jpg" alt="Атмосфера підтримки" />
                </div>
              </div>
            </div>

            <div className="g-certs-strip">
              <span className="g-certs-label">Дипломи та сертифікати (натисніть для збільшення):</span>
              <div className="g-certs-row">
                <button
                  type="button"
                  className="g-cert-thumb"
                  onClick={() =>
                    setCertModal({
                      isOpen: true,
                      imgPath: '/cert1.jpg',
                      title: 'Сертифікат підвищення кваліфікації',
                    })
                  }
                >
                  <img src="/cert1.jpg" alt="Сертифікат 1" />
                  <span>🔎 Переглянути</span>
                </button>
                <button
                  type="button"
                  className="g-cert-thumb"
                  onClick={() =>
                    setCertModal({
                      isOpen: true,
                      imgPath: '/cert2.jpg',
                      title: 'Спеціалізована підготовка психолога',
                    })
                  }
                >
                  <img src="/cert2.jpg" alt="Сертифікат 2" />
                  <span>🔎 Переглянути</span>
                </button>
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
                <img src="/avatar3.jpg" alt={profile.name} />
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

      {/* Legal Modal */}
      <Modal
        isOpen={legalModal.isOpen}
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
        title={legalModal.title}
      >
        <div className="legal-content-pre">{legalModal.content}</div>
      </Modal>

      {/* Certificate Modal */}
      <Modal
        isOpen={certModal.isOpen}
        onClose={() => setCertModal({ ...certModal, isOpen: false })}
        title={certModal.title}
      >
        <div className="cert-modal-body">
          {certModal.imgPath && (
            <img src={certModal.imgPath} alt={certModal.title} className="cert-large-img" />
          )}
        </div>
      </Modal>
    </div>
  );
}
