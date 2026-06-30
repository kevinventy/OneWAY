/** Contact ONE WAY (vitrine publique mobile). */
export const COMPANY = {
  name: 'ONE WAY',
  legalName: 'One Way SARL',
  city: 'Antananarivo',
  country: 'Madagascar',
  phone: '+261 34 12 345 67',
  phoneIntl: '261341234567',
  whatsapp: '261341234567',
  email: 'onewindcorp@gmail.com',
};

export const telHref = (phone: string) => `tel:+${phone.replace(/[^\d]/g, '')}`;
export const whatsappHref = (phone: string, text?: string) =>
  `https://wa.me/${phone.replace(/[^\d]/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

/** Services mis en avant sur l'accueil. */
export const SERVICES: { icon: string; title: string; desc: string }[] = [
  { icon: 'cube', title: 'Transport de marchandises', desc: 'Tous volumes, de la moto au semi-remorque, partout à Madagascar.' },
  { icon: 'rocket', title: 'Livraison express', desc: 'Délais maîtrisés sur les grands axes (RN2, RN7, RN4…).' },
  { icon: 'navigate', title: 'Suivi digital temps réel', desc: 'Position du camion et kilomètres restants, en direct.' },
];
