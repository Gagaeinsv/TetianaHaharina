'use client';

import { useState } from 'react';
import { FAQ_ITEMS } from '@/data/landingContent';

export default function FaqSection() {
  const [activeFaq, setActiveFaq] = useState(0);

  return (
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
  );
}
