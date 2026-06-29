import type { Metadata, Viewport } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
