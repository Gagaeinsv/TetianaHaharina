import { cookies } from 'next/headers';

// Simple crypto hash using Web Crypto API
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getSessionToken() {
  const secret = process.env.SESSION_SECRET || 'fallback-secret';
  const password = process.env.ADMIN_PASSWORD || 'default-password';
  return await sha256(password + secret);
}

export async function loginAdmin(password) {
  if (password !== process.env.ADMIN_PASSWORD) {
    return false;
  }
  
  const token = await getSessionToken();
  const cookieStore = await cookies();
  cookieStore.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  
  return true;
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_session');
}

export async function checkAuth(request) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('admin_session');
  
  if (!sessionCookie) return false;
  
  const expectedToken = await getSessionToken();
  return sessionCookie.value === expectedToken;
}
