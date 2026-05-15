import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IntelliGenda - L'agenda intelligente",
  description: "Il tuo software di prenotazione, senza complicazioni. Gestisci il tuo calendario e ricevi prenotazioni online.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
