import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'ONE WAY — Marketplace de transport de marchandises',
  description:
    'ONE WAY connecte chargeurs et transporteurs : publiez un fret, recevez des offres, suivez la livraison en temps réel et payez en toute sécurité. Madagascar · Afrique francophone · Europe · Maghreb.',
  keywords: ['transport', 'fret', 'logistique', 'marketplace', 'Madagascar', 'camion', 'livraison'],
  authors: [{ name: 'One Way SARL' }],
  openGraph: {
    title: 'ONE WAY — Le fret, en un sens',
    description: 'La marketplace qui connecte chargeurs et transporteurs.',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ONE WAY',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#141a57',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
