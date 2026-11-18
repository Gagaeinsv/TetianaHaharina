import Link from 'next/link';
import { getTelegramUrl, getViberUrl, getWhatsappUrl } from '@/lib/scheduleUtils';

export default function SiteFooter({ profile, paymentSettings, onOpenLegalDoc }) {
  return (
    <>
      <footer className="g-footer">
        <div className="container g-footer-grid">
          <div className="g-footer-brand">
            <h3>{profile.name}</h3>
            <p className="g-footer-role">{profile.title}</p>
            <p className="g-footer-fop">
              ФОП {profile.name}
              <br />
              ЄДРПОУ: {paymentSettings?.edrpou}
              <br />
              Спрощена система оподаткування, 3 група
            </p>
          </div>

          <div className="g-footer-col">
            <h4>Клієнтам та Правова інформація</h4>
            <Link href="/cabinet" className="g-footer-link">
              👤 Особистий кабінет клієнта
            </Link>
            <button type="button" onClick={() => onOpenLegalDoc('OFFER')} className="g-footer-link">
              📄 Публічна оферта (Договір)
            </button>
            <button type="button" onClick={() => onOpenLegalDoc('PRIVACY')} className="g-footer-link">
              🔒 Політика конфіденційності
            </button>
            <Link href="/admin" className="g-footer-link muted">
              🔐 Вхід у кабінет фахівчині
            </Link>
          </div>

          <div className="g-footer-col">
            <h4>Зв’язок</h4>
            <p>📞 {profile.phone} (Україна / Viber)</p>
            <p>🟢 {profile.whatsapp} (WhatsApp)</p>
            <div className="g-footer-socials">
              <a href={getTelegramUrl(profile.telegram || profile.phone)} target="_blank" rel="noopener noreferrer">
                Telegram
              </a>
              <a href={getViberUrl(profile.phone)} target="_blank" rel="noopener noreferrer">
                Viber
              </a>
              <a href={getWhatsappUrl(profile.whatsapp || profile.phone)} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
              {profile.facebook && (
                <a href={profile.facebook} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="g-footer-bottom">
          © {new Date().getFullYear()} {profile.name}. Професійна психологічна практика у правовому полі України.
        </div>
      </footer>

      <div className="g-sticky-cta">
        <a href="#booking" className="btn btn-primary w-full">
          Записатися на консультацію
        </a>
      </div>
    </>
  );
}
