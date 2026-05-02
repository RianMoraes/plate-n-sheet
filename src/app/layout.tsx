import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SheetForge — Planificação de Peças Metálicas",
  description:
    "Aplicação de desenvolvimento geométrico e planificação de peças metálicas. Cone truncado, redução redonda-redonda e muito mais.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
