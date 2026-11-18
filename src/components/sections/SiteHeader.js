'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SiteHeader({ profileName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="g-header">
      <div className="container g-header-inner">
        <Link href="/" className="g-brand">
          <span className="g-brand-name">{profileName}</span>
          <span className="g-brand-role">Психолог • Інтервізорка</span>
        </Link>

        <nav className={`g-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>Про мене</a>
          <a href="#specializations" onClick={() => setMobileMenuOpen(false)}>Напрямки</a>
          <a href="#services" onClick={() => setMobileMenuOpen(false)}>Послуги</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>Як проходить</a>
          <a href="#reviews" onClick={() => setMobileMenuOpen(false)}>Відгуки</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
          <div className="g-nav-actions">
            <Link href="/cabinet" className="btn btn-secondary g-nav-cab" onClick={() => setMobileMenuOpen(false)}>
              Особистий кабінет
            </Link>
            <a href="#booking" className="btn btn-primary g-nav-cta" onClick={() => setMobileMenuOpen(false)}>
              Записатися
            </a>
          </div>
        </nav>

        <button
          type="button"
          className={`g-burger ${mobileMenuOpen ? 'open' : ''}`}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Меню"
          aria-expanded={mobileMenuOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  );
}
