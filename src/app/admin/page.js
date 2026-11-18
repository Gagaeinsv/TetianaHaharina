'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import MonthCalendarGrid, { formatUkDateLabel } from '@/components/MonthCalendarGrid';
import {
  getTelegramUrl,
  getTodayStr,
  getViberUrl,
  getWhatsappUrl,
  safeParseJsonArray,
  sortTimeSlots,
} from '@/lib/scheduleUtils';

const WEEKDAYS_LIST = [
  { id: 1, label: 'Пн' },
  { id: 2, label: 'Вт' },
  { id: 3, label: 'Ср' },
  { id: 4, label: 'Чт' },
  { id: 5, label: 'Пт' },
  { id: 6, label: 'Сб' },
  { id: 0, label: 'Нд' },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('bookings');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Profile & Content states
  const [profile, setProfile] = useState({
    name: '',
    title: '',
    subtitle: '',
    bio: '',
    experience: 0,
    phone: '',
    whatsapp: '',
    telegram: '',
    facebook: '',
    instagram: '',
    calendlyLink: '',
    bookingMode: 'INTERNAL',
  });
  const [specializations, setSpecializations] = useState([]);
  const [newSpecName, setNewSpecName] = useState('');
  const [newSpecDesc, setNewSpecDesc] = useState('');
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
  const [scheduleOverrides, setScheduleOverrides] = useState([]);

  // CRM Booking Filters & Draft Edits
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingDrafts, setBookingDrafts] = useState({});
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: 'manual@booking.com',
    clientNotes: '',
    date: getTodayStr(),
    timeSlot: '10:30',
    serviceId: '',
    paymentMethod: 'IBAN',
    status: 'CONFIRMED',
    paymentStatus: 'PENDING',
    meetingLink: '',
  });

  // Schedule Tab States
  const [workingDays, setWorkingDays] = useState([1, 2, 3, 4, 5, 6]);
  const [defaultSlots, setDefaultSlots] = useState([
    '09:00',
    '10:30',
    '12:00',
    '14:00',
    '15:30',
    '17:00',
    '18:30',
  ]);
  const [newDefaultSlot, setNewDefaultSlot] = useState('11:00');
  const [selectedSchedDate, setSelectedSchedDate] = useState(getTodayStr());
  const [overrideDrafts, setOverrideDrafts] = useState({});
  const [newExtraSlot, setNewExtraSlot] = useState('19:30');
  const [schedRefreshKey, setSchedRefreshKey] = useState(0);

  const buildDefaultOverride = (dateStr) => {
    const existing = scheduleOverrides.find((o) => o.date === dateStr);
    if (existing) {
      return {
        isDayOff: Boolean(existing.isDayOff),
        blockedSlots: safeParseJsonArray(existing.blockedSlots, []),
        extraSlots: safeParseJsonArray(existing.extraSlots, []),
        note: existing.note || '',
      };
    }
    const [y, m, d] = dateStr.split('-').map(Number);
    const weekday = new Date(y, m - 1, d).getDay();
    return {
      isDayOff: !workingDays.includes(weekday),
      blockedSlots: [],
      extraSlots: [],
      note: '',
    };
  };

  const dayOverrideForm = overrideDrafts[selectedSchedDate] || buildDefaultOverride(selectedSchedDate);
  const setDayOverrideForm = (updater) => {
    setOverrideDrafts((prev) => {
      const base = prev[selectedSchedDate] || buildDefaultOverride(selectedSchedDate);
      const nextVal = typeof updater === 'function' ? updater(base) : updater;
      return { ...prev, [selectedSchedDate]: nextVal };
    });
  };

  const showToast = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3500);
  };

  const applyAdminData = (data) => {
    if (data.profile) {
      setProfile({
        name: data.profile.name || '',
        title: data.profile.title || '',
        subtitle: data.profile.subtitle || '',
        bio: data.profile.bio || '',
        experience: data.profile.experience || 0,
        phone: data.profile.phone || '',
        whatsapp: data.profile.whatsapp || '',
        telegram: data.profile.telegram || '',
        facebook: data.profile.facebook || '',
        instagram: data.profile.instagram || '',
        calendlyLink: data.profile.calendlyLink || '',
        bookingMode: data.profile.bookingMode || 'INTERNAL',
      });
      setWorkingDays(safeParseJsonArray(data.profile.workingDays, [1, 2, 3, 4, 5, 6]));
      setDefaultSlots(
        sortTimeSlots(
          safeParseJsonArray(data.profile.defaultSlots, [
            '09:00',
            '10:30',
            '12:00',
            '14:00',
            '15:30',
            '17:00',
            '18:30',
          ])
        )
      );
      if (data.profile.specializations) {
        setSpecializations(
          data.profile.specializations.map((s) => ({
            name: s.name || '',
            description: s.description || '',
          }))
        );
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
      if (data.services.length > 0) {
        setManualBooking((prev) => ({ ...prev, serviceId: prev.serviceId || data.services[0].id }));
      }
    }
    if (data.legalDocs) setLegalDocs(data.legalDocs);
    if (data.bookings) {
      setBookings(data.bookings);
      const drafts = {};
      for (const b of data.bookings) {
        drafts[b.id] = {
          date: b.date,
          timeSlot: b.timeSlot,
          meetingLink: b.meetingLink || '',
          psychologistNote: b.psychologistNote || '',
        };
      }
      setBookingDrafts(drafts);
    }
    if (data.scheduleOverrides) {
      setScheduleOverrides(data.scheduleOverrides);
    }
  };

  const fetchData = async () => {
    setError('');
    try {
      const res = await fetch('/api/admin/content');
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      const data = await res.json();
      if (data.success) {
        applyAdminData(data);
      } else {
        setError(data.error || 'Помилка завантаження даних');
      }
    } catch {
      setError('Не вдалося з’єднатися з сервером');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const res = await fetch('/api/admin/content');
        if (!active) return;
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        if (!active) return;
        if (data.success) {
          applyAdminData(data);
        } else {
          setError(data.error || 'Помилка завантаження даних');
        }
      } catch {
        if (active) setError('Не вдалося з’єднатися з сервером');
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
    };
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const handleSaveContent = async (payload) => {
    setSaveLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Зміни збережено!');
        await fetchData();
      } else {
        setError(json.error || 'Помилка збереження даних');
      }
    } catch {
      setError('Помилка збереження змін');
    } finally {
      setSaveLoading(false);
    }
  };

  // CRM Booking Actions
  const updateBooking = async (id, fields) => {
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      });
      const json = await res.json();
      if (json.success && json.booking) {
        setBookings((prev) => prev.map((b) => (b.id === id ? json.booking : b)));
        showToast('Запис оновлено!');
        setSchedRefreshKey((k) => k + 1);
      } else {
        setError(json.error || 'Не вдалося оновити запис');
      }
    } catch {
      setError('Помилка з’єднання');
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm('Видалити цей запис остаточно?')) return;
    try {
      const res = await fetch(`/api/bookings?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        showToast('Запис видалено');
        setSchedRefreshKey((k) => k + 1);
      } else {
        setError(json.error || 'Помилка видалення');
      }
    } catch {
      setError('Помилка з’єднання');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualBooking),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Запис створено вручну!');
        setShowManualForm(false);
        setManualBooking((prev) => ({
          ...prev,
          clientName: '',
          clientPhone: '',
          clientNotes: '',
          meetingLink: '',
        }));
        await fetchData();
        setSchedRefreshKey((k) => k + 1);
      } else {
        setError(json.error || 'Не вдалося створити запис');
      }
    } catch {
      setError('Помилка створення запису');
    }
  };

  // Schedule Actions
  const saveDefaultSchedule = async () => {
    setSaveLoading(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DEFAULT',
          workingDays,
          defaultSlots,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Базовий графік збережено!');
        setSchedRefreshKey((k) => k + 1);
        await fetchData();
      } else {
        setError(json.error || 'Помилка збереження графіка');
      }
    } catch {
      setError('Помилка з’єднання');
    } finally {
      setSaveLoading(false);
    }
  };

  const saveDayOverride = async () => {
    setSaveLoading(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedSchedDate,
          ...dayOverrideForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Налаштування для ${selectedSchedDate} збережено!`);
        setOverrideDrafts((prev) => {
          const next = { ...prev };
          delete next[selectedSchedDate];
          return next;
        });
        setSchedRefreshKey((k) => k + 1);
        await fetchData();
      } else {
        setError(json.error || 'Помилка збереження дати');
      }
    } catch {
      setError('Помилка з’єднання');
    } finally {
      setSaveLoading(false);
    }
  };

  const resetDayOverride = async () => {
    try {
      const res = await fetch(`/api/schedule?date=${encodeURIComponent(selectedSchedDate)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Дату ${selectedSchedDate} повернуто до базового графіка`);
        setOverrideDrafts((prev) => {
          const next = { ...prev };
          delete next[selectedSchedDate];
          return next;
        });
        setSchedRefreshKey((k) => k + 1);
        await fetchData();
      }
    } catch {
      setError('Помилка скидання дня');
    }
  };

  if (loading) {
    return (
      <div className="adm-loading">
        <div className="spinner" />
        <p>Завантаження кабінету фахівчині...</p>
      </div>
    );
  }

  // Metrics Calculation
  const totalCount = bookings.length;
  const pendingCount = bookings.filter((b) => b.status === 'PENDING').length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const paidRevenue = bookings
    .filter((b) => b.paymentStatus === 'PAID')
    .reduce((acc, b) => acc + (b.service?.priceUah || 0), 0);

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchesQuery =
      !q ||
      b.clientName?.toLowerCase().includes(q) ||
      b.clientPhone?.toLowerCase().includes(q) ||
      b.clientEmail?.toLowerCase().includes(q) ||
      b.bookingCode?.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="adm-layout">
      {/* Sidebar */}
      <aside className="adm-sidebar">
        <div className="adm-sidebar-brand">
          <span className="adm-badge">Кабінет фахівчині</span>
          <h2>{profile.name || 'Адмін-панель'}</h2>
          <p>{profile.title}</p>
        </div>

        <nav className="adm-nav">
          <button
            className={activeTab === 'bookings' ? 'active' : ''}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Записи та CRM <span className="adm-nav-count">{totalCount}</span>
          </button>
          <button
            className={activeTab === 'schedule' ? 'active' : ''}
            onClick={() => setActiveTab('schedule')}
          >
            🗓️ Графік і Календар
          </button>
          <button
            className={activeTab === 'services' ? 'active' : ''}
            onClick={() => setActiveTab('services')}
          >
            💼 Послуги та Тарифи
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => setActiveTab('profile')}
          >
            👤 Профіль і Напрямки
          </button>
          <button
            className={activeTab === 'payments' ? 'active' : ''}
            onClick={() => setActiveTab('payments')}
          >
            💳 Оплата ФОП
          </button>
          <button
            className={activeTab === 'legal' ? 'active' : ''}
            onClick={() => setActiveTab('legal')}
          >
            📄 Оферта та Політика
          </button>
        </nav>

        <div className="adm-sidebar-foot">
          <Link href="/" className="adm-foot-link">
            🌐 Переглянути сайт
          </Link>
          <Link href="/cabinet" className="adm-foot-link">
            🔎 Кабінет клієнта
          </Link>
          <button type="button" onClick={handleLogout} className="adm-logout-btn">
            🚪 Вийти з акаунту
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="adm-main">
        <header className="adm-topbar">
          <h1>
            {activeTab === 'bookings' && 'Керування записами клієнтів'}
            {activeTab === 'schedule' && 'Графік прийому та Налаштування календаря'}
            {activeTab === 'services' && 'Послуги та Тарифи'}
            {activeTab === 'profile' && 'Профіль, Контакти та Спеціалізації'}
            {activeTab === 'payments' && 'Офіційні реквізити та Способи оплати'}
            {activeTab === 'legal' && 'Юридичні документи'}
          </h1>
          <div className="adm-topbar-status">
            {success && <span className="adm-toast-ok">{success}</span>}
            {error && <span className="adm-toast-err">{error}</span>}
          </div>
        </header>

        <div className="adm-content">
          {/* TAB 1: BOOKINGS CRM */}
          {activeTab === 'bookings' && (
            <div className="adm-panel">
              <div className="adm-metrics-grid">
                <div className="adm-metric-card">
                  <span>Усього записів</span>
                  <strong>{totalCount}</strong>
                </div>
                <div className="adm-metric-card accent">
                  <span>Очікують підтвердження</span>
                  <strong>{pendingCount}</strong>
                </div>
                <div className="adm-metric-card success">
                  <span>Підтверджені сесії</span>
                  <strong>{confirmedCount}</strong>
                </div>
                <div className="adm-metric-card">
                  <span>Підтверджена оплата</span>
                  <strong>{paidRevenue} грн</strong>
                </div>
              </div>

              <div className="adm-crm-controls">
                <div className="adm-filter-pills">
                  {[
                    { key: 'ALL', label: 'Усі' },
                    { key: 'PENDING', label: 'Очікують' },
                    { key: 'CONFIRMED', label: 'Підтверджені' },
                    { key: 'COMPLETED', label: 'Завершені' },
                    { key: 'CANCELLED', label: 'Скасовані' },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`adm-pill-btn ${statusFilter === f.key ? 'active' : ''}`}
                      onClick={() => setStatusFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="adm-crm-right">
                  <input
                    type="search"
                    placeholder="Пошук: ПІБ, телефон, код TG-..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="adm-search-input"
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowManualForm(!showManualForm)}
                  >
                    {showManualForm ? '✕ Закрити форму' : '+ Додати запис вручну'}
                  </button>
                </div>
              </div>

              {showManualForm && (
                <form onSubmit={handleManualSubmit} className="adm-manual-box">
                  <h3>Новий запис (додати вручну)</h3>
                  <div className="adm-form-grid">
                    <div className="adm-field">
                      <label>Ім’я клієнта *</label>
                      <input
                        type="text"
                        required
                        value={manualBooking.clientName}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, clientName: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>Телефон *</label>
                      <input
                        type="text"
                        required
                        placeholder="+380..."
                        value={manualBooking.clientPhone}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, clientPhone: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>Email</label>
                      <input
                        type="email"
                        value={manualBooking.clientEmail}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, clientEmail: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>Послуга *</label>
                      <select
                        value={manualBooking.serviceId}
                        onChange={(e) =>
                          setManualBooking({
                            ...manualBooking,
                            serviceId: parseInt(e.target.value, 10),
                          })
                        }
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.priceUah} грн)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="adm-field">
                      <label>Дата *</label>
                      <input
                        type="date"
                        required
                        value={manualBooking.date}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, date: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>Час *</label>
                      <input
                        type="time"
                        required
                        value={manualBooking.timeSlot}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, timeSlot: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>Статус запису</label>
                      <select
                        value={manualBooking.status}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, status: e.target.value })
                        }
                      >
                        <option value="PENDING">Очікує</option>
                        <option value="CONFIRMED">Підтверджено</option>
                      </select>
                    </div>
                    <div className="adm-field">
                      <label>Оплата</label>
                      <select
                        value={manualBooking.paymentStatus}
                        onChange={(e) =>
                          setManualBooking({ ...manualBooking, paymentStatus: e.target.value })
                        }
                      >
                        <option value="PENDING">Очікує оплати</option>
                        <option value="PAID">Оплачено</option>
                      </select>
                    </div>
                  </div>
                  <div className="adm-field" style={{ marginTop: '0.75rem' }}>
                    <label>Посилання на зустріч (опціонально)</label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={manualBooking.meetingLink}
                      onChange={(e) =>
                        setManualBooking({ ...manualBooking, meetingLink: e.target.value })
                      }
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Створити запис
                  </button>
                </form>
              )}

              <div className="adm-bookings-list">
                {filteredBookings.length === 0 ? (
                  <div className="adm-empty">Записів за обраним фільтром не знайдено.</div>
                ) : (
                  filteredBookings.map((b) => {
                    const draft = bookingDrafts[b.id] || {
                      date: b.date,
                      timeSlot: b.timeSlot,
                      meetingLink: b.meetingLink || '',
                      psychologistNote: b.psychologistNote || '',
                    };
                    return (
                      <div key={b.id} className={`adm-booking-card st-${b.status.toLowerCase()}`}>
                        <div className="adm-bk-head">
                          <div className="adm-bk-title">
                            {b.bookingCode && <span className="adm-code">{b.bookingCode}</span>}
                            <strong>{b.clientName}</strong>
                            <span className="adm-bk-service">
                              {b.service?.name} • {b.service?.priceUah} грн ({b.paymentMethod})
                            </span>
                          </div>
                          <div className="adm-bk-selects">
                            <select
                              value={b.status}
                              onChange={(e) => updateBooking(b.id, { status: e.target.value })}
                              className={`adm-sel-status st-${b.status.toLowerCase()}`}
                            >
                              <option value="PENDING">⏳ Очікує</option>
                              <option value="CONFIRMED">✅ Підтверджено</option>
                              <option value="COMPLETED">🏁 Завершено</option>
                              <option value="CANCELLED">✕ Скасовано</option>
                            </select>

                            <select
                              value={b.paymentStatus}
                              onChange={(e) => updateBooking(b.id, { paymentStatus: e.target.value })}
                              className={`adm-sel-pay pay-${b.paymentStatus.toLowerCase()}`}
                            >
                              <option value="PENDING">⏳ Не оплачено</option>
                              <option value="PAID">💳 Оплачено</option>
                            </select>
                          </div>
                        </div>

                        <div className="adm-bk-contacts">
                          <span>📞 {b.clientPhone}</span>
                          <span>✉️ {b.clientEmail}</span>
                          {b.clientTelegram && <span>💬 {b.clientTelegram}</span>}
                          <div className="adm-quick-msgs">
                            <a
                              href={getTelegramUrl(b.clientPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Telegram
                            </a>
                            <a
                              href={getViberUrl(b.clientPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Viber
                            </a>
                            <a
                              href={getWhatsappUrl(b.clientPhone)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              WhatsApp
                            </a>
                          </div>
                        </div>

                        {b.clientNotes && (
                          <div className="adm-bk-client-note">
                            <strong>Коментар / запит клієнта:</strong> {b.clientNotes}
                          </div>
                        )}

                        <div className="adm-bk-edit-grid">
                          <div className="adm-field">
                            <label>Дата сесії</label>
                            <input
                              type="date"
                              value={draft.date}
                              onChange={(e) =>
                                setBookingDrafts({
                                  ...bookingDrafts,
                                  [b.id]: { ...draft, date: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div className="adm-field">
                            <label>Час</label>
                            <input
                              type="time"
                              value={draft.timeSlot}
                              onChange={(e) =>
                                setBookingDrafts({
                                  ...bookingDrafts,
                                  [b.id]: { ...draft, timeSlot: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div className="adm-field">
                            <label>Посилання на відеозустріч (Zoom / Meet — бачить клієнт)</label>
                            <input
                              type="url"
                              placeholder="https://zoom.us/j/... або https://meet.google.com/..."
                              value={draft.meetingLink}
                              onChange={(e) =>
                                setBookingDrafts({
                                  ...bookingDrafts,
                                  [b.id]: { ...draft, meetingLink: e.target.value },
                                })
                              }
                            />
                          </div>
                          <div className="adm-field">
                            <label>Повідомлення для клієнта в кабінеті</label>
                            <input
                              type="text"
                              placeholder="Наприклад: Чекаю на вас о 14:00, підготуйте спокійне місце"
                              value={draft.psychologistNote}
                              onChange={(e) =>
                                setBookingDrafts({
                                  ...bookingDrafts,
                                  [b.id]: { ...draft, psychologistNote: e.target.value },
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="adm-bk-foot">
                          <button
                            type="button"
                            className="btn btn-primary adm-btn-sm"
                            onClick={() => updateBooking(b.id, draft)}
                          >
                            Зберегти деталі зустрічі
                          </button>
                          <button
                            type="button"
                            className="adm-del-btn"
                            onClick={() => deleteBooking(b.id)}
                          >
                            Видалити запис
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SCHEDULE & CALENDAR */}
          {activeTab === 'schedule' && (
            <div className="adm-panel adm-stack">
              {/* Booking Mode */}
              <section className="adm-card">
                <h3>Режим онлайн-запису на сайті</h3>
                <div className="adm-form-grid">
                  <div className="adm-field">
                    <label>Спосіб бронювання</label>
                    <select
                      value={profile.bookingMode}
                      onChange={(e) => setProfile({ ...profile, bookingMode: e.target.value })}
                    >
                      <option value="INTERNAL">Тільки власний календар сайту</option>
                      <option value="BOTH">Власний календар + опція Calendly</option>
                      <option value="CALENDLY">Тільки Calendly</option>
                    </select>
                  </div>
                  <div className="adm-field">
                    <label>Загальне посилання Calendly (якщо використовується)</label>
                    <input
                      type="url"
                      placeholder="https://calendly.com/..."
                      value={profile.calendlyLink}
                      onChange={(e) => setProfile({ ...profile, calendlyLink: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={saveLoading}
                  onClick={() => handleSaveContent({ profile })}
                  className="btn btn-secondary adm-btn-sm"
                  style={{ marginTop: '0.75rem' }}
                >
                  Зберегти режим бронювання
                </button>
              </section>

              {/* Default Weekly Schedule */}
              <section className="adm-card">
                <h3>Базовий графік роботи (тижневий шаблон)</h3>
                <div className="adm-weekdays-row">
                  {WEEKDAYS_LIST.map((wd) => {
                    const checked = workingDays.includes(wd.id);
                    return (
                      <label key={wd.id} className={`adm-wd-chip ${checked ? 'active' : ''}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setWorkingDays((prev) =>
                              prev.includes(wd.id)
                                ? prev.filter((d) => d !== wd.id)
                                : [...prev, wd.id]
                            );
                          }}
                        />
                        <span>{wd.label}</span>
                      </label>
                    );
                  })}
                </div>

                <label className="adm-label-block" style={{ marginTop: '1.25rem' }}>
                  Стандартні години прийому:
                </label>
                <div className="adm-slots-chips">
                  {defaultSlots.map((slot) => (
                    <span key={slot} className="adm-slot-chip">
                      {slot}
                      <button
                        type="button"
                        onClick={() => setDefaultSlots((prev) => prev.filter((s) => s !== slot))}
                        aria-label={`Видалити ${slot}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="adm-inline-add">
                  <input
                    type="time"
                    value={newDefaultSlot}
                    onChange={(e) => setNewDefaultSlot(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary adm-btn-sm"
                    onClick={() => {
                      if (newDefaultSlot && !defaultSlots.includes(newDefaultSlot)) {
                        setDefaultSlots((prev) => sortTimeSlots([...prev, newDefaultSlot]));
                      }
                    }}
                  >
                    + Додати годину
                  </button>
                  <button
                    type="button"
                    disabled={saveLoading}
                    className="btn btn-primary adm-btn-sm"
                    onClick={saveDefaultSchedule}
                  >
                    Зберегти базовий графік
                  </button>
                </div>
              </section>

              {/* Date-specific Overrides */}
              <section className="adm-card">
                <h3>Винятки по конкретних датах (вихідні, закриття окремих годин)</h3>
                <div className="adm-sched-split">
                  <div>
                    <MonthCalendarGrid
                      selectedDate={selectedSchedDate}
                      onSelectDate={(d) => setSelectedSchedDate(d)}
                      allowPastOrOff={true}
                      refreshKey={schedRefreshKey}
                    />
                  </div>
                  <div className="adm-sched-editor">
                    <h4>Налаштування на {formatUkDateLabel(selectedSchedDate)}</h4>

                    <label className="adm-toggle-check">
                      <input
                        type="checkbox"
                        checked={dayOverrideForm.isDayOff}
                        onChange={(e) =>
                          setDayOverrideForm({ ...dayOverrideForm, isDayOff: e.target.checked })
                        }
                      />
                      <span>Зробити цей день вихідним (прийом закрито)</span>
                    </label>

                    {!dayOverrideForm.isDayOff && (
                      <>
                        <p className="adm-help">
                          Натисніть на годину нижче, щоб тимчасово закрити/відкрити її саме для цієї дати:
                        </p>
                        <div className="adm-day-slots-grid">
                          {sortTimeSlots([...defaultSlots, ...dayOverrideForm.extraSlots]).map(
                            (slot) => {
                              const isBlocked = dayOverrideForm.blockedSlots.includes(slot);
                              const isExtra = !defaultSlots.includes(slot);
                              return (
                                <button
                                  type="button"
                                  key={slot}
                                  className={`adm-day-slot-btn ${isBlocked ? 'blocked' : 'open'}`}
                                  onClick={() => {
                                    if (isExtra) {
                                      setDayOverrideForm((prev) => ({
                                        ...prev,
                                        extraSlots: prev.extraSlots.filter((s) => s !== slot),
                                      }));
                                    } else {
                                      setDayOverrideForm((prev) => ({
                                        ...prev,
                                        blockedSlots: prev.blockedSlots.includes(slot)
                                          ? prev.blockedSlots.filter((s) => s !== slot)
                                          : [...prev.blockedSlots, slot],
                                      }));
                                    }
                                  }}
                                >
                                  <span>{slot}</span>
                                  <small>{isBlocked ? 'Закрито' : isExtra ? 'Додатково ×' : 'Відкрито'}</small>
                                </button>
                              );
                            }
                          )}
                        </div>

                        <div className="adm-inline-add">
                          <input
                            type="time"
                            value={newExtraSlot}
                            onChange={(e) => setNewExtraSlot(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn btn-secondary adm-btn-sm"
                            onClick={() => {
                              if (
                                newExtraSlot &&
                                !defaultSlots.includes(newExtraSlot) &&
                                !dayOverrideForm.extraSlots.includes(newExtraSlot)
                              ) {
                                setDayOverrideForm((prev) => ({
                                  ...prev,
                                  extraSlots: sortTimeSlots([...prev.extraSlots, newExtraSlot]),
                                }));
                              }
                            }}
                          >
                            + Додатковий слот на цей день
                          </button>
                        </div>
                      </>
                    )}

                    <div className="adm-field" style={{ marginTop: '1rem' }}>
                      <label>Примітка (напр. «Навчання», «Відпустка»)</label>
                      <input
                        type="text"
                        value={dayOverrideForm.note}
                        onChange={(e) =>
                          setDayOverrideForm({ ...dayOverrideForm, note: e.target.value })
                        }
                      />
                    </div>

                    <div className="adm-inline-actions">
                      <button
                        type="button"
                        disabled={saveLoading}
                        className="btn btn-primary adm-btn-sm"
                        onClick={saveDayOverride}
                      >
                        Зберегти налаштування дати
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary adm-btn-sm"
                        onClick={resetDayOverride}
                      >
                        Скинути до базового
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: SERVICES */}
          {activeTab === 'services' && (
            <div className="adm-panel adm-stack">
              {services.map((s, idx) => (
                <div key={s.id || idx} className="adm-card">
                  <div className="adm-card-head">
                    <h3>Послуга №{idx + 1}</h3>
                    <button
                      type="button"
                      className="adm-del-btn"
                      onClick={() => setServices(services.filter((_, i) => i !== idx))}
                    >
                      Видалити
                    </button>
                  </div>
                  <div className="adm-form-grid">
                    <div className="adm-field">
                      <label>Назва послуги</label>
                      <input
                        type="text"
                        value={s.name}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx].name = e.target.value;
                          setServices(next);
                        }}
                      />
                    </div>
                    <div className="adm-field">
                      <label>Категорія</label>
                      <select
                        value={s.category || 'INDIVIDUAL'}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx].category = e.target.value;
                          setServices(next);
                        }}
                      >
                        <option value="INDIVIDUAL">Індивідуальна</option>
                        <option value="FAMILY">Сімейна / Дитячо-батьківська</option>
                        <option value="SUPERVISION">Супервізія / Інтервізія</option>
                      </select>
                    </div>
                    <div className="adm-field">
                      <label>Тривалість (хв)</label>
                      <input
                        type="number"
                        value={s.duration}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx].duration = parseInt(e.target.value, 10) || 0;
                          setServices(next);
                        }}
                      />
                    </div>
                    <div className="adm-field">
                      <label>Вартість (грн)</label>
                      <input
                        type="number"
                        value={s.priceUah}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx].priceUah = parseInt(e.target.value, 10) || 0;
                          setServices(next);
                        }}
                      />
                    </div>
                  </div>
                  <div className="adm-field" style={{ marginTop: '0.75rem' }}>
                    <label>Опис</label>
                    <textarea
                      rows={3}
                      value={s.description}
                      onChange={(e) => {
                        const next = [...services];
                        next[idx].description = e.target.value;
                        setServices(next);
                      }}
                    />
                  </div>
                  <div className="adm-form-grid" style={{ marginTop: '0.75rem' }}>
                    <div className="adm-field">
                      <label>Окреме посилання Calendly для послуги (опціонально)</label>
                      <input
                        type="url"
                        value={s.calendlyLink || ''}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx].calendlyLink = e.target.value;
                          setServices(next);
                        }}
                      />
                    </div>
                    <label className="adm-toggle-check" style={{ alignSelf: 'end', paddingBottom: '0.5rem' }}>
                      <input
                        type="checkbox"
                        checked={s.isActive !== false}
                        onChange={(e) => {
                          const next = [...services];
                          next[idx].isActive = e.target.checked;
                          setServices(next);
                        }}
                      />
                      <span>Активна (показувати на сайті)</span>
                    </label>
                  </div>
                </div>
              ))}

              <div className="adm-inline-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    setServices([
                      ...services,
                      {
                        name: 'Нова консультація',
                        description: '',
                        duration: 50,
                        priceUah: 1200,
                        category: 'INDIVIDUAL',
                        calendlyLink: '',
                        isActive: true,
                      },
                    ])
                  }
                >
                  + Додати послугу
                </button>
                <button
                  type="button"
                  disabled={saveLoading}
                  className="btn btn-primary"
                  onClick={() => handleSaveContent({ services })}
                >
                  {saveLoading ? 'Збереження...' : 'Зберегти всі послуги'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PROFILE & SPECIALIZATIONS */}
          {activeTab === 'profile' && (
            <div className="adm-panel adm-stack">
              <section className="adm-card">
                <h3>Основна інформація та Контакти</h3>
                <div className="adm-form-grid">
                  <div className="adm-field">
                    <label>Ім’я та Прізвище</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Статус / Заголовок у шапці</label>
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Підзаголовок</label>
                    <input
                      type="text"
                      value={profile.subtitle}
                      onChange={(e) => setProfile({ ...profile, subtitle: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Років досвіду</label>
                    <input
                      type="number"
                      value={profile.experience}
                      onChange={(e) =>
                        setProfile({ ...profile, experience: parseInt(e.target.value, 10) || 0 })
                      }
                    />
                  </div>
                  <div className="adm-field">
                    <label>Телефон (Україна / Viber)</label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>WhatsApp</label>
                    <input
                      type="text"
                      value={profile.whatsapp}
                      onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Telegram (@нік або +телефон)</label>
                    <input
                      type="text"
                      value={profile.telegram}
                      onChange={(e) => setProfile({ ...profile, telegram: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Facebook URL</label>
                    <input
                      type="url"
                      value={profile.facebook}
                      onChange={(e) => setProfile({ ...profile, facebook: e.target.value })}
                    />
                  </div>
                  <div className="adm-field">
                    <label>Instagram URL (опціонально)</label>
                    <input
                      type="url"
                      value={profile.instagram}
                      onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
                    />
                  </div>
                </div>
                <div className="adm-field" style={{ marginTop: '0.75rem' }}>
                  <label>Про себе (біографія та досвід)</label>
                  <textarea
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  />
                </div>
              </section>

              <section className="adm-card">
                <h3>Напрямки роботи та запити</h3>
                <div className="adm-stack">
                  {specializations.map((spec, idx) => (
                    <div key={idx} className="adm-spec-row">
                      <div className="adm-spec-fields">
                        <input
                          type="text"
                          value={spec.name}
                          placeholder="Назва напрямку"
                          onChange={(e) => {
                            const next = [...specializations];
                            next[idx].name = e.target.value;
                            setSpecializations(next);
                          }}
                        />
                        <textarea
                          rows={2}
                          value={spec.description}
                          placeholder="Опис запиту..."
                          onChange={(e) => {
                            const next = [...specializations];
                            next[idx].description = e.target.value;
                            setSpecializations(next);
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        className="adm-del-btn"
                        onClick={() =>
                          setSpecializations(specializations.filter((_, i) => i !== idx))
                        }
                      >
                        Видалити
                      </button>
                    </div>
                  ))}
                </div>

                <div className="adm-manual-box" style={{ marginTop: '1rem' }}>
                  <div className="adm-form-grid">
                    <div className="adm-field">
                      <label>Додати новий напрямок</label>
                      <input
                        type="text"
                        placeholder="Назва напрямку"
                        value={newSpecName}
                        onChange={(e) => setNewSpecName(e.target.value)}
                      />
                    </div>
                    <div className="adm-field">
                      <label>Короткий опис</label>
                      <input
                        type="text"
                        placeholder="З чим допомагаєте..."
                        value={newSpecDesc}
                        onChange={(e) => setNewSpecDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary adm-btn-sm"
                    style={{ marginTop: '0.75rem' }}
                    onClick={() => {
                      if (newSpecName.trim()) {
                        setSpecializations([
                          ...specializations,
                          { name: newSpecName.trim(), description: newSpecDesc.trim() },
                        ]);
                        setNewSpecName('');
                        setNewSpecDesc('');
                      }
                    }}
                  >
                    + Додати напрямок
                  </button>
                </div>
              </section>

              <button
                type="button"
                disabled={saveLoading}
                className="btn btn-primary"
                onClick={() => handleSaveContent({ profile, specializations })}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти профіль і напрямки'}
              </button>
            </div>
          )}

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="adm-panel adm-stack">
              <div className="adm-card">
                <h3>Методи оплати та Реквізити ФОП</h3>
                <div className="adm-stack">
                  <label className="adm-toggle-check">
                    <input
                      type="checkbox"
                      checked={paymentSettings.useIban}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, useIban: e.target.checked })
                      }
                    />
                    <span>Оплата на рахунок ФОП (IBAN)</span>
                  </label>
                  <div className="adm-form-grid">
                    <div className="adm-field">
                      <label>IBAN</label>
                      <input
                        type="text"
                        value={paymentSettings.iban}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, iban: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>ЄДРПОУ / ІПН</label>
                      <input
                        type="text"
                        value={paymentSettings.edrpou}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, edrpou: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>Назва банку</label>
                      <input
                        type="text"
                        value={paymentSettings.bankName}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, bankName: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <hr />

                  <label className="adm-toggle-check">
                    <input
                      type="checkbox"
                      checked={paymentSettings.useMono}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, useMono: e.target.checked })
                      }
                    />
                    <span>Оплата карткою через Monobank посилання</span>
                  </label>
                  <div className="adm-field">
                    <label>Посилання на оплату (Monobank / WayForPay)</label>
                    <input
                      type="url"
                      value={paymentSettings.monoLink}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, monoLink: e.target.value })
                      }
                    />
                  </div>

                  <hr />

                  <label className="adm-toggle-check">
                    <input
                      type="checkbox"
                      checked={paymentSettings.usePaypal}
                      onChange={(e) =>
                        setPaymentSettings({ ...paymentSettings, usePaypal: e.target.checked })
                      }
                    />
                    <span>Міжнародні перекази PayPal</span>
                  </label>
                  <div className="adm-form-grid">
                    <div className="adm-field">
                      <label>PayPal Email</label>
                      <input
                        type="email"
                        value={paymentSettings.paypalEmail}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, paypalEmail: e.target.value })
                        }
                      />
                    </div>
                    <div className="adm-field">
                      <label>PayPal.Me URL (опціонально)</label>
                      <input
                        type="url"
                        value={paymentSettings.paypalLink}
                        onChange={(e) =>
                          setPaymentSettings({ ...paymentSettings, paypalLink: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={saveLoading}
                className="btn btn-primary"
                onClick={() => handleSaveContent({ paymentSettings })}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти налаштування оплати'}
              </button>
            </div>
          )}

          {/* TAB 6: LEGAL */}
          {activeTab === 'legal' && (
            <div className="adm-panel adm-stack">
              {legalDocs.map((doc, idx) => (
                <div key={doc.id || idx} className="adm-card">
                  <h3>{doc.type === 'OFFER' ? 'Публічна оферта' : 'Політика конфіденційності'}</h3>
                  <div className="adm-field">
                    <label>Заголовок документа</label>
                    <input
                      type="text"
                      value={doc.title}
                      onChange={(e) => {
                        const next = [...legalDocs];
                        next[idx].title = e.target.value;
                        setLegalDocs(next);
                      }}
                    />
                  </div>
                  <div className="adm-field" style={{ marginTop: '0.75rem' }}>
                    <label>Текст документа</label>
                    <textarea
                      rows={10}
                      value={doc.content}
                      onChange={(e) => {
                        const next = [...legalDocs];
                        next[idx].content = e.target.value;
                        setLegalDocs(next);
                      }}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                disabled={saveLoading}
                className="btn btn-primary"
                onClick={() => handleSaveContent({ legalDocs })}
              >
                {saveLoading ? 'Збереження...' : 'Зберегти документи'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
