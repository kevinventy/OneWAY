import Link from 'next/link';
import { Smartphone, Search, MapPin } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { TrackingSearch } from '@/components/track/TrackingSearch';

export const metadata = {
  title: 'Suivre ma livraison · One Way',
  description: 'Suivez votre marchandise en temps réel avec votre code de suivi. Sans compte.',
};

export default function SuiviHome() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/apercu" aria-label="Accueil One Way">
            <Logo />
          </Link>
          <Link href="/login" className="btn-primary">
            Espace pro
          </Link>
        </div>
      </header>

      {/* Hero suivi */}
      <section className="bg-gradient-to-b from-brand-950 to-brand-800 text-white">
        <div className="container-app py-16 sm:py-20">
          <div className="mx-auto max-w-xl text-center">
            <span className="chip bg-white/10 text-amber-400">🇲🇬 One Way SARL · Suivi en temps réel</span>
            <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">Où est ma livraison ?</h1>
            <p className="mt-3 text-brand-100">
              Entrez le code reçu par SMS ou WhatsApp à l'enlèvement. Pas besoin de compte.
            </p>
            <div className="mt-7 text-left">
              <TrackingSearch placeholder="Code de suivi — ex. OWMG3456" autoFocus />
            </div>
          </div>
        </div>
      </section>

      {/* 3 étapes */}
      <section className="container-app py-16">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: <Smartphone />, title: '1. Recevez votre code', text: 'À l\'enlèvement, vous recevez un code de suivi par SMS ou WhatsApp.' },
            { icon: <Search />, title: '2. Saisissez-le', text: 'Entrez le code ci-dessus. Aucune application à installer.' },
            { icon: <MapPin />, title: '3. Suivez en direct', text: 'Votre camion s\'affiche sur la carte, avec l\'heure d\'arrivée estimée.' },
          ].map((s) => (
            <div key={s.title} className="card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                {s.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
