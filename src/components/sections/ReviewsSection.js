import Image from 'next/image';
import { CLIENT_REVIEWS } from '@/data/landingContent';

export default function ReviewsSection({ onOpenImage }) {
  return (
    <section id="reviews" className="g-reviews-sec">
      <div className="container">
        <div className="g-sec-header center">
          <span className="g-sec-badge">Відгуки клієнтів</span>
          <h2>Живі історії та досвід роботи</h2>
          <p>
            Зворотний зв’язок від клієнтів після індивідуальних консультацій, сімейної підтримки та участі у соціальних проєктах.
          </p>
        </div>

        <div className="g-reviews-grid">
          {CLIENT_REVIEWS.map((rev) => (
            <article key={rev.id} className="g-review-card">
              <div className="g-review-top">
                <span className="g-review-tag">{rev.tag}</span>
              </div>
              <blockquote className="g-review-quote">{rev.quote}</blockquote>
              <div className="g-review-foot">
                <span className="g-review-source">{rev.source}</span>
                {rev.imgPath && (
                  <button
                    type="button"
                    className="g-review-proof-btn"
                    onClick={() => onOpenImage(rev.imgPath, rev.imgTitle)}
                  >
                    🔎 Переглянути оригінал відгуку
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="g-originals-strip">
          <div className="g-originals-info">
            <span className="g-sec-badge">Перевірені відгуки</span>
            <h3>Оригінали публікацій із соціального проєкту</h3>
            <p>
              Натисніть на будь-яку картку, щоб відкрити збережений оригінал відгуку у повному розмірі.
            </p>
          </div>
          <div className="g-originals-thumbs">
            <button
              type="button"
              className="g-orig-thumb"
              onClick={() => onOpenImage('/cert1.jpg', 'Відгук клієнтки — соціальний проєкт «Разом»')}
            >
              <Image src="/cert1.jpg" alt="Оригінал відгуку клієнтки №1" width={600} height={450} />
              <span>🔎 Переглянути оригінал №1</span>
            </button>
            <button
              type="button"
              className="g-orig-thumb"
              onClick={() => onOpenImage('/cert2.jpg', 'Відгук клієнта — соціальний проєкт')}
            >
              <Image src="/cert2.jpg" alt="Оригінал відгуку клієнта №2" width={600} height={450} />
              <span>🔎 Переглянути оригінал №2</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
