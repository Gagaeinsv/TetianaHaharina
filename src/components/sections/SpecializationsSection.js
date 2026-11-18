import { SPEC_ICONS } from '@/data/landingContent';

export default function SpecializationsSection({ specializations, onSelectBooking }) {
  return (
    <section id="specializations" className="g-specs">
      <div className="container">
        <div className="g-sec-header center">
          <span className="g-sec-badge">Напрямки роботи</span>
          <h2>З якими запитами я допомагаю</h2>
          <p>
            Дбайливий підхід до дорослих, батьків, підлітків та колег-психологів залежно від вашої життєвої ситуації.
          </p>
        </div>

        <div className="g-specs-grid">
          {specializations.map((spec, idx) => (
            <div key={spec.id || idx} className="g-spec-card">
              <div className="g-spec-icon">{SPEC_ICONS[idx % SPEC_ICONS.length]}</div>
              <h3>{spec.name}</h3>
              <p>
                {spec.description ||
                  'Професійна психологічна підтримка, заснована на доказових методах і дбайливому ставленні.'}
              </p>
              <button
                type="button"
                onClick={() => onSelectBooking()}
                className="g-spec-link"
              >
                Обговорити на сесії →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
