import "./globals.css";

import prisma from "@/lib/db";

export async function generateMetadata() {
  try {
    const profile = await prisma.profile.findFirst();
    if (profile) {
      const name = profile.name;
      const title = profile.title;
      const subtitle = profile.subtitle;
      return {
        title: `${name} — Психолог, ${subtitle}`,
        description: `Офіційні психологічні консультації та психотерапія. ${title}. Запис на сесію онлайн. ФОП ${name}.`,
        openGraph: {
          title: `${name} — Психолог`,
          description: `Професійна психотерапія, консультації та підтримка онлайн.`,
          images: [{ url: "/avatar.jpg" }],
        }
      };
    }
  } catch (e) {
    console.error("Error generating metadata dynamically:", e);
  }

  return {
    title: "Психолог — Професійна психологічна допомога",
    description: "Офіційні психологічні консультації та психотерапія. Запис на сесію онлайн.",
    openGraph: {
      title: "Психолог — Професійна психологічна допомога",
      description: "Офіційні психологічні консультації та психотерапія. Запис на сесію онлайн.",
      images: [{ url: "/avatar.jpg" }],
    }
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="uk">
      <body>
        {children}
      </body>
    </html>
  );
}
