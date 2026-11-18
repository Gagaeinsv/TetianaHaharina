'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Введіть пароль адміністратора');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/admin');
      } else {
        setError(data.error || 'Неправильний пароль');
      }
    } catch {
      setError('Помилка з’єднання з сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-login-wrap">
      <div className="adm-login-card">
        <span className="adm-login-badge">🔐 Захищений простір</span>
        <h1>Кабінет фахівчині</h1>
        <p className="adm-login-sub">
          Увійдіть для керування розкладом, бронюваннями клієнтів, послугами та контентом сайту.
        </p>

        <form onSubmit={handleSubmit} className="adm-login-form">
          <div className="adm-field">
            <label htmlFor="admin-password">Пароль адміністратора</label>
            <input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Введіть пароль..."
              disabled={loading}
              autoFocus
            />
          </div>

          {error && <div className="adm-alert adm-alert-err">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Перевірка...' : 'Увійти в кабінет →'}
          </button>
        </form>

        <div className="adm-login-links">
          <Link href="/">← Повернутися на сайт</Link>
          <Link href="/cabinet">Кабінет клієнта</Link>
        </div>
      </div>
    </div>
  );
}
