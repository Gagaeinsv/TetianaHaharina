'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ANXIETY_ITEMS } from '@/data/landingContent';

export default function EmpathySection() {
  const [openAnxiety, setOpenAnxiety] = useState(0);

  return (
    <section className="g-empathy-sec photo-stage photo-left">
      <div className="photo-stage-bg" aria-hidden="true">
        <Image
          src="/avatar5.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 46vw"
          className="photo-stage-img empathy-pos"
        />
        <div className="photo-stage-veil veil-sage-left" />
      </div>

      <div className="container g-empathy-grid photo-stage-content">
        <div className="g-empathy-window" aria-hidden="true" />

        <div className="g-empathy-content">
          <div className="g-empathy-header">
            <span className="g-sec-badge">Підтримка перед стартом</span>
            <h2>Це нормально — хвилюватися перед першою сесією</h2>
            <p>
              Багато клієнтів сумніваються, про що говорити і як усе відбуватиметься. Натисніть на питання, щоб дізнатися деталі.
            </p>
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
  );
}
