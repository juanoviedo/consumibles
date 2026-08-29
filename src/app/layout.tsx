import type { Metadata } from "next";
import { Suspense } from "react";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | Consumibles de Plasma y Láser en Colombia",
    default: "Consumibles de Plasma y Láser en Colombia | Repuestos Hypertherm y CNC",
  },
  description: "Distribución y asesoría de consumibles para corte por plasma y láser en Colombia. Repuestos de antorchas, cabezales de fibra óptica, boquillas y electrodos para mesas CNC.",
  keywords: "consumibles laser, corte laser colombia, hypertherm colombia, consumibles hypertherm, corte por plasma, corte por plasma colombia, repuestos plasma colombia, laser de fibra, antorchas hypertherm, boquillas plasma, electrodos plasma",
  openGraph: {
    title: "Consumibles de Plasma y Láser en Colombia",
    description: "Distribución de consumibles y soporte técnico especializado para equipos de corte por plasma Hypertherm, láser de fibra y mesas CNC en Colombia.",
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

        {/* Hotjar Tracking Code */}
        {process.env.NEXT_PUBLIC_HOTJAR_ID && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function(h,o,t,j,a,r){
                    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
                    h._hjSettings={hjid:${process.env.NEXT_PUBLIC_HOTJAR_ID},hjsv:6};
                    a=o.getElementsByTagName('head')[0];
                    r=o.createElement('script');r.async=1;
                    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
                    a.appendChild(r);
                })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
              `,
            }}
          />
        )}
      </head>
      <body>
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
