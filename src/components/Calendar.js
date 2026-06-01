'use client';

import { useState, useEffect } from 'react';

export default function Calendar({ services, paymentSettings, onBookingSuccess, preselectedServiceId }) {
  const [selectedService, setSelectedService] = useState(services[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [busySlots, setBusySlots] = useState([]);

  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedService(preselectedServiceId);
    }
  }, [preselectedServiceId]);
  
  // Client info state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  const [loadingBusy, setLoadingBusy] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');

  // Define default time slots
  const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];

  // Generate next 14 days (excluding Sundays, or including them but let's do all days)
  const getNext14Days = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays (0 is Sunday)
      if (date.getDay() === 0) continue;

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const formatted = `${yyyy}-${mm}-${dd}`;
      
      // Label like: Пн, 26 Травня
      const options = { weekday: 'short', day: 'numeric', month: 'short' };
      const label = date.toLocaleDateString('uk-UA', options);
      
      dates.push({ date: formatted, label });
    }
    return dates;
  };

  const datesList = getNext14Days();

  // Set initial date
  useEffect(() => {
    if (datesList.length > 0) {
      setSelectedDate(datesList[0].date);
    }
  }, []);

  // Set default payment method when settings load
  useEffect(() => {
    if (paymentSettings) {
      if (paymentSettings.useIban) setPaymentMethod('IBAN');
      else if (paymentSettings.useMono) setPaymentMethod('MONO');
      else if (paymentSettings.usePaypal) setPaymentMethod('PAYPAL');
    }
  }, [paymentSettings]);

  // Fetch busy slots for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchBusySlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchBusySlots = async (date) => {
    setLoadingBusy(true);
    try {
      const res = await fetch(`/api/bookings?date=${date}`);
      const data = await res.json();
      if (data.success) {
        setBusySlots(data.busySlots || []);
      }
    } catch (e) {
      console.error('Error fetching busy slots:', e);
    } finally {
      setLoadingBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedService) return setError('Оберіть послугу');
    if (!selectedDate) return setError('Оберіть дату');
    if (!selectedTime) return setError('Оберіть зручний час');
    if (!clientName.trim()) return setError('Введіть ваше ім’я');
    if (!clientPhone.trim()) return setError('Введіть номер телефону');
    if (!clientEmail.trim()) return setError('Введіть email');
    if (!paymentMethod) return setError('Оберіть спосіб оплати');

    setSubmitLoading(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          clientEmail,
          date: selectedDate,
          timeSlot: selectedTime,
          serviceId: selectedService,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onBookingSuccess(data.booking);
      } else {
        setError(data.error || 'Помилка при створенні запису');
      }
    } catch (err) {
      setError('Не вдалося зв’язатися з сервером. Спробуйте пізніше.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="booking-card">
      <form onSubmit={handleSubmit}>
        
        {/* 1. Select Service */}
        <div className="booking-step">
          <label className="step-title">1. Оберіть консультацію</label>
          <div className="services-select-grid">
            {services.map((s) => (
              <div 
                key={s.id} 
                className={`service-option-card ${selectedService === s.id ? 'selected' : ''}`}
                onClick={() => setSelectedService(s.id)}
              >
                <div className="option-header">
                  <h4>{s.name}</h4>
                  <span className="option-price">{s.priceUah} грн</span>
                </div>
                <p className="option-desc">{s.description}</p>
                <span className="option-duration">⏱️ {s.duration} хвилин</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Select Date */}
        <div className="booking-step mt-8">
          <label className="step-title">2. Оберіть дату</label>
          <div className="dates-carousel">
            {datesList.map((d) => (
              <button
                type="button"
                key={d.date}
                className={`date-chip ${selectedDate === d.date ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedDate(d.date);
                  setSelectedTime(''); // Reset time on date change
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Select Time */}
        <div className="booking-step mt-8">
          <label className="step-title">3. Оберіть час</label>
          {loadingBusy ? (
            <div className="loading-slots">Оновлення слотів...</div>
          ) : (
            <div className="slots-grid">
              {timeSlots.map((time) => {
                const isBusy = busySlots.includes(time);
                return (
                  <button
                    type="button"
                    key={time}
                    disabled={isBusy}
                    className={`slot-btn ${selectedTime === time ? 'selected' : ''} ${isBusy ? 'busy' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time} {isBusy && '(Зайнято)'}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Client Details */}
        <div className="booking-step mt-8">
          <label className="step-title">4. Ваші контакти</label>
          <div className="contacts-form-grid">
            <div className="form-group">
              <label>Ваше ім’я</label>
              <input
                type="text"
                placeholder="Ім’я та Прізвище"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Телефон (бажано з Telegram / Viber)</label>
              <input
                type="tel"
                placeholder="+380XXXXXXXXX"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Електронна пошта (Email)</label>
              <input
                type="email"
                placeholder="example@mail.com"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* 5. Payment Method */}
        {paymentSettings && (
          <div className="booking-step mt-8">
            <label className="step-title">5. Зручний спосіб оплати</label>
            <div className="payment-select-grid">
              {paymentSettings.useIban && (
                <div 
                  className={`payment-option ${paymentMethod === 'IBAN' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('IBAN')}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'IBAN'}
                    onChange={() => setPaymentMethod('IBAN')}
                  />
                  <div>
                    <strong>Реквізити ФОП (IBAN)</strong>
                    <p className="text-small text-muted">Оплата за реквізитами в банку</p>
                  </div>
                </div>
              )}
              {paymentSettings.useMono && (
                <div 
                  className={`payment-option ${paymentMethod === 'MONO' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('MONO')}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'MONO'}
                    onChange={() => setPaymentMethod('MONO')}
                  />
                  <div>
                    <strong>Картка / Monobank</strong>
                    <p className="text-small text-muted">Оплата онлайн через Apple Pay / Google Pay</p>
                  </div>
                </div>
              )}
              {paymentSettings.usePaypal && (
                <div 
                  className={`payment-option ${paymentMethod === 'PAYPAL' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('PAYPAL')}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    checked={paymentMethod === 'PAYPAL'}
                    onChange={() => setPaymentMethod('PAYPAL')}
                  />
                  <div>
                    <strong>PayPal</strong>
                    <p className="text-small text-muted">Для оплати в валюті з-за кордону</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="booking-submit-section mt-8">
          {error && <div className="error-message mb-4">{error}</div>}
          <button
            type="submit"
            className="btn btn-primary w-full py-4 text-lg"
            disabled={submitLoading}
          >
            {submitLoading ? 'Бронювання...' : 'Підтвердити запис та перейти до оплати'}
          </button>
          <p className="submit-agreement">
            Натискаючи кнопку, ви погоджуєтеся з умовами обробки персональних даних та офертою.
          </p>
        </div>

      </form>
    </div>
  );
}
