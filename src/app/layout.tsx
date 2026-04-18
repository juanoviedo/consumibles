import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Consumibles",
  description: "Product Website",
  keywords: "alarma,multas,pico y placa,SOAT"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/img/finecut.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
