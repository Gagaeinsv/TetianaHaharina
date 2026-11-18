'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import MonthCalendarGrid, { formatUkDateLabel } from '@/components/MonthCalendarGrid';
import PaymentDetailsBlock from '@/components/PaymentDetailsBlock';
import { getTodayStr, getTelegramUrl, getViberUrl, getWhatsappUrl } from '@/lib/scheduleUtils';

const STATUS_MAP = {
  PENDING: { label: 'Очікує підтвердження', cls: 'st-pending' },
  CONFIRMED: { label: 'Підтверджено', cls: 'st-confirmed' },
  COMPLETED: { label: 'Завершено', cls: 'st-completed' },
  CANCELLED: { label: 'Скасовано', cls: 'st-cancelled' },
};

const PAY_MAP = {
  PENDING: { label: 'Очікує оплати', cls: 'pay-pending' },
  PAID: { label: 'Оплачено ✓', cls: 'pay-paid' },
};

export default function ClientCabinetPage() {
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialChecked, setInitialChecked] = useState(false);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [expandedPayId, setExpandedPayId] = useState(null);

  // Reschedule modal state
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [newDayInfo, setNewDayInfo] = useState(null);
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const performLookup = async (searchVal) => {
    const clean = String(searchVal || '').trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    setActionMsg('');
    try {
      const res = await fetch(`/api/client/bookings?query=${encodeURIComponent(clean)}`);
      const json = await res.json();
      if (json.success) {
        setBookings(json.bookings || []);
        setProfile(json.profile || null);
        setActiveQuery(clean);
        try {
          const prev = JSON.parse(localStorage.getItem('psy_client_lookup') || '{}');
          localStorage.setItem('psy_client_lookup', JSON.stringify({ ...prev, query: clean }));
        } catch {}
      } else {
        setError(json.error || 'Не вдалося знайти записи');
      }
    } catch {
      setError('Помилка з’єднання з сервером');
    } finally {
      setLoading(false);
      setInitialChecked(true);
    }
  };

  useEffect(() => {
    let active = true;
    async function initCabinet() {
      let savedQuery = '';
      try {
        const raw = localStorage.getItem('psy_client_lookup');
        if (raw) {
          const parsed = JSON.parse(raw);
          savedQuery = parsed.query || parsed.code || parsed.phone || parsed.email || '';
        }
      } catch {}

      if (savedQuery) {
        try {
          const res = await fetch(`/api/client/bookings?query=${encodeURIComponent(savedQuery)}`);
          const json = await res.json();
          if (active && json.success) {
            setQueryInput(savedQuery);
            setBookings(json.bookings || []);
            setProfile(json.profile || null);
            setActiveQuery(savedQuery);
          }
        } catch {
          // ignore initial auto-lookup error
        } finally {
          if (active) setInitialChecked(true);
        }
      } else {
        try {
          const res = await fetch('/api/content');
          const json = await res.json();
          if (active && json.success && json.profile) setProfile(json.profile);
        } catch {
          // ignore
        } finally {
          if (active) setInitialChecked(true);
        }
      }
    }
    initCabinet();
    return () => {
      active = false;
    };
  }, []);

  const handleLogoutClient = () => {
    try {
      localStorage.removeItem('psy_client_lookup');
    } catch {}
    setActiveQuery('');
    setQueryInput('');
    setBookings([]);
    setActionMsg('');
    setError('');
  };

  const handleBookingPatch = async (payload) => {
    setActionLoading(true);
    setError('');
    setActionMsg('');
    try {
      const res = await fetch('/api/client/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          verifyQuery: activeQuery,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setActionMsg(json.message || 'Операцію виконано');
        setRescheduleTarget(null);
        await performLookup(activeQuery);
      } else {
        setError(json.error || 'Не вдалося виконати дію');
      }
    } catch {
      setError('Помилка з’єднання з сервером');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectRescheduleDate = async (dateStr, preloaded) => {
    setNewDate(dateStr);
    setNewTimeSlot('');
    if (preloaded) setNewDayInfo(preloaded);
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/schedule?date=${dateStr}`);
      const json = await res.json();
      if (json.success) setNewDayInfo(json);
    } catch {}
    setLoadingSlots(false);
  };

  const today = getTodayStr();
  const upcomingBookings = bookings.filter(
    (b) => b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.date >= today
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'CANCELLED' || b.status === 'COMPLETED' || b.date < today
  );

  return (
    <div className="cab-page">
      <header className="cab-header">
        <div className="container cab-header-inner">
          <Link href="/" className="cab-brand">
            <span className="cab-brand-name">{profile?.name || 'Гагаріна Тетяна'}</span>
            <span className="cab-brand-sub">Особистий кабінет клієнта</span>
          </Link>
          <div className="cab-header-actions">
            <Link href="/" className="btn btn-secondary cab-btn-sm">
              ← На головну
            </Link>
            {activeQuery && (
              <button type="button" onClick={handleLogoutClient} className="cab-logout-btn">
                Змінити контакт
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container cab-main">
        {/* Search / Sign-in Card */}
        <section className="cab-lookup-card">
          <div className="cab-lookup-text">
            <span className="cab-pill">Доступ до ваших консультацій</span>
            <h1>Особистий кабінет клієнта</h1>
            <p>
              Введіть номер телефону, Email або код бронювання (наприклад <code>TG-1234</code>), щоб
              побачити час сесій, отримати посилання на відеозустріч, переглянути реквізити чи перенести консультацію.
            </p>
          </div>

          <form
            className="cab-lookup-form"
            onSubmit={(e) => {
              e.preventDefault();
              performLookup(queryInput);
            }}
          >
            <input
              type="text"
              placeholder="+38067... або email@gmail.com або TG-1234"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Пошук...' : 'Знайти мої сесії'}
            </button>
          </form>

          {error && <div className="cab-alert cab-alert-err">{error}</div>}
          {actionMsg && <div className="cab-alert cab-alert-ok">{actionMsg}</div>}
        </section>

        {initialChecked && activeQuery && (
          <div className="cab-content-area">
            {bookings.length === 0 ? (
              <div className="cab-empty-state">
                <h3>Записів за запитом «{activeQuery}» поки не знайдено</h3>
                <p>
                  Перевірте правильність номера телефону, Email чи коду запису, або оберіть зручний час для першої зустрічі.
                </p>
                <Link href="/#booking" className="btn btn-primary">
                  Записатися на консультацію
                </Link>
              </div>
            ) : (
              <>
                <div className="cab-toolbar">
                  <div>
                    <h2>Ваші консультації ({bookings.length})</h2>
                    <p className="cab-sub">Пошук за контактом: <strong>{activeQuery}</strong></p>
                  </div>
                  <div className="cab-toolbar-links">
                    <a
                      href={getTelegramUrl(profile?.telegram || profile?.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary cab-btn-sm"
                    >
                      ✈️ Написати в Telegram
                    </a>
                    <Link href="/#booking" className="btn btn-primary cab-btn-sm">
                      + Записатися ще
                    </Link>
                  </div>
                </div>

                {/* Upcoming Sessions */}
                <div className="cab-section">
                  <h3 className="cab-sec-title">Заплановані та найближчі сесії</h3>
                  {upcomingBookings.length === 0 ? (
                    <div className="cab-empty-mini">
                      Немає активних майбутніх сесій. Ви можете{' '}
                      <Link href="/#booking">обрати зручний час у календарі</Link>.
                    </div>
                  ) : (
                    <div className="cab-cards-list">
                      {upcomingBookings.map((b) => {
                        const st = STATUS_MAP[b.status] || STATUS_MAP.PENDING;
                        const py = PAY_MAP[b.paymentStatus] || PAY_MAP.PENDING;
                        const showPay = expandedPayId === b.id;
                        const alreadyReportedPay = b.clientNotes?.includes('Клієнт повідомив про оплату');

                        return (
                          <article key={b.id} className="cab-session-card">
                            <div className="cab-card-top">
                              <div className="cab-badges">
                                {b.bookingCode && <span className="cab-code-badge">{b.bookingCode}</span>}
                                <span className={`cab-status-badge ${st.cls}`}>{st.label}</span>
                                <span className={`cab-pay-badge ${py.cls}`}>{py.label}</span>
                              </div>
                              <div className="cab-price">{b.service?.priceUah} грн</div>
                            </div>

                            <div className="cab-card-body">
                              <h4>{b.service?.name}</h4>
                              <div className="cab-meta-row">
                                <span>🗓️ {formatUkDateLabel(b.date)}</span>
                                <span>⏰ {b.timeSlot}</span>
                                <span>⏱️ {b.service?.duration || 50} хв</span>
                              </div>

                              {/* Meeting Link Box */}
                              <div className="cab-meeting-box">
                                {b.meetingLink ? (
                                  <div className="cab-meeting-ready">
                                    <div>
                                      <strong>🎥 Посилання на відеозустріч готове</strong>
                                      <span>Підключіться за 2–3 хвилини до початку сесії</span>
                                    </div>
                                    <a
                                      href={b.meetingLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="btn btn-primary"
                                    >
                                      Приєднатися до сесії →
                                    </a>
                                  </div>
                                ) : (
                                  <div className="cab-meeting-wait">
                                    🔗 Посилання на Zoom / Google Meet з’явиться тут після підтвердження
                                    консультації психологинею.
                                  </div>
                                )}
                              </div>

                              {b.psychologistNote && (
                                <div className="cab-psy-note">
                                  <strong>💬 Повідомлення від психологині:</strong>
                                  <p>{b.psychologistNote}</p>
                                </div>
                              )}
                            </div>

                            <div className="cab-card-actions">
                              {b.paymentStatus !== 'PAID' && (
                                <>
                                  <button
                                    type="button"
                                    className="btn btn-secondary cab-btn-sm"
                                    onClick={() => setExpandedPayId(showPay ? null : b.id)}
                                  >
                                    {showPay ? 'Приховати реквізити' : '💳 Реквізити для оплати'}
                                  </button>
                                  {!alreadyReportedPay ? (
                                    <button
                                      type="button"
                                      disabled={actionLoading}
                                      className="btn btn-primary cab-btn-sm"
                                      onClick={() =>
                                        handleBookingPatch({ id: b.id, action: 'MARK_PAYMENT_SENT' })
                                      }
                                    >
                                      ✓ Я оплатив(ла) сесію
                                    </button>
                                  ) : (
                                    <span className="cab-reported-pill">✓ Повідомлення про оплату надіслано</span>
                                  )}
                                </>
                              )}

                              <button
                                type="button"
                                className="btn btn-secondary cab-btn-sm"
                                onClick={() => {
                                  setRescheduleTarget(b);
                                  setNewDate('');
                                  setNewTimeSlot('');
                                  setNewDayInfo(null);
                                }}
                              >
                                🗓️ Перенести час
                              </button>

                              <button
                                type="button"
                                disabled={actionLoading}
                                className="cab-cancel-btn"
                                onClick={() => {
                                  if (window.confirm('Ви впевнені, що бажаєте скасувати цей запис?')) {
                                    handleBookingPatch({ id: b.id, action: 'CANCEL' });
                                  }
                                }}
                              >
                                Скасувати запис
                              </button>
                            </div>

                            {showPay && b.paymentStatus !== 'PAID' && profile?.paymentSettings && (
                              <div className="cab-pay-drawer">
                                <PaymentDetailsBlock
                                  profileName={profile.name}
                                  paymentSettings={profile.paymentSettings}
                                  selectedMethod={b.paymentMethod}
                                  serviceName={b.service?.name}
                                  priceUah={b.service?.priceUah}
                                  bookingDate={b.date}
                                />
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* History */}
                {pastBookings.length > 0 && (
                  <div className="cab-section cab-history-sec">
                    <h3 className="cab-sec-title">Історія та скасовані сесії</h3>
                    <div className="cab-cards-list">
                      {pastBookings.map((b) => {
                        const st = STATUS_MAP[b.status] || STATUS_MAP.PENDING;
                        const py = PAY_MAP[b.paymentStatus] || PAY_MAP.PENDING;
                        return (
                          <article key={b.id} className="cab-session-card cab-card-muted">
                            <div className="cab-card-top">
                              <div className="cab-badges">
                                {b.bookingCode && <span className="cab-code-badge">{b.bookingCode}</span>}
                                <span className={`cab-status-badge ${st.cls}`}>{st.label}</span>
                                <span className={`cab-pay-badge ${py.cls}`}>{py.label}</span>
                              </div>
                              <div className="cab-price">{b.service?.priceUah} грн</div>
                            </div>
                            <div className="cab-card-body">
                              <h4>{b.service?.name}</h4>
                              <div className="cab-meta-row">
                                <span>🗓️ {formatUkDateLabel(b.date)}</span>
                                <span>⏰ {b.timeSlot}</span>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Support box */}
                {profile && (
                  <div className="cab-support-box">
                    <span>Виникли питання щодо запису? Зв’яжіться напряму:</span>
                    <div className="cab-support-links">
                      <a href={getTelegramUrl(profile.telegram || profile.phone)} target="_blank" rel="noopener noreferrer">
                        Telegram
                      </a>
                      <a href={getViberUrl(profile.phone)} target="_blank" rel="noopener noreferrer">
                        Viber
                      </a>
                      <a href={getWhatsappUrl(profile.whatsapp || profile.phone)} target="_blank" rel="noopener noreferrer">
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Reschedule Modal */}
      <Modal
        isOpen={Boolean(rescheduleTarget)}
        onClose={() => setRescheduleTarget(null)}
        title="Перенесення консультації"
      >
        {rescheduleTarget && (
          <div className="cab-resched-modal">
            <p className="cab-resched-info">
              Поточний запис: <strong>{formatUkDateLabel(rescheduleTarget.date)} о {rescheduleTarget.timeSlot}</strong>.
              Оберіть нову вільну дату та час:
            </p>

            <MonthCalendarGrid
              selectedDate={newDate}
              onSelectDate={handleSelectRescheduleDate}
            />

            {newDate && (
              <div className="cab-resched-slots">
                <h4>Вільний час на {formatUkDateLabel(newDate)}:</h4>
                {loadingSlots && !newDayInfo ? (
                  <p>Завантаження годин...</p>
                ) : newDayInfo?.availableSlots?.length > 0 ? (
                  <div className="bw-slots-grid">
                    {newDayInfo.availableSlots.map((slot) => (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setNewTimeSlot(slot)}
                        className={`bw-slot-btn ${newTimeSlot === slot ? 'selected' : ''}`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>На цю дату вільних годин немає.</p>
                )}
              </div>
            )}

            <div className="cab-resched-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setRescheduleTarget(null)}
              >
                Скасувати
              </button>
              <button
                type="button"
                disabled={!newDate || !newTimeSlot || actionLoading}
                className="btn btn-primary"
                onClick={() =>
                  handleBookingPatch({
                    id: rescheduleTarget.id,
                    action: 'RESCHEDULE',
                    newDate,
                    newTimeSlot,
                  })
                }
              >
                {actionLoading ? 'Збереження...' : 'Підтвердити нову дату'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
