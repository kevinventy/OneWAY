/**
 * Identité ONE WAY (transporteur unique, Madagascar).
 * Centralisé pour la vitrine, les liens WhatsApp et le suivi public.
 */
export const COMPANY = {
  name: 'ONE WAY',
  legalName: 'One Way SARL',
  city: 'Antananarivo',
  country: 'Madagascar',
  flag: '🇲🇬',
  slogan: 'Votre marchandise, suivie en temps réel',
  /** Numéro affiché. */
  phone: '+261 34 12 345 67',
  /** Numéro au format international sans symboles (tel: / wa.me). */
  phoneIntl: '261341234567',
  whatsapp: '261341234567',
  email: 'onewindcorp@gmail.com',
} as const;

/** Lien d'appel téléphonique. */
export function telHref(phone: string): string {
  return `tel:+${phone.replace(/[^\d]/g, '')}`;
}

/** Lien WhatsApp avec message pré-rempli. */
export function whatsappHref(phone: string, text?: string): string {
  const n = phone.replace(/[^\d]/g, '');
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
