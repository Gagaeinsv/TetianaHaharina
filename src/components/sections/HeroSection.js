import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection({ profile }) {
  return (
    <section className="g-hero photo-stage photo-right">
      <div className="photo-stage-bg" aria-hidden="true">
        <Image
          src="/avatar.jpg"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 52vw"
          className="photo-stage-img hero-pos"
        />
        <div className="photo-stage-veil veil-alabaster-right" />
      </div>

      <div className="container g-hero-grid photo-stage-content">
        <div className="g-hero-content">
          <span className="g-hero-pill">
            🌿 {profile.experience}+ років практичного досвіду • Онлайн по всьому світу
          </span>
          <h1>Простір безпеки, прийняття та психологічної підтримки</h1>
          <p className="g-hero-sub">{profile.subtitle}</p>
          <p className="g-hero-lead">
            Офіційні онлайн-консультації у правовому полі України. Допомагаю повернути внутрішню опору, налагодити контакт із дітьми й близькими та пройти складні життєві зміни без осуду.
          </p>

          <div className="g-hero-btns">
            <a href="#booking" className="btn btn-primary btn-lg">
              Записатися на сесію
            </a>
            <Link href="/cabinet" className="btn btn-secondary btn-lg">
              Мій кабінет клієнта
            </Link>
          </div>

          <div className="g-hero-highlight">
            <div className="g-float-num">{profile.experience} років</div>
            <div className="g-float-text">
              практики • волонтерка ГО «Разом» та ГО «Ранні пташки»
            </div>
          </div>

          <div className="g-trust-pills">
            <span>⚖️ Офіційно ФОП</span>
            <span>🔒 100% Конфіденційність</span>
            <span>🏳️‍🌈 ЛГБТ-френдлі</span>
            <span>🌍 Допомога в адаптації</span>
          </div>
        </div>

        <div className="g-hero-window" aria-hidden="true" />
      </div>
    </section>
  );
}
