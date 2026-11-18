'use client';

import { useState } from 'react';

export default function PaymentDetailsBlock({
  profileName,
  paymentSettings,
  selectedMethod,
  onMethodChange,
  serviceName,
  priceUah,
  bookingDate,
}) {
  const [copiedField, setCopiedField] = useState('');

  if (!paymentSettings) return null;

  const copyValue = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const activeMethod =
    selectedMethod ||
    (paymentSettings.useIban
      ? 'IBAN'
      : paymentSettings.useMono
      ? 'MONO'
      : paymentSettings.usePaypal
      ? 'PAYPAL'
      : 'IBAN');

  const purposeText = bookingDate
    ? `Оплата за психологічні послуги (${serviceName || 'Консультація'}), дата ${bookingDate}`
    : `Оплата за психологічні послуги (${serviceName || 'Консультація'})`;

  return (
    <div className="pay-details-box">
      {onMethodChange && (
        <div className="pay-method-pills">
          {paymentSettings.useIban && (
            <button
              type="button"
              className={`pay-pill ${activeMethod === 'IBAN' ? 'active' : ''}`}
              onClick={() => onMethodChange('IBAN')}
            >
              🏦 Реквізити ФОП (IBAN)
            </button>
          )}
          {paymentSettings.useMono && (
            <button
              type="button"
              className={`pay-pill ${activeMethod === 'MONO' ? 'active' : ''}`}
              onClick={() => onMethodChange('MONO')}
            >
              💳 Картка / Monobank
            </button>
          )}
          {paymentSettings.usePaypal && (
            <button
              type="button"
              className={`pay-pill ${activeMethod === 'PAYPAL' ? 'active' : ''}`}
              onClick={() => onMethodChange('PAYPAL')}
            >
              🌍 PayPal
            </button>
          )}
        </div>
      )}

      {activeMethod === 'IBAN' && paymentSettings.useIban && (
        <div className="iban-card">
          <h4>Реквізити ФОП для оплати (IBAN)</h4>
          <div className="iban-rows">
            <div className="iban-row">
              <span className="iban-label">Отримувач:</span>
              <strong className="iban-val">ФОП {profileName}</strong>
            </div>
            <div className="iban-row">
              <span className="iban-label">Рахунок IBAN:</span>
              <div className="iban-copy-wrap">
                <code className="iban-code">{paymentSettings.iban}</code>
                <button
                  type="button"
                  onClick={() => copyValue(paymentSettings.iban, 'iban')}
                  className="btn-copy-inline"
                >
                  {copiedField === 'iban' ? '✓ Скопійовано' : 'Копіювати'}
                </button>
              </div>
            </div>
            <div className="iban-row">
              <span className="iban-label">ЄДРПОУ / ІПН:</span>
              <div className="iban-copy-wrap">
                <code className="iban-code">{paymentSettings.edrpou}</code>
                <button
                  type="button"
                  onClick={() => copyValue(paymentSettings.edrpou, 'edrpou')}
                  className="btn-copy-inline"
                >
                  {copiedField === 'edrpou' ? '✓ Скопійовано' : 'Копіювати'}
                </button>
              </div>
            </div>
            <div className="iban-row">
              <span className="iban-label">Банк:</span>
              <span className="iban-val">{paymentSettings.bankName}</span>
            </div>
            {priceUah ? (
              <div className="iban-row">
                <span className="iban-label">Сума:</span>
                <strong className="iban-val">{priceUah} грн</strong>
              </div>
            ) : null}
            <div className="iban-row">
              <span className="iban-label">Призначення платежу:</span>
              <div className="iban-copy-wrap">
                <span className="iban-val">{purposeText}</span>
                <button
                  type="button"
                  onClick={() => copyValue(purposeText, 'purpose')}
                  className="btn-copy-inline"
                >
                  {copiedField === 'purpose' ? '✓ Скопійовано' : 'Копіювати'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMethod === 'MONO' && paymentSettings.useMono && (
        <div className="mono-card">
          <h4>Онлайн-оплата карткою (Monobank / Apple Pay / Google Pay)</h4>
          <p>Натисніть кнопку нижче, щоб перейти на безпечну сторінку оплати{priceUah ? ` на суму ${priceUah} грн` : ''}.</p>
          <a
            href={paymentSettings.monoLink || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
          >
            💳 Перейти до оплати Monobank
          </a>
        </div>
      )}

      {activeMethod === 'PAYPAL' && paymentSettings.usePaypal && (
        <div className="paypal-card">
          <h4>Міжнародна оплата через PayPal</h4>
          <p>Переказ для клієнтів з-за кордону на офіційний акаунт:</p>
          <div className="iban-copy-wrap" style={{ justifyContent: 'center', margin: '0.75rem 0' }}>
            <code className="iban-code">{paymentSettings.paypalEmail}</code>
            <button
              type="button"
              onClick={() => copyValue(paymentSettings.paypalEmail, 'paypal')}
              className="btn-copy-inline"
            >
              {copiedField === 'paypal' ? '✓ Скопійовано' : 'Копіювати'}
            </button>
          </div>
          {paymentSettings.paypalLink && (
            <a
              href={paymentSettings.paypalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              🌍 Відкрити PayPal.Me
            </a>
          )}
        </div>
      )}
    </div>
  );
}
