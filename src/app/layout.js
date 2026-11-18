import './globals.css';
import prisma from '@/lib/db';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata() {
  try {
    const profile = await prisma.profile.findFirst();
    if (profile) {
      return {
        title: `${profile.name} — ${profile.subtitle}`,
        description: `Офіційні психологічні консультації онлайн, сімейна та підліткова психологія, інтервізія. ${profile.bio.slice(0, 140)}`,
        openGraph: {
          title: `${profile.name} — Психолог, Інтервізорка`,
          description: 'Професійна психологічна підтримка, дитячо-батьківські стосунки та онлайн-запис.',
          images: [{ url: '/avatar.jpg' }],
        },
      };
    }
  } catch (e) {
    console.error('Metadata fallback:', e);
  }

  return {
    title: 'Гагаріна Тетяна — Психолог, Інтервізорка',
    description: 'Офіційні психологічні консультації онлайн. Запис на сесію та особистий кабінет.',
    openGraph: {
      title: 'Гагаріна Тетяна — Психолог',
      description: 'Професійна психотерапія та психологічна підтримка онлайн.',
      images: [{ url: '/avatar.jpg' }],
    },
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
