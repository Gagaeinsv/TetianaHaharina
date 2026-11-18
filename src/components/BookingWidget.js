'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import MonthCalendarGrid, { formatUkDateLabel } from './MonthCalendarGrid';
import PaymentDetailsBlock from './PaymentDetailsBlock';
import { getTelegramUrl, getViberUrl, getWhatsappUrl } from '@/lib/scheduleUtils';

const CATEGORY_LABELS = {
  INDIVIDUAL: 'Індивідуально',
  FAMILY: 'Сімейна / Батьки',
  SUPERVISION: 'Для колег',
};

function downloadIcsFile(booking, psychologistName) {
  if (!booking?.date || !booking?.timeSlot) return;
  const [y, m, d] = booking.date.split('-').map(Number);
  const [hh, mm] = booking.timeSlot.split(':').map(Number);
  const start = new Date(y, m - 1, d, hh, mm, 0);
  const duration = booking.service?.duration || 50;
  const end = new Date(start.getTime() + duration * 60000);

  const fmt = (dt) =>
    dt.getFullYear() +
    String(dt.getMonth() + 1).padStart(2, '0') +
    String(dt.getDate()).padStart(2, '0') +
    'T' +
    String(dt.getHours()).padStart(2, '0') +
    String(dt.getMinutes()).padStart(2, '0') +
    '00';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Psychologist Booking//UK',
    'BEGIN:VEVENT',
    `UID:${booking.id}@psychologist.local`,
    `DTSTAMP:${fmt(new Date())}`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:Консультація: ${booking.service?.name || 'Сесія'} (${psychologistName})`,
    `DESCRIPTION:Код запису: ${booking.bookingCode || booking.id}. Формат: Онлайн.`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `session-${booking.date}-${booking.timeSlot.replace(':', '')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function BookingWidget({
  profile,
  services = [],
  paymentSettings,
  preselectedServiceId,
  onSelectService,
}) {
  const [localServiceId, setLocalServiceId] = useState(null);
  const effectiveServiceId = onSelectService
    ? preselectedServiceId || services[0]?.id || ''
    : localServiceId || preselectedServiceId || services[0]?.id || '';

  const chooseService = (id) => {
    if (onSelectService) {
      onSelectService(id);
    } else {
      setLocalServiceId(id);
    }
  };

  const selectedService =
    services.find((s) => s.id === Number(effectiveServiceId)) || services[0];

  const activeCalendlyUrl =
    selectedService?.calendlyLink || profile?.calendlyLink || '';
  const rawMode = profile?.bookingMode || 'INTERNAL';
  const hasCalendly = Boolean(activeCalendlyUrl);
  const canSwitchMode = rawMode === 'BOTH' && hasCalendly;
  const initialTab = rawMode === 'CALENDLY' && hasCalendly ? 'CALENDLY' : 'INTERNAL';

  const [modeOverride, setModeOverride] = useState(null);
  const modeTab = canSwitchMode && modeOverride ? modeOverride : initialTab;

  // Internal calendar state
  const [selectedDate, setSelectedDate] = useState('');
  const [dayInfo, setDayInfo] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Client contact fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [messengerPref, setMessengerPref] = useState('Telegram');
  const [clientTelegram, setClientTelegram] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const defaultPayMethod = paymentSettings?.useIban
    ? 'IBAN'
    : paymentSettings?.useMono
    ? 'MONO'
    : paymentSettings?.usePaypal
    ? 'PAYPAL'
    : 'IBAN';
  const [pickedPayMethod, setPickedPayMethod] = useState(null);
  const paymentMethod = pickedPayMethod || defaultPayMethod;

  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [successfulBooking, setSuccessfulBooking] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleSelectDate = async (dateStr, preloadedInfo) => {
    setSelectedDate(dateStr);
    setSelectedTime('');
    if (preloadedInfo) {
      setDayInfo(preloadedInfo);
    }
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/schedule?date=${dateStr}`);
      const json = await res.json();
      if (json.success) {
        setDayInfo(json);
      }
    } catch (err) {
      console.error('Error loading day slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (modeTab !== 'CALENDLY' || !activeCalendlyUrl || successfulBooking) return;
    let mounted = true;

    const initWidget = () => {
      if (!mounted) return;
      const el = document.getElementById('calendly-inline-root');
      if (el && window.Calendly) {
        el.innerHTML = '';
        window.Calendly.initInlineWidget({
          url: activeCalendlyUrl,
          parentElement: el,
          pageSettings: {
            hideLandingPageDetails: false,
            hideGdprBanner: true,
          },
        });
      }
    };

    if (window.Calendly) {
      initWidget();
    } else {
      let script = document.getElementById('calendly-external-js');
      if (!script) {
        script = document.createElement('script');
        script.id = 'calendly-external-js';
        script.src = 'https://assets.calendly.com/assets/external/widget.js';
        script.async = true;
        document.body.appendChild(script);
      }
      script.addEventListener('load', initWidget);
      return () => {
        mounted = false;
        script.removeEventListener('load', initWidget);
      };
    }

    return () => {
      mounted = false;
    };
  }, [modeTab, activeCalendlyUrl, successfulBooking]);

  useEffect(() => {
    const onMsg = (e) => {
      if (e.data && e.data.event === 'calendly.event_scheduled') {
        setSuccessfulBooking({
          isCalendly: true,
          service: selectedService,
          paymentMethod,
        });
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [selectedService, paymentMethod]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedService?.id) return setError('Будь ласка, оберіть формат консультації.');
    if (!selectedDate) return setError('Будь ласка, оберіть дату у календарі.');
    if (!selectedTime) return setError('Будь ласка, оберіть вільну годину.');
    if (!clientName.trim()) return setError('Введіть ваше ім’я та прізвище.');
    if (!clientPhone.trim()) return setError('Введіть номер телефону для зв’язку.');
    if (!clientEmail.trim()) return setError('Введіть вашу електронну пошту.');

    setSubmitLoading(true);
    try {
      const telegramCombined = clientTelegram.trim()
        ? `${messengerPref}: ${clientTelegram.trim()}`
        : messengerPref;

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          clientEmail: clientEmail.trim(),
          clientTelegram: telegramCombined,
          clientNotes: clientNotes.trim(),
          date: selectedDate,
          timeSlot: selectedTime,
          serviceId: selectedService.id,
          paymentMethod,
        }),
      });

      const json = await res.json();
      if (json.success && json.booking) {
        try {
          localStorage.setItem(
            'psy_client_lookup',
            JSON.stringify({
              query: json.booking.bookingCode || json.booking.clientPhone,
              code: json.booking.bookingCode,
              phone: json.booking.clientPhone,
              email: json.booking.clientEmail,
              name: json.booking.clientName,
            })
          );
        } catch {}

        setSuccessfulBooking(json.booking);
        setRefreshKey((k) => k + 1);
      } else {
        setError(json.error || 'Не вдалося створити запис. Спробуйте обрати інший час.');
        setRefreshKey((k) => k + 1);
        if (selectedDate) handleSelectDate(selectedDate);
      }
    } catch {
      setError('Помилка з’єднання з сервером. Будь ласка, спробуйте ще раз.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (successfulBooking) {
    return (
      <div className="bw-success-card">
        <div className="bw-success-top">
          <div className="bw-success-badge">✓ Запис підтверджено в системі</div>
          <h3>Дякуємо, {successfulBooking.clientName || 'вашу сесію заброньовано'}!</h3>
          {successfulBooking.bookingCode && (
            <div className="bw-code-pill">
              <span>Код запису для кабінету:</span>
              <strong>{successfulBooking.bookingCode}</strong>
              <button
                type="button"
                className="btn-copy-inline"
                onClick={() => {
                  navigator.clipboard.writeText(successfulBooking.bookingCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
              >
                {copiedCode ? '✓' : 'Копіювати'}
              </button>
            </div>
          )}

          <div className="bw-summary-chips">
            <span>💼 {successfulBooking.service?.name}</span>
            {successfulBooking.date && <span>🗓️ {formatUkDateLabel(successfulBooking.date)}</span>}
            {successfulBooking.timeSlot && <span>⏰ {successfulBooking.timeSlot}</span>}
            {successfulBooking.service?.priceUah && (
              <span className="bw-price-chip">{successfulBooking.service.priceUah} грн</span>
            )}
          </div>
        </div>

        <div className="bw-success-pay">
          <PaymentDetailsBlock
            profileName={profile?.name}
            paymentSettings={paymentSettings}
            selectedMethod={paymentMethod}
            onMethodChange={setPickedPayMethod}
            serviceName={successfulBooking.service?.name}
            priceUah={successfulBooking.service?.priceUah}
            bookingDate={successfulBooking.date}
          />
        </div>

        <div className="bw-success-actions">
          <div className="bw-action-row">
            {!successfulBooking.isCalendly && (
              <>
                <Link href="/cabinet" className="btn btn-primary">
                  Перейти до мого особистого кабінету →
                </Link>
                <button
                  type="button"
                  onClick={() => downloadIcsFile(successfulBooking, profile?.name)}
                  className="btn btn-secondary"
                >
                  📅 Додати в календар (.ics)
                </button>
              </>
            )}
          </div>

          <div className="bw-messengers-row">
            <span className="bw-msg-label">Швидкий зв’язок із фахівчинею:</span>
            <div className="bw-msg-links">
              <a
                href={getTelegramUrl(profile?.telegram || profile?.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="bw-msg-btn tg"
              >
                ✈️ Telegram
              </a>
              <a
                href={getViberUrl(profile?.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="bw-msg-btn viber"
              >
                💬 Viber
              </a>
              <a
                href={getWhatsappUrl(profile?.whatsapp || profile?.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="bw-msg-btn wa"
              >
                🟢 WhatsApp
              </a>
            </div>
          </div>

          <button
            type="button"
            className="bw-reset-link"
            onClick={() => {
              setSuccessfulBooking(null);
              setSelectedTime('');
            }}
          >
            + Забронювати ще одну сесію
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bw-container">
      {canSwitchMode && (
        <div className="bw-mode-switcher">
          <button
            type="button"
            className={`bw-mode-btn ${modeTab === 'INTERNAL' ? 'active' : ''}`}
            onClick={() => setModeOverride('INTERNAL')}
          >
            📅 Календар на сайті
          </button>
          <button
            type="button"
            className={`bw-mode-btn ${modeTab === 'CALENDLY' ? 'active' : ''}`}
            onClick={() => setModeOverride('CALENDLY')}
          >
            🌐 Запис через Calendly
          </button>
        </div>
      )}

      {modeTab === 'CALENDLY' && hasCalendly ? (
        <div className="bw-calendly-wrap">
          <div className="bw-service-tabs">
            {services.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`bw-service-pill ${Number(effectiveServiceId) === s.id ? 'active' : ''}`}
                onClick={() => chooseService(s.id)}
              >
                {s.name} • {s.priceUah} грн
              </button>
            ))}
          </div>
          <div id="calendly-inline-root" className="bw-calendly-frame" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bw-form">
          <div className="bw-step">
            <div className="bw-step-head">
              <span className="bw-step-num">01</span>
              <h3>Оберіть формат консультації</h3>
            </div>
            <div className="bw-services-list">
              {services.map((s) => {
                const isSelected = Number(effectiveServiceId) === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => chooseService(s.id)}
                    className={`bw-service-card ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="bw-service-top">
                      <span className="bw-service-cat">
                        {CATEGORY_LABELS[s.category] || 'Консультація'}
                      </span>
                      <span className="bw-service-price">{s.priceUah} грн</span>
                    </div>
                    <div className="bw-service-title">{s.name}</div>
                    <p className="bw-service-desc">{s.description}</p>
                    <div className="bw-service-foot">
                      <span>⏱️ {s.duration} хвилин</span>
                      <span>{isSelected ? '✓ Обрано' : 'Обрати →'}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bw-step">
            <div className="bw-step-head">
              <span className="bw-step-num">02</span>
              <h3>Оберіть зручний день та час</h3>
            </div>
            <div className="bw-datetime-grid">
              <div className="bw-cal-pane">
                <MonthCalendarGrid
                  selectedDate={selectedDate}
                  onSelectDate={handleSelectDate}
                  refreshKey={refreshKey}
                />
              </div>

              <div className="bw-slots-pane">
                <div className="bw-slots-header">
                  <h4>
                    {selectedDate ? formatUkDateLabel(selectedDate) : 'Оберіть дату в календарі'}
                  </h4>
                  <span className="bw-tz-note">Час вказано за Києвом (EET/EEST)</span>
                </div>

                {!selectedDate ? (
                  <div className="bw-slots-empty">
                    Натисніть на будь-який активний день у календарі, щоб побачити вільні години прийому.
                  </div>
                ) : loadingSlots && !dayInfo ? (
                  <div className="bw-slots-empty">Завантаження вільних годин...</div>
                ) : dayInfo?.isDayOff ? (
                  <div className="bw-slots-empty">
                    Цього дня прийом не ведеться{dayInfo.note ? ` (${dayInfo.note})` : ''}. Будь ласка, оберіть іншу дату.
                  </div>
                ) : dayInfo?.allSlots?.length === 0 ? (
                  <div className="bw-slots-empty">На обрану дату вільних годин немає.</div>
                ) : (
                  <div className="bw-slots-grid">
                    {(dayInfo?.allSlots || []).map((slot) => {
                      const isAvailable = dayInfo?.availableSlots?.includes(slot);
                      const isPicked = selectedTime === slot;
                      return (
                        <button
                          type="button"
                          key={slot}
                          disabled={!isAvailable}
                          onClick={() => setSelectedTime(slot)}
                          className={`bw-slot-btn ${isPicked ? 'selected' : ''} ${
                            !isAvailable ? 'busy' : ''
                          }`}
                        >
                          <span>{slot}</span>
                          {!isAvailable && <small>Зайнято</small>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bw-step">
            <div className="bw-step-head">
              <span className="bw-step-num">03</span>
              <h3>Ваші контакти та спосіб оплати</h3>
            </div>

            <div className="bw-inputs-grid">
              <div className="bw-field">
                <label>Ім’я та прізвище *</label>
                <input
                  type="text"
                  required
                  placeholder="Наприклад: Олена Коваленко"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>

              <div className="bw-field">
                <label>Номер телефону *</label>
                <input
                  type="tel"
                  required
                  placeholder="+380XXXXXXXXX"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>

              <div className="bw-field">
                <label>Електронна пошта (Email) *</label>
                <input
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>

              <div className="bw-field">
                <label>Де зручніше зв’язатися</label>
                <div className="bw-messenger-row">
                  <select
                    value={messengerPref}
                    onChange={(e) => setMessengerPref(e.target.value)}
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="Viber">Viber</option>
                    <option value="WhatsApp">WhatsApp</option>
                  </select>
                  <input
                    type="text"
                    placeholder="@username (за бажанням)"
                    value={clientTelegram}
                    onChange={(e) => setClientTelegram(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bw-field bw-field-full">
              <label>Коротко про ваш запит (необов’язково — конфіденційно)</label>
              <textarea
                rows={2}
                placeholder="Можете коротко описати тему звернення або залишити поле порожнім..."
                value={clientNotes}
                onChange={(e) => setClientNotes(e.target.value)}
              />
            </div>

            {paymentSettings && (
              <div className="bw-payment-wrap">
                <label className="bw-sublabel">Спосіб оплати (офіційно ФОП):</label>
                <div className="bw-pay-options">
                  {paymentSettings.useIban && (
                    <button
                      type="button"
                      className={`bw-pay-card ${paymentMethod === 'IBAN' ? 'selected' : ''}`}
                      onClick={() => setPickedPayMethod('IBAN')}
                    >
                      <strong>🏦 Реквізити ФОП (IBAN)</strong>
                      <span>Переказ за рахунком без комісії</span>
                    </button>
                  )}
                  {paymentSettings.useMono && (
                    <button
                      type="button"
                      className={`bw-pay-card ${paymentMethod === 'MONO' ? 'selected' : ''}`}
                      onClick={() => setPickedPayMethod('MONO')}
                    >
                      <strong>💳 Monobank / Картка</strong>
                      <span>Apple Pay / Google Pay / будь-яка картка</span>
                    </button>
                  )}
                  {paymentSettings.usePaypal && (
                    <button
                      type="button"
                      className={`bw-pay-card ${paymentMethod === 'PAYPAL' ? 'selected' : ''}`}
                      onClick={() => setPickedPayMethod('PAYPAL')}
                    >
                      <strong>🌍 PayPal</strong>
                      <span>Зручно для оплати з-за кордону</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bw-submit-bar">
            <div className="bw-summary-info">
              <div>
                <strong>{selectedService?.name || 'Консультація'}</strong>
                <span>
                  {selectedDate ? formatUkDateLabel(selectedDate) : 'Дата не обрана'}
                  {selectedTime ? ` • ${selectedTime}` : ''}
                </span>
              </div>
              {selectedService && <div className="bw-total-price">{selectedService.priceUah} грн</div>}
            </div>

            {error && <div className="bw-error-box">{error}</div>}

            <button type="submit" disabled={submitLoading} className="btn btn-primary bw-submit-btn">
              {submitLoading ? 'Бронюємо час...' : 'Підтвердити запис та отримати реквізити'}
            </button>
            <p className="bw-agreement-note">
              Після запису ви отримаєте код для доступу до <Link href="/cabinet">Особистого кабінету клієнта</Link>.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
