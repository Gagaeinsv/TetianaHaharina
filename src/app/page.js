'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Modal from '@/components/Modal';

const specDetails = {
  'Дитячо-батьківські стосунки': {
    image: 'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?auto=format&fit=crop&w=600&q=80',
    desc: 'Налагодження взаєморозуміння, подолання криз довіри, емоційна підтримка батьків та відновлення гармонії в родині.'
  },
  'Підліткова психологія': {
    image: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80',
    desc: 'Допомога підліткам у період самоідентифікації, робота з тривожністю, кризами дорослішання та труднощами у спілкуванні.'
  },
  'Вислухати та підтримати': {
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=600&q=80',
    desc: 'Безпечний простір для висловлення переживань без оцінок. Емпатична присутність та підтримка у складні моменти життя.'
  },
  'Підтримка у декреті': {
    image: 'https://images.unsplash.com/photo-1492725764893-90b379c2b6e7?auto=format&fit=crop&w=600&q=80',
    desc: 'Допомога при вигоранні, емоційному виснаженні, профілактика післяпологової депресії та пошук балансу у новій ролі.'
  },
  'Конфлікти': {
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=600&q=80',
    desc: 'Медіація конфліктів у парі чи родині, аналіз повторюваних суперечок та навчання екологічному вираженню емоцій.'
  },
  'Домашнє насилля': {
    image: 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?auto=format&fit=crop&w=600&q=80',
    desc: 'Безпечний вихід із токсичних стосунків, кризова допомога, подолання травматичного досвіду та повернення контролю над життям.'
  },
  'Адаптація в новій країні': {
    image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
    desc: 'Робота з тугою за домом, інтеграція в нове соціокультурне середовище, подолання ізоляції та побудова опор на новому місці.'
  },
  'ЛГБТ-френдлі терапія': {
    image: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80',
    desc: 'Конфіденційна, етична та підтримуюча терапія без упереджень щодо гендерної ідентичності та сексуальної орієнтації.'
  }
};

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Booking state
  const [successfulBooking, setSuccessfulBooking] = useState(null);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [chosenPaymentMethod, setChosenPaymentMethod] = useState('IBAN');
  
  // Custom interactive states
  const [activeFaq, setActiveFaq] = useState(null);
  const [openAnxietyIndex, setOpenAnxietyIndex] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Modal states
  const [legalModal, setLegalModal] = useState({ isOpen: false, title: '', content: '' });
  const [certModal, setCertModal] = useState({ isOpen: false, imgPath: '', title: '' });

  // Derived state values (safely handled when data is null)
  const profile = data?.profile;
  const services = data?.services || [];
  const paymentSettings = profile?.paymentSettings;
  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];
  const activeCalendlyLink = selectedService?.calendlyLink || profile?.calendlyLink || 'https://calendly.com/tetianahaharina';

  useEffect(() => {
    async function fetchContent() {
      try {
        const res = await fetch('/api/content');
        const json = await res.json();
        if (json.success) {
          setData(json);
          // Set default selected service if loaded
          if (json.services && json.services.length > 0) {
            setSelectedServiceId(json.services[0].id);
          }
        } else {
          setError(json.error || 'Не вдалося завантажити контент');
        }
      } catch (err) {
        setError('Помилка з’єднання з сервером');
      } finally {
        setLoading(false);
      }
    }
    fetchContent();
  }, []);

  // Set default payment method when settings load
  useEffect(() => {
    if (data?.profile?.paymentSettings) {
      const ps = data.profile.paymentSettings;
      if (ps.useIban) setChosenPaymentMethod('IBAN');
      else if (ps.useMono) setChosenPaymentMethod('MONO');
      else if (ps.usePaypal) setChosenPaymentMethod('PAYPAL');
    }
  }, [data]);

  // Message event listener for Calendly
  useEffect(() => {
    if (!data || !data.services) return;
    
    const handleCalendlyEvent = (e) => {
      if (e.data && e.data.event === 'calendly.event_scheduled') {
        const selectedService = data.services.find(s => s.id === selectedServiceId) || data.services[0];
        setSuccessfulBooking({
          service: selectedService,
        });
      }
    };

    window.addEventListener('message', handleCalendlyEvent);
    return () => {
      window.removeEventListener('message', handleCalendlyEvent);
    };
  }, [data, selectedServiceId]);

  // Initialize Calendly widget using official JS API to avoid SAMEORIGIN iframe blocking
  useEffect(() => {
    if (typeof window === 'undefined' || !activeCalendlyLink) return;

    let isMounted = true;

    const initCalendly = () => {
      if (!isMounted) return;
      const container = document.getElementById('calendly-embed-container');
      if (container && window.Calendly) {
        container.innerHTML = '';
        window.Calendly.initInlineWidget({
          url: activeCalendlyLink,
          parentElement: container,
          prefill: {},
          pageSettings: {
            hideLandingPageDetails: false,
            hideGdprBanner: true
          }
        });
      }
    };

    if (window.Calendly) {
      initCalendly();
    } else {
      let script = document.getElementById('calendly-widget-js');
      if (!script) {
        script = document.createElement('script');
        script.id = 'calendly-widget-js';
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', initCalendly);
    }

    return () => {
      isMounted = false;
    };
  }, [activeCalendlyLink, data]);

  // Background image states
  const [activeBgs, setActiveBgs] = useState({
    hero: '/avatar5.jpg',
    about: '/avatar4.jpg',
    wrapper2: '/avatar2.jpg'
  });

  // Preload and validate potential section backgrounds
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkImage = (path, key, fallback) => {
      const img = new window.Image();
      img.src = path;
      img.onload = () => {
        setActiveBgs(prev => ({ ...prev, [key]: path }));
      };
      img.onerror = () => {
        if (fallback) {
          setActiveBgs(prev => ({ ...prev, [key]: fallback }));
        }
      };
    };
    
    checkImage('/avatar5.jpg', 'hero', '/avatar.jpg');
    checkImage('/avatar4.jpg', 'about', '/avatar3.jpg');
    checkImage('/avatar2.jpg', 'wrapper2', null);
  }, []);

  const openLegalDoc = (type) => {
    const doc = data?.legalDocs?.find(d => d.type === type);
    if (doc) {
      setLegalModal({
        isOpen: true,
        title: doc.title,
        content: doc.content
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Реквізити скопійовано в буфер обміну!');
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="spinner"></div>
        <p>Завантаження сторінки...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="home-error">
        <p>{error || 'Контент відсутній'}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary">Спробувати знову</button>
      </div>
    );
  }

  // Data is guaranteed to be loaded here due to early returns above

  return (
    <div className="landing-layout">
      {/* Header */}
      <header className="site-header">
        <div className="container header-container">
          <div className="logo">
            <span className="logo-name">{profile.name}</span>
            <span className="logo-title">{profile.title}</span>
          </div>
          
          <button 
            className={`hamburger-btn ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>

          <nav className={`site-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)}>Про мене</a>
            <a href="#philosophy" onClick={() => setIsMobileMenuOpen(false)}>Принципи</a>
            <a href="#specializations" onClick={() => setIsMobileMenuOpen(false)}>Напрямки</a>
            <a href="#services" onClick={() => setIsMobileMenuOpen(false)}>Послуги</a>
            <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)}>Як це працює</a>
            <a href="#faq" onClick={() => setIsMobileMenuOpen(false)}>FAQ</a>
            <a href="#booking" className="btn btn-primary nav-cta" onClick={() => setIsMobileMenuOpen(false)}>Записатись</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-section bg-section-hero">
        <section className="hero-section">
          <div className="container">
            <div className="hero-grid">
              <div className="hero-text-content">
                <span className="hero-badge">⭐ Практикуюча психологиня • {profile.experience} років досвіду</span>
                <h1>Простір безпеки та професійної психологічної підтримки</h1>
                <p className="hero-subtitle">{profile.subtitle}</p>
                <p className="hero-lead">Офіційна психотерапія в рамках українського законодавства. Допомагаю відновити внутрішній баланс, порозумітися з близькими та знайти опору в моменти невизначеності.</p>
                
                <div className="hero-actions">
                  <a href="#booking" className="btn btn-primary btn-lg">Домовитися про зустріч</a>
                  <a href="#about" className="btn btn-secondary btn-lg hero-btn-secondary">Дізнатися більше</a>
                </div>

                {/* Trust Tags */}
                <div className="hero-trust-tags">
                  <span className="trust-tag-item">🛡️ 100% Конфіденційність</span>
                  <span className="trust-tag-item">💼 14 років досвіду</span>
                  <span className="trust-tag-item">🌍 Онлайн по всьому світу</span>
                </div>
              </div>
              
              <div className="hero-image-container">
                <div className="hero-portrait-card">
                  <img src={activeBgs.hero} alt={profile.name} className="hero-portrait-img" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Manifesto Section */}
      <div className="bg-section bg-section-quote">
        <section className="manifesto-section">
          <div className="container text-center">
            <span className="manifesto-badge">Моя місія</span>
            <p className="manifesto-quote">
              «Я прагну допомогти вам почути і зрозуміти себе, знайти внутрішній баланс та відновити гармонію у стосунках із близькими»
            </p>
          </div>
        </section>
      </div>

      {/* Philosophy principles section */}
      <section id="philosophy" className="philosophy-section">
        <div className="container">
          <div className="text-center mb-12">
            <span className="section-badge">Філософія роботи</span>
            <h2>Принципи моєї практики</h2>
            <p className="section-subtitle">Створюю умови, в яких ви відчуєте безпеку та підтримку на кожному кроці</p>
          </div>
          <div className="principles-grid">
            <div className="principle-card">
              <div className="principle-icon">🤍</div>
              <h3>Безоціночність</h3>
              <p>Приймаю будь-які ваші почуття, думки та досвід без жодного засудження. Ви можете бути собою.</p>
            </div>
            <div className="principle-card">
              <div className="principle-icon">🔒</div>
              <h3>Повна конфіденційність</h3>
              <p>Усе, що відбувається на сесії, залишається виключно між нами. Суворе дотримання професійної таємниці.</p>
            </div>
            <div className="principle-card">
              <div className="principle-icon">🌱</div>
              <h3>Дбайливий темп</h3>
              <p>Ми рухаємося зі зручною для вас швидкістю. Жодного тиску чи форсування емоційних процесів.</p>
            </div>
            <div className="principle-card">
              <div className="principle-icon">🤝</div>
              <h3>Партнерський підхід</h3>
              <p>Терапія — це спільна робота. Я поважаю ваш життєвий досвід і допомагаю знайти власні відповіді.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bio / About Section */}
      <div className="bg-section bg-section-welcome">
        <section id="about" className="about-section">
          <div className="container">
            <div className="about-layout-grid">
              <div className="about-details-content">
                <span className="section-badge">Про мене</span>
                <h2>{profile.name}</h2>
                <h4 className="about-specialty">{profile.title} • {profile.subtitle}</h4>
                <p className="about-text">{profile.bio}</p>
                
                <div className="volunteer-badges mt-6">
                  <span className="v-badge">ГО "Соціальний проєкт "Разом"</span>
                  <span className="v-badge">ГО "Ранні пташки"</span>
                  <span className="v-badge">Гейткіпер</span>
                  <span className="v-badge">Центр "Перспектива"</span>
                </div>
              </div>

              <div className="about-facts-container">
                <div className="facts-card">
                  <h3>Професійна довідка</h3>
                  <ul className="facts-list">
                    <li><strong>🎓 Освіта:</strong> Вища психологічна, додаткова сертифікація за європейськими стандартами</li>
                    <li><strong>💼 Досвід:</strong> 14 років практичної роботи</li>
                    <li><strong>🌍 Формат:</strong> Онлайн-консультації по всьому світу</li>
                    <li><strong>🗣️ Мови:</strong> Українська, російська</li>
                    <li><strong>🔒 Гарантія:</strong> Діяльність офіційно зареєстрована ФОП</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="about-philosophy-row">
              <div className="philosophy-grid-container">
                <div className="philosophy-content-col">
                  <div className="about-philosophy-card">
                    <h3>Мій професійний підхід</h3>
                    <div className="philosophy-details">
                      <p>У своїй роботі я створюю безпечний, конфіденційний та підтримуючий простір, де ви зможете розділити свої переживання. Моя мета — допомогти батькам налагодити зв'язок з дітьми, підтримати підлітків у складний період та надати ресурс дорослим.</p>
                      <ul className="philosophy-list">
                        <li>🌱 100% конфіденційність та безпека</li>
                        <li>🤝 Підтримка без оцінювання та осуду</li>
                        <li>💼 Офіційний ФОП — безпека розрахунків</li>
                        <li>📱 Зручний зв'язок та онлайн-консультації</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="philosophy-portrait-col">
                  <div className="philosophy-portrait-card">
                    <img src={activeBgs.wrapper2} alt={`${profile.name} — фото`} className="philosophy-portrait-img" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>


      {/* Specializations (Requests) Section */}
      <section id="specializations" className="specs-section">
        <div className="container">
          <div className="text-center mb-12">
            <span className="section-badge">Спеціалізація</span>
            <h2>З якими запитами я працюю?</h2>
            <p className="section-subtitle">Індивідуальний підхід до кожного кейсу для досягнення тривалих результатів</p>
          </div>
          <div className="specs-grid">
            {profile.specializations.map((spec) => {
              const details = specDetails[spec.name] || {
                image: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80',
                desc: 'Ефективна терапія, заснована на доказових методах та багаторічному практичному досвіді.'
              };
              return (
                <div key={spec.id} className="spec-card">
                  <div className="spec-image-container">
                    <img src={details.image} alt={spec.name} className="spec-card-img" />
                  </div>
                  <div className="spec-card-content">
                    <h3>{spec.name}</h3>
                    <p>{details.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <div className="bg-section bg-section-services">
        <section id="services" className="services-section">
          <div className="container">
            <div className="text-center mb-12">
              <span className="section-badge">Послуги та вартість</span>
              <h2>Формати роботи та тарифи</h2>
              <p className="section-subtitle">Оберіть формат, який найкраще відповідає вашому запиту</p>
            </div>
            <div className="services-grid">
              {services.map((s) => (
                <div key={s.id} className="service-card-new">
                  <div className="service-card-header-new">
                    <span className="service-icon-new">🌸</span>
                    <h3>{s.name}</h3>
                  </div>
                  <p className="service-desc-new">{s.description}</p>
                  <div className="service-meta-new">
                    <span>⏱️ {s.duration} хвилин</span>
                    <span>🌍 Онлайн (Zoom / Google Meet / Telegram)</span>
                  </div>
                  <div className="service-price-row-new">
                    <span className="price-label">Вартість сесії:</span>
                    <span className="price-value">{s.priceUah} грн</span>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedServiceId(s.id);
                      document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
                    }} 
                    className="btn btn-primary w-full"
                  >
                    Записатися на консультацію
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>


      {/* How it Works Section */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="text-center mb-12">
            <span className="section-badge">Процес роботи</span>
            <h2>Як проходить робота?</h2>
            <p className="section-subtitle">Прості та зрозумілі кроки від першого кліку до реальних змін</p>
          </div>
          <div className="timeline">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Онлайн-запис</h3>
                <p>Ви обираєте зручний день та час у нашому інтерактивному календарі внизу сторінки.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Перший контакт</h3>
                <p>Я зв'язуюся з вами у месенджері (Telegram/Viber/WhatsApp) для підтвердження та уточнення формату.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Перша сесія</h3>
                <p>Знайомимося, створюємо безпечний простір для обговорення ваших почуттів та окреслюємо цілі.</p>
              </div>
            </div>
            <div className="timeline-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Подальша терапія</h3>
                <p>Визначаємо регулярність зустрічей, що підійде вашому запиту для досягнення стабільних результатів.</p>
              </div>
            </div>
          </div>

          {/* Anxiety Reduction Q&A Grid */}
          <div className="anxiety-faq-container">
            <h3 className="anxiety-title text-center">Щоб зменшити вашу тривогу перед першим кроком:</h3>
            <div className="anxiety-grid">
              <div 
                className={`anxiety-card ${openAnxietyIndex === 0 ? 'open' : ''}`}
                onClick={() => setOpenAnxietyIndex(openAnxietyIndex === 0 ? null : 0)}
              >
                <div className="anxiety-header">
                  <h4>Що буде на першій зустрічі?</h4>
                  <span className="anxiety-toggle-icon">{openAnxietyIndex === 0 ? '−' : '+'}</span>
                </div>
                {openAnxietyIndex === 0 && (
                  <p className="anxiety-body">
                    Це знайомство. Ми поговоримо про те, що вас турбує зараз, і про те, чого б ви хотіли від терапії. Не обов'язково точно формулювати запит заздалегідь — я допоможу вам структурувати думки.
                  </p>
                )}
              </div>

              <div 
                className={`anxiety-card ${openAnxietyIndex === 1 ? 'open' : ''}`}
                onClick={() => setOpenAnxietyIndex(openAnxietyIndex === 1 ? null : 1)}
              >
                <div className="anxiety-header">
                  <h4>Чи потрібно спеціально готуватися?</h4>
                  <span className="anxiety-toggle-icon">{openAnxietyIndex === 1 ? '−' : '+'}</span>
                </div>
                {openAnxietyIndex === 1 && (
                  <p className="anxiety-body">
                    Ні, спеціальної підготовки не потрібно. Достатньо мати стабільний інтернет, тихе та затишне місце, де ви зможете говорити відверто без сторонніх вух, та 50 хвилин вільного часу.
                  </p>
                )}
              </div>

              <div 
                className={`anxiety-card ${openAnxietyIndex === 2 ? 'open' : ''}`}
                onClick={() => setOpenAnxietyIndex(openAnxietyIndex === 2 ? null : 2)}
              >
                <div className="anxiety-header">
                  <h4>Як зрозуміти, чи підходить мені терапія?</h4>
                  <span className="anxiety-toggle-icon">{openAnxietyIndex === 2 ? '−' : '+'}</span>
                </div>
                {openAnxietyIndex === 2 && (
                  <p className="anxiety-body">
                    Орієнтуйтеся на свої відчуття під час першої зустрічі. Якщо ви відчуваєте безпеку, контакт та повагу до себе з боку терапевта — це хороший знак, що терапія буде ефективною.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signals Section */}
      <section className="trust-signals-section">
        <div className="container">
          <div className="text-center mb-12">
            <span className="section-badge">Гарантія якості</span>
            <h2>Етичні стандарти та професійна довіра</h2>
            <p className="section-subtitle">Робота будується на доказових методах та відповідальному ставленні до клієнтів</p>
          </div>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">🔍</div>
              <h4>Регулярна супервізія</h4>
              <p>Всі складні терапевтичні випадки я обговорюю з досвідченими колегами-супервізорами для підтримання якості моєї роботи.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📈</div>
              <h4>2000+ годин практики</h4>
              <p>Багаторічний клієнтський досвід дозволяє мені глибоко розуміти процеси терапії та підбирати дієві методики.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">📜</div>
              <h4>Етичний кодекс</h4>
              <p>Я суворо дотримуюся Етичного кодексу психолога: повага, конфіденційність, чесність та висока відповідальність.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">🏛️</div>
              <h4>Членство в асоціаціях</h4>
              <p>Є членом професійних об'єднань, що підтверджує відповідність міжнародним стандартам психологічної практики.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certificates Gallery Section */}
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="text-center mb-12">
            <span className="section-badge">Кваліфікація</span>
            <h2>Дипломи та Сертифікати</h2>
            <p className="section-subtitle">Постійне підвищення кваліфікації та підтвердження стандартів психотерапії</p>
          </div>
          <div className="gallery-grid">
            <div 
              className="gallery-item"
              onClick={() => setCertModal({ isOpen: true, imgPath: '/cert1.jpg', title: 'Сертифікат про підвищення кваліфікації' })}
            >
              <div className="gallery-image-wrapper">
                <Image src="/cert1.jpg" alt="Сертифікат 1" width={350} height={250} className="gallery-img" />
                <div className="gallery-overlay">
                  <span>🔎 Переглянути</span>
                </div>
              </div>
              <p className="gallery-title">Сертифікат підвищення кваліфікації</p>
            </div>
            
            <div 
              className="gallery-item"
              onClick={() => setCertModal({ isOpen: true, imgPath: '/cert2.jpg', title: 'Сертифікат психологічного центру' })}
            >
              <div className="gallery-image-wrapper">
                <Image src="/cert2.jpg" alt="Сертифікат 2" width={350} height={250} className="gallery-img" />
                <div className="gallery-overlay">
                  <span>🔎 Переглянути</span>
                </div>
              </div>
              <p className="gallery-title">Спеціалізоване навчання</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <div className="bg-section bg-section-faq">
        <section id="faq" className="faq-section">
          <div className="container">
            <div className="text-center mb-12">
              <span className="section-badge">Часті запитання</span>
              <h2>Відповіді на ваші запитання</h2>
              <p className="section-subtitle">Дізнайтеся більше про практичні та організаційні моменти роботи</p>
            </div>
            <div className="faq-accordion">
              {[
                {
                  q: "Як часто потрібно проходити сесії?",
                  a: "Зазвичай зустрічі проходять один раз на тиждень. Это оптимальна частота для стабільної роботи над запитом та інтеграції змін у повсякденне життя."
                },
                {
                  q: "Яка тривалість однієї консультації?",
                  a: "Індивідуальна та дитячо-батьківська консультації тривають 50 хвилин. Це стандартний терапевтичний час."
                },
                {
                  q: "Чи можна скасувати або перенести сесію?",
                  a: "Так, перенос або скасування можливі без додаткової оплати не пізніше ніж за 24 години до призначеного часу. За скасування пізніше цього терміну сесія оплачується у повному обсязі."
                },
                {
                  q: "Як проходить оплата?",
                  a: "Ви можете сплатити сесію офіційно на реквізити ФОП (IBAN), карткою онлайн через Monobank або через PayPal (для міжнародних клієнтів) безпосередньо після онлайн-запису."
                },
                {
                  q: "Чи є консультації конфіденційними?",
                  a: "Так, повна конфіденційність є базовим правилом моєї роботи. Будь-які деталі вашої історії залишаються у суворій таємниці, за винятком випадків супервізії (без імен та ідентифікаторів) та ситуацій загрози життю."
                },
                {
                  q: "З якого віку ви працюєте з підлітками?",
                  a: "Працюю з підлітками від 12 років. Зверніть увагу: терапія неповнолітніх можлива виключно за згодою хоча б одного з батьків або опікунів."
                }
              ].map((item, index) => (
                <div key={index} className={`faq-item ${activeFaq === index ? 'open' : ''}`}>
                  <div 
                    className="faq-question"
                    onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  >
                    <h4>{item.q}</h4>
                    <span className="faq-arrow">{activeFaq === index ? '▲' : '▼'}</span>
                  </div>
                  {activeFaq === index && (
                    <div className="faq-answer">
                      <p>{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>


      {/* Booking and Calendar Section */}
      <div className="bg-section bg-section-booking">
        <section id="booking" className="booking-section">
          <div className="container">
            <div className="text-center mb-12">
              <span className="section-badge">Онлайн-запис</span>
              <h2>Записатися на консультацію</h2>
              <p className="section-subtitle">Оберіть зручний час, введіть контакти та забронюйте сесію</p>
            </div>

            <div className="booking-box-container">
              {!successfulBooking ? (
                <div className="booking-form-wrapper">
                  {/* Service tabs above the iframe to switch booking types */}
                  <div className="booking-service-tabs">
                    {services.map((s) => (
                      <button
                        key={s.id}
                        className={`service-tab-btn ${selectedServiceId === s.id ? 'active' : ''}`}
                        onClick={() => setSelectedServiceId(s.id)}
                      >
                        {s.name} ({s.priceUah} грн)
                      </button>
                    ))}
                  </div>

                  {/* Calendly Inline Embed Container */}
                  <div className="calendly-iframe-container">
                    <div
                      id="calendly-embed-container"
                      style={{ minWidth: '320px', height: '700px', borderRadius: '12px', background: 'white', overflow: 'hidden' }}
                    ></div>
                  </div>
                  
                  {/* Supportive microcopy helper */}
                  <div className="booking-helper-microcopy">
                    <p>🤍 Перший крок можна зробити у спокійному для вас темпі. Не обов’язково точно формулювати запит заздалегідь — ми розберемося разом під час зустрічі.</p>
                  </div>
                </div>
              ) : (
                /* Payment Checkout Flow */
                <div className="payment-checkout-card">
                  <div className="checkout-success-header">
                    <span className="success-icon">🎉</span>
                    <h2>Запис успішно створено!</h2>
                    <p>Дякуємо за запис! Вашу сесію успішно заброньовано в Calendly.</p>
                    <div className="checkout-session-details">
                      <span>💼 {successfulBooking.service?.name}</span>
                      <span className="price-tag">{successfulBooking.service?.priceUah} грн</span>
                    </div>
                    <div className="payment-alert mt-4" style={{ backgroundColor: 'rgba(31, 62, 61, 0.05)', color: 'var(--color-primary)', borderColor: 'var(--color-accent)' }}>
                      📅 Час та деталі зустрічі ви отримаєте у підтвердженні на вашу електронну пошту від Calendly.
                    </div>
                  </div>

                  <div className="checkout-payment-details">
                    <h3>Оплата послуг</h3>
                    <p className="mb-6 text-center">Згідно з законодавством України, ви здійснюєте офіційну оплату ФОП. Будь ласка, оберіть зручний спосіб оплати:</p>

                    {/* Payment Method Selector */}
                    <div className="payment-select-grid mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      {paymentSettings.useIban && (
                        <div 
                          className={`payment-option ${chosenPaymentMethod === 'IBAN' ? 'selected' : ''}`}
                          onClick={() => setChosenPaymentMethod('IBAN')}
                          style={{ border: chosenPaymentMethod === 'IBAN' ? '2px solid var(--color-accent)' : '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: chosenPaymentMethod === 'IBAN' ? 'var(--color-primary-light)' : 'var(--color-white)' }}
                        >
                          <strong>Реквізити ФОП (IBAN)</strong>
                          <p className="text-small text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Оплата за реквізитами в банку</p>
                        </div>
                      )}
                      {paymentSettings.useMono && (
                        <div 
                          className={`payment-option ${chosenPaymentMethod === 'MONO' ? 'selected' : ''}`}
                          onClick={() => setChosenPaymentMethod('MONO')}
                          style={{ border: chosenPaymentMethod === 'MONO' ? '2px solid var(--color-accent)' : '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: chosenPaymentMethod === 'MONO' ? 'var(--color-primary-light)' : 'var(--color-white)' }}
                        >
                          <strong>Картка / Monobank</strong>
                          <p className="text-small text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Оплата онлайн через Apple Pay / Google Pay</p>
                        </div>
                      )}
                      {paymentSettings.usePaypal && (
                        <div 
                          className={`payment-option ${chosenPaymentMethod === 'PAYPAL' ? 'selected' : ''}`}
                          onClick={() => setChosenPaymentMethod('PAYPAL')}
                          style={{ border: chosenPaymentMethod === 'PAYPAL' ? '2px solid var(--color-accent)' : '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: chosenPaymentMethod === 'PAYPAL' ? 'var(--color-primary-light)' : 'var(--color-white)' }}
                        >
                          <strong>PayPal</strong>
                          <p className="text-small text-muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Для оплати в валюті з-за кордону</p>
                        </div>
                      )}
                    </div>

                    {/* Payment option: IBAN */}
                    {chosenPaymentMethod === 'IBAN' && paymentSettings.useIban && (
                      <div className="iban-payment-box">
                        <h4 className="text-center mb-4" style={{ fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>Реквізити ФОП для оплати (IBAN)</h4>
                        <table className="iban-table">
                          <tbody>
                            <tr>
                              <td>Отримувач:</td>
                              <td><strong>ФОП {profile.name}</strong></td>
                            </tr>
                            <tr>
                              <td>Рахунок IBAN:</td>
                              <td>
                                <span className="iban-number">{paymentSettings.iban}</span>
                                <button 
                                  onClick={() => copyToClipboard(paymentSettings.iban)}
                                  className="btn-copy"
                                >
                                  📋
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td>ЄДРПОУ / ІПН:</td>
                              <td>
                                <span>{paymentSettings.edrpou}</span>
                                <button 
                                  onClick={() => copyToClipboard(paymentSettings.edrpou)}
                                  className="btn-copy"
                                >
                                  📋
                                </button>
                              </td>
                            </tr>
                            <tr>
                              <td>Банк:</td>
                              <td>{paymentSettings.bankName}</td>
                            </tr>
                            <tr>
                              <td>Призначення:</td>
                              <td>Оплата за психологічні послуги ({successfulBooking.service?.name})</td>
                            </tr>
                          </tbody>
                        </table>
                        <div className="payment-alert mt-4">
                          💡 Будь ласка, надішліть квитанцію про оплату в один із месенджерів після здійснення переказу.
                        </div>
                      </div>
                    )}

                    {/* Payment option: Monobank */}
                    {chosenPaymentMethod === 'MONO' && paymentSettings.useMono && (
                      <div className="mono-payment-box text-center">
                        <h4>Оплата онлайн через Monobank</h4>
                        <p>Клацніть кнопку нижче, щоб перейти на офіційну сторінку оплати карткою або через Apple Pay / Google Pay / Monopay.</p>
                        <a 
                          href={paymentSettings.monoLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-mono mt-4"
                        >
                          💳 Оплатити через Monobank
                        </a>
                      </div>
                    )}

                    {/* Payment option: PayPal */}
                    {chosenPaymentMethod === 'PAYPAL' && paymentSettings.usePaypal && (
                      <div className="paypal-payment-box text-center">
                        <h4>Оплата через PayPal</h4>
                        <p>Ви можете сплатити сесію за кордону за допомогою PayPal. Надішліть платіж на електронну адресу або перейдіть за посиланням PayPal.Me.</p>
                        <div className="paypal-details mt-4">
                          <div>Email: <strong>{paymentSettings.paypalEmail}</strong></div>
                          {paymentSettings.paypalLink && (
                            <a 
                              href={paymentSettings.paypalLink} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-paypal mt-4"
                            >
                              💸 Оплатити через PayPal.Me
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="checkout-actions">
                    <p className="mb-4">Зв’яжіться зі спеціалісткою для підтвердження сесії:</p>
                    <div className="messenger-buttons">
                      <a 
                        href={`https://t.me/${profile.phone.replace(/\+/g, '').replace(/^[0-9]/, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-msg telegram"
                      >
                        ✈️ Telegram
                      </a>
                      <a 
                        href={`viber://chat?number=%2B${profile.phone.replace(/\+/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-msg viber"
                      >
                        💬 Viber
                      </a>
                      <a 
                        href={`https://wa.me/${profile.whatsapp.replace(/\+/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-msg whatsapp"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                    <button 
                      onClick={() => setSuccessfulBooking(null)} 
                      className="btn btn-secondary mt-8"
                    >
                      Забронювати ще одну сесію
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>


      {/* Footer Section */}
      <footer className="site-footer">
        <div className="container footer-container">
          <div className="footer-brand">
            <h3>{profile.name}</h3>
            <p className="logo-title">{profile.title}</p>
            <p className="footer-legal-text mt-4">
              ФОП {profile.name}<br />
              ЄДРПОУ: {paymentSettings.edrpou}<br />
              Спрощена система оподаткування, 3 група
            </p>
          </div>
          <div className="footer-links">
            <h4>Правова інформація</h4>
            <button onClick={() => openLegalDoc('OFFER')} className="footer-link-btn">
              Публічна оферта (Договір)
            </button>
            <button onClick={() => openLegalDoc('PRIVACY')} className="footer-link-btn">
              Політика конфіденційності
            </button>
            <Link href="/admin" className="footer-link-btn text-muted">
              🔐 Вхід в адмінку
            </Link>
          </div>
          <div className="footer-contacts">
            <h4>Контакти</h4>
            <p>📞 {profile.phone} (Україна)</p>
            <p>🟢 {profile.whatsapp} (Міжнародний)</p>
            <p>🌐 <a href={profile.facebook} target="_blank" rel="noopener noreferrer">Facebook сторінка</a></p>
          </div>
        </div>
        <div className="footer-bottom text-center">
          <p>© {new Date().getFullYear()} {profile.name}. Всі права захищено. Працюємо у правовому полі України.</p>
        </div>
      </footer>

      {/* Reusable Modals */}
      <Modal 
        isOpen={legalModal.isOpen} 
        onClose={() => setLegalModal({ ...legalModal, isOpen: false })} 
        title={legalModal.title}
      >
        <div className="legal-content-pre">
          {legalModal.content}
        </div>
      </Modal>

      <Modal
        isOpen={certModal.isOpen}
        onClose={() => setCertModal({ ...certModal, isOpen: false })}
        title={certModal.title}
      >
        <div className="cert-modal-body">
          <Image src={certModal.imgPath} alt={certModal.title} width={800} height={600} className="cert-large-img" />
        </div>
      </Modal>

      {/* Sticky Mobile CTA */}
      <div className="sticky-mobile-cta">
        <a href="#booking" className="btn btn-primary w-full text-center">
          Записатися на консультацію
        </a>
      </div>
    </div>
  );
}
