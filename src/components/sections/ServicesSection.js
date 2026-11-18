'use client';

import { useState } from 'react';
import { FORMAT_FINDER_ITEMS } from '@/data/landingContent';

export default function ServicesSection({ services, onSelectBooking }) {
  const [activeFinderIdx, setActiveFinderIdx] = useState(0);

  const getMatchedService = (finderItem) => {
    if (!services.length) return null;
    return (
      services.find((s) => s.category?.toUpperCase() === finderItem.matchCategory) ||
      services.find((s) => s.name.toLowerCase().includes(finderItem.matchKeyword)) ||
      services[0]
    );
  };

  const activeItem = FORMAT_FINDER_ITEMS[activeFinderIdx] || FORMAT_FINDER_ITEMS[0];
  const matchedService = getMatchedService(activeItem);

  return (
    <section id="services" className="g-services">
      <div className="container">
        <div className="g-sec-header center">
          <span className="g-sec-badge">Послуги та Тарифи</span>
          <h2>Формати консультацій</h2>
          <p>Прозора вартість, чіткі межі та вибір зручного часу в онлайн-календарі.</p>
        </div>

        <div className="g-finder-box">
          <div className="g-finder-head">
            <span className="g-sec-badge">Швидкий підбір за 10 секунд</span>
            <h3>Не впевнені, який формат обрати? Оберіть вашу ситуацію</h3>
          </div>

          <div className="g-finder-tabs" role="tablist" aria-label="Підбір формату консультації">
            {FORMAT_FINDER_ITEMS.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={activeFinderIdx === idx}
                className={`g-finder-tab ${activeFinderIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveFinderIdx(idx)}
              >
                <span className="g-finder-tab-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="g-finder-result">
            <div className="g-finder-result-info">
              <span className="g-finder-rec-pill">
                Рекомендований формат • {activeItem.duration}
              </span>
              <h4>{matchedService ? matchedService.name : activeItem.recommendation}</h4>
              <p className="g-finder-situation">
                <strong>Ваш запит:</strong> {activeItem.situation}
              </p>
              <p className="g-finder-desc">{activeItem.description}</p>
            </div>
            <div className="g-finder-result-cta">
              {matchedService && (
                <div className="g-finder-price">
                  <small>Вартість сесії</small>
                  <strong>{matchedService.priceUah} грн</strong>
                </div>
              )}
              <button
                type="button"
                onClick={() => onSelectBooking(matchedService?.id)}
                className="btn btn-primary"
              >
                Записатися на цей формат →
              </button>
            </div>
          </div>
        </div>

        <div className="g-services-grid">
          {services.map((s) => (
            <div key={s.id} className="g-service-card">
              <div className="g-srv-meta-top">
                <span>⏱️ {s.duration} хвилин</span>
                <span>💻 Онлайн</span>
              </div>
              <h3>{s.name}</h3>
              <p className="g-srv-desc">{s.description}</p>
              <div className="g-srv-bottom">
                <div className="g-srv-price">
                  <small>Вартість сесії</small>
                  <strong>{s.priceUah} грн</strong>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectBooking(s.id)}
                  className="btn btn-primary w-full"
                >
                  Обрати та записатися
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
