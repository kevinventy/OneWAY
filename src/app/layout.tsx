import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: 'ONE WAY — Transport de marchandises à Madagascar',
  description:
    'ONE WAY transporte vos marchandises partout à Madagascar et vous permet de suivre chaque livraison en temps réel, avec les kilomètres restants en direct.',
  keywords: ['transport', 'marchandises', 'logistique', 'Madagascar', 'camion', 'livraison', 'suivi'],
  authors: [{ name: 'One Way SARL' }],
  openGraph: {
    title: 'ONE WAY — Votre marchandise, suivie en temps réel',
    description: 'Transport routier de marchandises à Madagascar, suivi en temps réel.',
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
