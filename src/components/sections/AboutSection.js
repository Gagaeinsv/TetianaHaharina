import Image from 'next/image';

export default function AboutSection({ profile }) {
  return (
    <section id="about" className="g-about photo-stage photo-left dark-studio">
      <div className="photo-stage-bg" aria-hidden="true">
        <Image
          src="/avatar4.jpg"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 46vw"
          className="photo-stage-img studio-pos"
        />
        <div className="photo-stage-veil veil-dark-left" />
      </div>

      <div className="container g-about-grid photo-stage-content">
        <div className="g-about-window" aria-hidden="true" />

        <div className="g-about-body dark-surface">
          <span className="g-sec-badge light">Про мене та досвід</span>
          <h2>{profile.name}</h2>
          <p className="g-about-sub light">{profile.title} — {profile.subtitle}</p>
          <p className="g-about-bio light">{profile.bio}</p>

          <div className="g-org-tags dark">
            <span>ГО «Соціальний проєкт Разом»</span>
            <span>ГО «Ранні пташки»</span>
            <span>Гейткіпер</span>
            <span>Координаторка ПЦ «Перспектива»</span>
          </div>

          <div className="g-standards-card dark-glass">
            <span className="g-std-badge">Етика та супервізія</span>
            <h4>Професійні стандарти</h4>
            <ul className="g-std-list">
              <li>✦ Понад 2000+ годин практики</li>
              <li>✦ Координаторка ПЦ «Перспектива»</li>
              <li>✦ Волонтерка ГО «Разом» та ГО «Ранні пташки»</li>
              <li>✦ Регулярна супервізія та інтервізія</li>
            </ul>
          </div>

          <div className="g-facts-box dark-glass">
            <h3>Ключова інформація</h3>
            <ul>
              <li><strong>Освіта:</strong> Вища психологічна, регулярна інтервізія та супервізія</li>
              <li><strong>Досвід практики:</strong> {profile.experience} років (понад 2000+ годин консультацій)</li>
              <li><strong>Координація:</strong> Курси підвищення кваліфікації психологів ПЦ «Перспектива»</li>
              <li><strong>Формат роботи:</strong> Онлайн (Zoom, Google Meet, месенджери)</li>
              <li><strong>Мови:</strong> Українська, російська</li>
              <li><strong>Легальність:</strong> Офіційний ФОП 3 групи, відкриті реквізити та оферта</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
