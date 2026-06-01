import { NextResponse } from 'next/server';
import { loginAdmin } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Пароль обов’язковий' },
        { status: 400 }
      );
    }

    const success = await loginAdmin(password);

    if (success) {
      return NextResponse.json({ success: true, message: 'Успішний вхід' });
    } else {
      return NextResponse.json(
        { success: false, error: 'Неправильний пароль' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Помилка сервера' },
      { status: 500 }
    );
  }
}
