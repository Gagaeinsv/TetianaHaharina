import { cookies } from 'next/headers';

const FALLBACK_SECRET = 'e9b0f1e2afbe42d7a4f9d06d5f818f08sessionsecretkey';
const FALLBACK_PASSWORD = 'psy_admin_2026';

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getSessionToken() {
  const secret = process.env.SESSION_SECRET || FALLBACK_SECRET;
  const password = process.env.ADMIN_PASSWORD || FALLBACK_PASSWORD;
  return await sha256(password + secret);
}

export async function loginAdmin(password) {
  const expectedPassword = process.env.ADMIN_PASSWORD || FALLBACK_PASSWORD;
  if (password !== expectedPassword) {
    return false;
  }

  const token = await getSessionToken();
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: Boolean(process.env.VERCEL || process.env.FORCE_SECURE_COOKIE),
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function checkAuth() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');

  if (!sessionCookie) return false;

  const expectedToken = await getSessionToken();
  return sessionCookie.value === expectedToken;
}
