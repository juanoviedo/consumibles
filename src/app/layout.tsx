import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Expertos en Corte Plasma",
    default: "Consumibles y Asesoría para Corte Plasma | Industria Metalmecánica",
  },
  description: "Especialistas en consumibles, repuestos y asesoría técnica para equipos de corte plasma y mesas CNC. Potenciamos la industria metalmecánica.",
  keywords: "consumibles plasma, corte plasma, mesas CNC, industria metalmecánica, Hypertherm, repuestos plasma, Powermax, MaxPro200",
  openGraph: {
    title: "Consumibles y Asesoría para Corte Plasma | Industria Metalmecánica",
    description: "Especialistas en consumibles, repuestos y asesoría técnica gratuita para equipos de corte plasma y mesas CNC.",
    type: "website",
    locale: "es_CO",
  }
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
        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '857593006600128');
              fbq('track', 'PageView');
            `,
          }}
        />
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=857593006600128&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
        {/* End Meta Pixel Code */}
      </head>
      <body>{children}</body>
    </html>
  );
}
