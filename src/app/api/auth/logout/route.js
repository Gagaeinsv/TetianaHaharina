import { NextResponse } from 'next/server';
import { logoutAdmin } from '@/lib/auth';

export async function POST() {
  try {
    await logoutAdmin();
    return NextResponse.json({ success: true, message: 'Успішний вихід' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
