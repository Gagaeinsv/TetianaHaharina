'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // State for all edited fields
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    subtitle: '',
    bio: '',
    experience: 0,
    phone: '',
    whatsapp: '',
    facebook: '',
  });

  const [specializations, setSpecializations] = useState([]);
  const [newSpec, setNewSpec] = useState('');

  const [services, setServices] = useState([]);
  const [paymentSettings, setPaymentSettings] = useState({
    iban: '',
    bankName: '',
    edrpou: '',
    monoLink: '',
    paypalLink: '',
    paypalEmail: '',
    useIban: true,
    useMono: false,
    usePaypal: false,
  });

  const [legalDocs, setLegalDocs] = useState([]);
  const [bookings, setBookings] = useState([]);

  // States for manual booking
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: 'manual@booking.com',
    date: '',
    timeSlot: '09:00',
    serviceId: '',
    paymentMethod: 'IBAN',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING'
  });


  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/content');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        if (data.profile) {
          setProfile({
            name: data.profile.name || '',
            title: data.profile.title || '',
            subtitle: data.profile.subtitle || '',
            bio: data.profile.bio || '',
            experience: data.profile.experience || 0,
            phone: data.profile.phone || '',
            whatsapp: data.profile.whatsapp || '',
            facebook: data.profile.facebook || '',
          });
          if (data.profile.specializations) {
            setSpecializations(data.profile.specializations.map(s => s.name));
          }
          if (data.profile.paymentSettings) {
            setPaymentSettings({
              iban: data.profile.paymentSettings.iban || '',
              bankName: data.profile.paymentSettings.bankName || '',
              edrpou: data.profile.paymentSettings.edrpou || '',
              monoLink: data.profile.paymentSettings.monoLink || '',
              paypalLink: data.profile.paymentSettings.paypalLink || '',
              paypalEmail: data.profile.paymentSettings.paypalEmail || '',
              useIban: data.profile.paymentSettings.useIban,
              useMono: data.profile.paymentSettings.useMono,
              usePaypal: data.profile.paymentSettings.usePaypal,
            });
          }
        }
        if (data.services) {
          setServices(data.services);
        }
        if (data.legalDocs) {
          setLegalDocs(data.legalDocs);
        }
        if (data.bookings) {
          setBookings(data.bookings);
        }
      } else {
        setError(data.error || 'Помилка завантаження даних');
      }
    } catch (err) {
      setError('Не вдалося з’єднатися з сервером');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (e) {
      alert('Помилка виходу');
    }
  };

  // Generic Save Function
  const handleSave = async (sectionPayload) => {
    setSaveLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionPayload),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess('Зміни успішно збережено!');
        setTimeout(() => setSuccess(''), 3000);
        // Refresh data
        fetchData();
      } else {
        setError(data.error || 'Помилка збереження даних');
      }
    } catch (err) {
      setError('Не вдалося зберегти зміни');
    } finally {
      setSaveLoading(false);
    }
  };

  // Manage Specializations
  const addSpec = () => {
    if (newSpec.trim() && !specializations.includes(newSpec.trim())) {
      setSpecializations([...specializations, newSpec.trim()]);
      setNewSpec('');
    }
  };

  const removeSpec = (index) => {
    setSpecializations(specializations.filter((_, i) => i !== index));
  };

  // Manage Services
  const handleServiceChange = (index, field, value) => {
    const updated = [...services];
    updated[index][field] = value;
    setServices(updated);
  };

  const addService = () => {
    setServices([...services, { name: 'Нова послуга', description: '', duration: 50, priceUah: 1000 }]);
  };

  const removeService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  // Manage Bookings (Update Status)
  const updateBookingStatus = async (id, field, value) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });
      const data = await res.json();
      if (data.success) {
        setBookings(bookings.map(b => b.id === id ? { ...b, [field]: value } : b));
        setSuccess('Статус запису оновлено!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Помилка оновлення статусу');
      }
    } catch (e) {
      setError('Не вдалося оновити статус');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!manualBooking.serviceId) {
      setError('Оберіть послугу');
      return;
    }

    try {
      // 1. Create booking
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: manualBooking.clientName,
          clientPhone: manualBooking.clientPhone,
          clientEmail: manualBooking.clientEmail,
          date: manualBooking.date,
          timeSlot: manualBooking.timeSlot,
          serviceId: manualBooking.serviceId,
          paymentMethod: manualBooking.paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // 2. Update status and payment status if they are not default PENDING
        if (manualBooking.status !== 'PENDING' || manualBooking.paymentStatus !== 'PENDING') {
          await fetch('/api/bookings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: data.booking.id,
              status: manualBooking.status,
              paymentStatus: manualBooking.paymentStatus,
            }),
          });
        }

        setSuccess('Запис успішно створено вручну!');
        setTimeout(() => setSuccess(''), 3000);
        setShowManualForm(false);
        // Reset form
        setManualBooking({
          clientName: '',
          clientPhone: '',
          clientEmail: 'manual@booking.com',
          date: '',
          timeSlot: '09:00',
          serviceId: services[0]?.id || '',
          paymentMethod: 'IBAN',
          status: 'CONFIRMED',
          paymentStatus: 'PENDING'
        });
        fetchData();
      } else {
        setError(data.error || 'Помилка створення запису');
      }
    } catch (err) {
      setError('Не вдалося створити запис');
    }
  };


  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Завантаження адмін-панелі...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Панель керування</h3>
          <p>ФОП {profile.name}</p>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={activeTab === 'profile' ? 'active' : ''} 
            onClick={() => setActiveTab('profile')}
          >
            👤 Про мене та Контакти
          </button>
          <button 
            className={activeTab === 'specs' ? 'active' : ''} 
            onClick={() => setActiveTab('specs')}
          >
            🎯 Напрямки роботи
          </button>
          <button 
            className={activeTab === 'services' ? 'active' : ''} 
            onClick={() => setActiveTab('services')}
          >
            💼 Послуги та Ціни
          </button>
          <button 
            className={activeTab === 'payments' ? 'active' : ''} 
            onClick={() => setActiveTab('payments')}
          >
            💳 Налаштування оплати
          </button>
          <button 
            className={activeTab === 'legal' ? 'active' : ''} 
            onClick={() => setActiveTab('legal')}
          >
            ⚖️ Юридичні документи
          </button>
          <button 
            className={activeTab === 'bookings' ? 'active' : ''} 
            onClick={() => { setActiveTab('bookings'); fetchData(); }}
          >
            📅 Бронювання ({bookings.filter(b => b.status === 'PENDING').length} нових)
          </button>
        </nav>
        <div className="sidebar-footer">
          <Link href="/" target="_blank" className="btn btn-secondary w-full text-center mb-2">Переглянути сайт</Link>
          <button onClick={handleLogout} className="btn btn-danger w-full">Вийти з адмінки</button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="admin-main">
        <header className="admin-header">
          <h2>{
            activeTab === 'profile' ? 'Про мене та Контакти' :
            activeTab === 'specs' ? 'Напрямки роботи (Запити)' :
            activeTab === 'services' ? 'Послуги та Вартість' :
            activeTab === 'payments' ? 'Налаштування оплати' :
            activeTab === 'legal' ? 'Юридичні документи (Договори)' :
            'Календар записів клієнтів (Бронювання)'
          }</h2>
          <div>
            {error && <span className="text-danger mr-4">{error}</span>}
            {success && <span className="text-success mr-4">{success}</span>}
          </div>
        </header>

        <div className="admin-content-card">
          {/* Tab 1: Profile */}
          {activeTab === 'profile' && (
            <div className="admin-form-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Ім’я та Прізвище</label>
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Головний титул</label>
                  <input 
                    type="text" 
                    value={profile.title} 
                    onChange={e => setProfile({...profile, title: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Підзаголовок / Короткий опис</label>
                <input 
                  type="text" 
                  value={profile.subtitle} 
                  onChange={e => setProfile({...profile, subtitle: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label>Професійне резюме / Біографія</label>
                <textarea 
                  rows={4}
                  value={profile.bio} 
                  onChange={e => setProfile({...profile, bio: e.target.value})} 
                />
              </div>

              <div className="form-grid">
                <div className="form-group">
                  <label>Досвід роботи (років)</label>
                  <input 
                    type="number" 
                    value={profile.experience} 
                    onChange={e => setProfile({...profile, experience: parseInt(e.target.value) || 0})} 
                  />
                </div>
                <div className="form-group">
                  <label>Телефон (Telegram/Viber)</label>
                  <input 
                    type="text" 
                    value={profile.phone} 
                    onChange={e => setProfile({...profile, phone: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>WhatsApp (міжнародний)</label>
                  <input 
                    type="text" 
                    value={profile.whatsapp} 
                    onChange={e => setProfile({...profile, whatsapp: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label>Facebook (посилання)</label>
                  <input 
                    type="text" 
                    value={profile.facebook} 
                    onChange={e => setProfile({...profile, facebook: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                onClick={() => handleSave({ profile })} 
                className="btn btn-primary"
                disabled={saveLoading}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти зміни профілю'}
              </button>
            </div>
          )}

          {/* Tab 2: Specializations */}
          {activeTab === 'specs' && (
            <div className="admin-form-section">
              <p className="section-desc">Вкажіть теми та запити, з якими ви працюєте (відображатимуться на головній сторінці як картки).</p>
              
              <div className="spec-input-group">
                <input 
                  type="text" 
                  value={newSpec} 
                  onChange={e => setNewSpec(e.target.value)} 
                  placeholder="Наприклад: Сімейні кризи"
                />
                <button onClick={addSpec} className="btn btn-secondary">Додати запит</button>
              </div>

              <div className="spec-tags-list">
                {specializations.map((spec, index) => (
                  <span key={index} className="spec-tag">
                    {spec}
                    <button onClick={() => removeSpec(index)}>×</button>
                  </span>
                ))}
                {specializations.length === 0 && <p className="text-muted">Напрямків роботи не додано.</p>}
              </div>

              <hr />
              <button 
                onClick={() => handleSave({ specializations })} 
                className="btn btn-primary mt-4"
                disabled={saveLoading}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти напрямки роботи'}
              </button>
            </div>
          )}

          {/* Tab 3: Services */}
          {activeTab === 'services' && (
            <div className="admin-form-section">
              <p className="section-desc">Додавайте та редагуйте послуги, вказуючи тривалість та ціну в гривнях.</p>
              
              {services.map((service, index) => (
                <div key={index} className="service-editor-card">
                  <div className="service-card-header">
                    <h4>Послуга #{index + 1}</h4>
                    <button onClick={() => removeService(index)} className="btn-remove">Видалити послугу</button>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Назва послуги</label>
                      <input 
                        type="text" 
                        value={service.name} 
                        onChange={e => handleServiceChange(index, 'name', e.target.value)} 
                      />
                    </div>
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>Тривалість (хв)</label>
                        <input 
                          type="number" 
                          value={service.duration} 
                          onChange={e => handleServiceChange(index, 'duration', parseInt(e.target.value) || 50)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Ціна (UAH)</label>
                        <input 
                          type="number" 
                          value={service.priceUah} 
                          onChange={e => handleServiceChange(index, 'priceUah', parseInt(e.target.value) || 0)} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>Опис послуги (що входить, для кого вона)</label>
                    <textarea 
                      rows={2}
                      value={service.description} 
                      onChange={e => handleServiceChange(index, 'description', e.target.value)} 
                    />
                  </div>
                </div>
              ))}

              <div className="service-footer-actions">
                <button onClick={addService} className="btn btn-secondary">+ Додати нову послугу</button>
                <button 
                  onClick={() => handleSave({ services })} 
                  className="btn btn-primary"
                  disabled={saveLoading}
                >
                  {saveLoading ? 'Збереження...' : 'Зберегти всі послуги'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Payments */}
          {activeTab === 'payments' && (
            <div className="admin-form-section">
              <p className="section-desc">Керуйте платіжними методами, які будуть доступні клієнту після бронювання сесії.</p>
              
              <div className="payment-toggle-card">
                <div className="payment-toggle-header">
                  <label className="switch-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.useIban} 
                      onChange={e => setPaymentSettings({...paymentSettings, useIban: e.target.checked})} 
                    />
                    <span className="switch-slider"></span>
                  </label>
                  <div>
                    <h4>Офіційна оплата на рахунок ФОП за реквізитами (IBAN)</h4>
                    <p className="text-muted">Клієнт отримає офіційний IBAN-рахунок для оплати через Приват24/Monobank згідно з українським законодавством.</p>
                  </div>
                </div>
                {paymentSettings.useIban && (
                  <div className="payment-toggle-body">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Номер рахунку IBAN (у форматі UA...)</label>
                        <input 
                          type="text" 
                          value={paymentSettings.iban} 
                          onChange={e => setPaymentSettings({...paymentSettings, iban: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Назва банку</label>
                        <input 
                          type="text" 
                          value={paymentSettings.bankName} 
                          onChange={e => setPaymentSettings({...paymentSettings, bankName: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>ЄДРПОУ / ІПН ФОП</label>
                        <input 
                          type="text" 
                          value={paymentSettings.edrpou} 
                          onChange={e => setPaymentSettings({...paymentSettings, edrpou: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="payment-toggle-card">
                <div className="payment-toggle-header">
                  <label className="switch-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.useMono} 
                      onChange={e => setPaymentSettings({...paymentSettings, useMono: e.target.checked})} 
                    />
                    <span className="switch-slider"></span>
                  </label>
                  <div>
                    <h4>Оплата карткою (Monobank / Банка / WayForPay)</h4>
                    <p className="text-muted">Можливість оплати в один клік через Apple Pay, Google Pay або карткою.</p>
                  </div>
                </div>
                {paymentSettings.useMono && (
                  <div className="payment-toggle-body">
                    <div className="form-group">
                      <label>Посилання на платіжну сторінку або банку Monobank (наприклад, https://send.monobank.ua/jar/...)</label>
                      <input 
                        type="text" 
                        value={paymentSettings.monoLink} 
                        onChange={e => setPaymentSettings({...paymentSettings, monoLink: e.target.value})} 
                        placeholder="https://send.monobank.ua/jar/XXXXX"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="payment-toggle-card">
                <div className="payment-toggle-header">
                  <label className="switch-container">
                    <input 
                      type="checkbox" 
                      checked={paymentSettings.usePaypal} 
                      onChange={e => setPaymentSettings({...paymentSettings, usePaypal: e.target.checked})} 
                    />
                    <span className="switch-slider"></span>
                  </label>
                  <div>
                    <h4>Міжнародна оплата через PayPal</h4>
                    <p className="text-muted">Необхідно для розрахунків з клієнтами з-за кордону.</p>
                  </div>
                </div>
                {paymentSettings.usePaypal && (
                  <div className="payment-toggle-body">
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Ваш PayPal Email (для виставлення рахунку)</label>
                        <input 
                          type="email" 
                          value={paymentSettings.paypalEmail} 
                          onChange={e => setPaymentSettings({...paymentSettings, paypalEmail: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Посилання PayPal.Me (опціонально, наприклад, paypal.me/username)</label>
                        <input 
                          type="text" 
                          value={paymentSettings.paypalLink} 
                          onChange={e => setPaymentSettings({...paymentSettings, paypalLink: e.target.value})} 
                          placeholder="https://paypal.me/username"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={() => handleSave({ paymentSettings })} 
                className="btn btn-primary"
                disabled={saveLoading}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти платіжні реквізити'}
              </button>
            </div>
          )}

          {/* Tab 5: Legal Docs */}
          {activeTab === 'legal' && (
            <div className="admin-form-section">
              <p className="section-desc">Редагуйте Публічний договір та Політику конфіденційності. Зміни миттєво оновляться у модальних вікнах на сайті.</p>
              
              {legalDocs.map((doc, index) => (
                <div key={index} className="legal-doc-editor">
                  <h4>{doc.title} ({doc.type === 'OFFER' ? 'Оферта' : 'Конфіденційність'})</h4>
                  <div className="form-group">
                    <label>Назва документа</label>
                    <input 
                      type="text" 
                      value={doc.title} 
                      onChange={e => {
                        const updated = [...legalDocs];
                        updated[index].title = e.target.value;
                        setLegalDocs(updated);
                      }} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Вміст документа</label>
                    <textarea 
                      rows={12}
                      value={doc.content} 
                      onChange={e => {
                        const updated = [...legalDocs];
                        updated[index].content = e.target.value;
                        setLegalDocs(updated);
                      }} 
                    />
                  </div>
                  <hr />
                </div>
              ))}

              <button 
                onClick={() => handleSave({ legalDocs })} 
                className="btn btn-primary"
                disabled={saveLoading}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти юридичні документи'}
              </button>
            </div>
          )}

          {/* Tab 6: Bookings */}
          {activeTab === 'bookings' && (
            <div className="admin-form-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <p className="section-desc" style={{ margin: 0 }}>Нижче наведено список усіх записів клієнтів. Ви можете оновлювати статус зустрічі та підтверджувати оплату.</p>
                <button 
                  onClick={() => {
                    setShowManualForm(!showManualForm);
                    if (services.length > 0 && !manualBooking.serviceId) {
                      setManualBooking(prev => ({ ...prev, serviceId: services[0].id }));
                    }
                  }} 
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  {showManualForm ? '✖️ Закрити форму' : '➕ Додати запис вручну'}
                </button>
              </div>

              {showManualForm && (
                <div style={{ padding: '2rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-bg)' }}>
                  <h4 style={{ marginBottom: '1.5rem', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }}>Новий запис (вручну з блокнота)</h4>
                  <form onSubmit={handleManualSubmit}>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>ПІБ клієнта</label>
                        <input 
                          type="text" 
                          required
                          value={manualBooking.clientName} 
                          onChange={e => setManualBooking({...manualBooking, clientName: e.target.value})} 
                          placeholder="Ім'я клієнта"
                        />
                      </div>
                      <div className="form-group">
                        <label>Телефон клієнта</label>
                        <input 
                          type="text" 
                          required
                          value={manualBooking.clientPhone} 
                          onChange={e => setManualBooking({...manualBooking, clientPhone: e.target.value})} 
                          placeholder="+380..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Email (опціонально)</label>
                        <input 
                          type="email" 
                          value={manualBooking.clientEmail} 
                          onChange={e => setManualBooking({...manualBooking, clientEmail: e.target.value})} 
                        />
                      </div>
                    </div>

                    <div className="form-grid mt-4">
                      <div className="form-group">
                        <label>Дата сесії</label>
                        <input 
                          type="date" 
                          required
                          value={manualBooking.date} 
                          onChange={e => setManualBooking({...manualBooking, date: e.target.value})} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Час сесії</label>
                        <select 
                          value={manualBooking.timeSlot} 
                          onChange={e => setManualBooking({...manualBooking, timeSlot: e.target.value})}
                        >
                          <option value="09:00">09:00</option>
                          <option value="10:30">10:30</option>
                          <option value="12:00">12:00</option>
                          <option value="14:00">14:00</option>
                          <option value="15:30">15:30</option>
                          <option value="17:00">17:00</option>
                          <option value="18:30">18:30</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Оберіть послугу</label>
                        <select 
                          value={manualBooking.serviceId} 
                          onChange={e => setManualBooking({...manualBooking, serviceId: parseInt(e.target.value)})}
                        >
                          {services.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.priceUah} грн)</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-grid mt-4">
                      <div className="form-group">
                        <label>Спосіб оплати</label>
                        <select 
                          value={manualBooking.paymentMethod} 
                          onChange={e => setManualBooking({...manualBooking, paymentMethod: e.target.value})}
                        >
                          <option value="IBAN">Реквізити ФОП (IBAN)</option>
                          <option value="MONO">Monobank / Картка</option>
                          <option value="PAYPAL">PayPal</option>
                          <option value="CASH">Готівка / Інше</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Статус оплати</label>
                        <select 
                          value={manualBooking.paymentStatus} 
                          onChange={e => setManualBooking({...manualBooking, paymentStatus: e.target.value})}
                        >
                          <option value="PENDING">⏳ Не оплачено</option>
                          <option value="PAID">✅ Оплачено</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Статус сесії</label>
                        <select 
                          value={manualBooking.status} 
                          onChange={e => setManualBooking({...manualBooking, status: e.target.value})}
                        >
                          <option value="PENDING">⏳ Очікує</option>
                          <option value="CONFIRMED">🤝 Підтверджено (зайняти слот)</option>
                          <option value="CANCELLED">❌ Скасовано</option>
                        </select>
                      </div>
                    </div>

                    <button type="submit" className="btn btn-primary mt-6">Створити та заблокувати слот</button>
                  </form>
                </div>
              )}

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Клієнт</th>
                      <th>Контакти</th>
                      <th>Послуга</th>
                      <th>Дата та час</th>
                      <th>Оплата</th>
                      <th>Статус сесії</th>
                      <th>Дія</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr key={b.id} className={`status-${b.status.toLowerCase()}`}>
                        <td>
                          <strong>{b.clientName}</strong>
                        </td>
                        <td>
                          <div className="text-small">{b.clientPhone}</div>
                          <div className="text-small text-muted">{b.clientEmail}</div>
                        </td>
                        <td>
                          <div>{b.service.name}</div>
                          <div className="text-small text-muted">{b.service.priceUah} грн</div>
                        </td>
                        <td>
                          <strong>{b.date}</strong>
                          <div className="text-small text-muted">{b.timeSlot}</div>
                        </td>
                        <td>
                          <select 
                            value={b.paymentStatus} 
                            onChange={e => updateBookingStatus(b.id, 'paymentStatus', e.target.value)}
                            className={`badge-select payment-${b.paymentStatus.toLowerCase()}`}
                          >
                            <option value="PENDING">⏳ Не оплачено</option>
                            <option value="PAID">✅ Оплачено ({b.paymentMethod})</option>
                          </select>
                        </td>
                        <td>
                          <select 
                            value={b.status} 
                            onChange={e => updateBookingStatus(b.id, 'status', e.target.value)}
                            className={`badge-select session-${b.status.toLowerCase()}`}
                          >
                            <option value="PENDING">⏳ Очікує</option>
                            <option value="CONFIRMED">🤝 Підтверджено</option>
                            <option value="CANCELLED">❌ Скасовано</option>
                          </select>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <a 
                              href={`https://wa.me/${b.clientPhone.replace(/\+/g, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-action whatsapp"
                              title="Написати у WhatsApp"
                            >
                              💬 WA
                            </a>
                            <a 
                              href={`https://t.me/${b.clientPhone.replace(/\+/g, '').replace(/^[0-9]/, '')}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn-action telegram"
                              title="Написати у Telegram"
                            >
                              ✈️ TG
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-muted">
                          Записів на консультації поки що немає.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
