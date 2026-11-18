import Link from 'next/link';
import Image from 'next/image';
import BookingWidget from '@/components/BookingWidget';

export default function BookingSection({
  profile,
  services,
  paymentSettings,
  selectedServiceId,
  onSelectService,
}) {
  return (
    <section id="booking" className="g-booking-sec photo-stage">
      <div className="photo-stage-full" aria-hidden="true">
        <Image
          src="/nature_booking_bg.png"
          alt=""
          fill
          sizes="100vw"
          className="photo-stage-img"
        />
        <div className="photo-stage-veil veil-booking-mist" />
      </div>

      <div className="container photo-stage-content">
        <div className="g-sec-header center">
          <span className="g-sec-badge">Онлайн-запис</span>
          <h2>Оберіть день та час консультації</h2>
          <p>
            Усі вільні години оновлюються в реальному часі. Вже записувались?{' '}
            <Link href="/cabinet" className="g-inline-link">
              Відкрийте Особистий кабінет клієнта →
            </Link>
          </p>
        </div>

        <div className="g-booking-shell">
          <BookingWidget
            profile={profile}
            services={services}
            paymentSettings={paymentSettings}
            preselectedServiceId={selectedServiceId}
            onSelectService={onSelectService}
          />
        </div>

        <div className="g-microcopy-banner">
          🤍 Перший крок можна зробити у спокійному темпі. Якщо ви не впевнені, який формат обрати — оберіть «Індивідуальну сесію», і ми зорієнтуємося разом.
        </div>
      </div>
    </section>
  );
}
