import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ONE WAY — Transport de marchandises',
    short_name: 'ONE WAY',
    description:
      'Transport routier de marchandises à Madagascar. Suivez votre livraison en temps réel, avec les kilomètres restants en direct.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#141a57',
    theme_color: '#141a57',
    lang: 'fr',
    categories: ['business', 'productivity', 'travel'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Suivre une livraison', short_name: 'Suivi', url: '/suivi' },
      { name: 'Nouvelle course', short_name: 'Nouvelle', url: '/app/gerant/new' },
      { name: 'Espace pro', short_name: 'Connexion', url: '/login' },
    ],
  };
}
