'use client';

import { useState } from 'react';
import { getTelegramUrl, getViberUrl, getWhatsappUrl } from '@/lib/scheduleUtils';

export default function QuickContactWidget({ profile }) {
  const [quickContactOpen, setQuickContactOpen] = useState(false);

  return (
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
  );
}
