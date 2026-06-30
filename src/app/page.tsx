import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { TrackForm } from '@/components/track/TrackForm';
import { RealMap } from '@/components/map/RealMap';
import { COMPANY, whatsappHref, telHref } from '@/data/company';
import { VEHICLE_TYPES } from '@/data/catalog';
import {
  Radio, MapPin, Phone, MessageCircle, ShieldCheck, Truck, Smartphone,
  PackageSearch, UserCog, Navigation, Clock, Wifi, ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'ONE WAY — Transport de marchandises à Madagascar',
  description:
    'ONE WAY transporte vos marchandises partout à Madagascar et vous permet de suivre chaque livraison en temps réel, avec les kilomètres restants en direct. Devis rapide sur WhatsApp.',
};

const DEVIS_MSG = 'Bonjour ONE WAY, je souhaite un devis pour un transport de marchandises.';

export default function Vitrine() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="container-app flex h-14 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <a href={telHref(COMPANY.phoneIntl)} className="btn-ghost px-2.5" aria-label="Appeler">
              <Phone size={18} />
            </a>
            <Link href="/login" className="btn-outline px-3 py-2 text-sm">Espace pro</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 to-brand-800 text-white">
        <div className="container-app py-12 sm:py-16">
          <span className="chip bg-white/10 text-amber-300">{COMPANY.flag} Madagascar · {COMPANY.legalName}</span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Votre marchandise,<br /><span className="text-amber-400">suivie en temps réel.</span>
          </h1>
          <p className="mt-4 max-w-lg text-brand-100">
            Transport routier de marchandises partout à Madagascar. Suivez votre livraison en direct,
            avec les kilomètres restants, sans même créer de compte.
          </p>

          {/* Barre de suivi */}
          <div className="mt-7 rounded-2xl bg-white p-3 shadow-lg">
            <p className="mb-2 px-1 text-left text-sm font-semibold text-ink">📦 Suivre une livraison</p>
            <TrackForm />
          </div>

          {/* CTA */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <a href={whatsappHref(COMPANY.whatsapp, DEVIS_MSG)} target="_blank" rel="noopener noreferrer" className="btn bg-emerald-500 text-white hover:bg-emerald-600 sm:px-6">
              <MessageCircle size={18} /> Demander un devis
            </a>
            <a href={telHref(COMPANY.phoneIntl)} className="btn bg-white/10 text-white hover:bg-white/20 sm:px-6">
              <Phone size={18} /> {COMPANY.phone}
            </a>
          </div>

          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-brand-100">
            <span className="flex items-center gap-1.5"><Radio size={16} className="text-amber-400" /> Suivi temps réel</span>
            <span className="flex items-center gap-1.5"><Navigation size={16} className="text-amber-400" /> Km restants en direct</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-amber-400" /> Transporteur de confiance</span>
          </div>
        </div>
      </section>

      {/* Une app, trois usages */}
      <section className="container-app py-12">
        <h2 className="text-center text-2xl font-extrabold text-ink">Une app, trois usages</h2>
        <p className="mt-2 text-center text-ink-muted">Du bureau à la route, jusqu&apos;au client final.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <UseCard icon={<UserCog size={24} />} title="Gérant" desc="Crée les courses, calcule le prix, affecte les chauffeurs et pilote toute l'activité." tone="bg-brand-50 text-brand-700" />
          <UseCard icon={<Truck size={24} />} title="Chauffeur" desc="Reçoit ses missions, avance étape par étape et appelle le client en un geste." tone="bg-amber-50 text-amber-700" />
          <UseCard icon={<PackageSearch size={24} />} title="Client" desc="Suit sa marchandise en temps réel avec un simple code, sans créer de compte." tone="bg-emerald-50 text-emerald-700" />
        </div>
      </section>

      {/* Suivre en 3 étapes */}
      <section className="bg-slate-50 py-12">
        <div className="container-app">
          <h2 className="text-center text-2xl font-extrabold text-ink">Suivre en 3 étapes</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <Step n={1} title="Recevez votre code" desc="ONE WAY vous envoie un code de suivi par WhatsApp dès le départ." />
            <Step n={2} title="Saisissez-le" desc="Entrez le code sur cette page — aucune inscription requise." />
            <Step n={3} title="Suivez en direct" desc="Position du camion, kilomètres restants et heure d'arrivée estimée." />
          </div>
        </div>
      </section>

      {/* Couverture nationale */}
      <section className="container-app py-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <span className="chip bg-brand-50 text-brand-700"><MapPin size={14} /> Couverture nationale</span>
            <h2 className="mt-3 text-2xl font-extrabold text-ink">Partout à Madagascar</h2>
            <p className="mt-3 text-ink-muted">
              Des Hautes Terres à la côte : Antananarivo, Toamasina, Mahajanga, Fianarantsoa, Toliara,
              Antsiranana… Nos camions suivent les routes nationales, et vous suivez chaque kilomètre.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><Clock size={16} className="text-brand-500" /> Heure d&apos;arrivée estimée en continu</li>
              <li className="flex items-center gap-2"><Wifi size={16} className="text-brand-500" /> Fonctionne même en connexion faible</li>
              <li className="flex items-center gap-2"><Smartphone size={16} className="text-brand-500" /> Pensé pour le mobile, paiements Mobile Money</li>
            </ul>
          </div>
          <RealMap className="aspect-[4/5] w-full" showCities />
        </div>
      </section>

      {/* Flotte */}
      <section className="bg-slate-50 py-12">
        <div className="container-app">
          <h2 className="text-center text-2xl font-extrabold text-ink">Une flotte pour chaque besoin</h2>
          <p className="mt-2 text-center text-ink-muted">De la moto-taxi au semi-remorque.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {VEHICLE_TYPES.slice(0, 10).map((v) => (
              <div key={v.key} className="card flex flex-col items-center gap-1 p-4 text-center">
                <span className="text-3xl">{v.emoji}</span>
                <p className="text-sm font-semibold text-ink">{v.label}</p>
                <p className="text-[11px] text-ink-muted">{v.capacityLabel}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container-app py-14">
        <div className="rounded-3xl bg-gradient-to-br from-brand-900 to-brand-700 p-8 text-center text-white sm:p-12">
          <h2 className="text-2xl font-extrabold sm:text-3xl">Un transport à organiser ?</h2>
          <p className="mx-auto mt-2 max-w-md text-brand-100">Obtenez un devis en quelques minutes sur WhatsApp.</p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <a href={whatsappHref(COMPANY.whatsapp, DEVIS_MSG)} target="_blank" rel="noopener noreferrer" className="btn bg-emerald-500 text-white hover:bg-emerald-600 sm:px-6">
              <MessageCircle size={18} /> Devis WhatsApp <ArrowRight size={16} />
            </a>
            <a href={telHref(COMPANY.phoneIntl)} className="btn bg-white/10 text-white hover:bg-white/20 sm:px-6">
              <Phone size={18} /> Appeler {COMPANY.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8">
        <div className="container-app flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <Logo />
          <p className="text-sm text-ink-muted">{COMPANY.legalName} · {COMPANY.city}, {COMPANY.country} {COMPANY.flag}</p>
          <Link href="/login" className="text-sm font-semibold text-brand-600">Espace pro →</Link>
        </div>
      </footer>
    </div>
  );
}

function UseCard({ icon, title, desc, tone }: { icon: React.ReactNode; title: string; desc: string; tone: string }) {
  return (
    <div className="card p-5">
      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <h3 className="mt-3 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="card p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 font-extrabold text-white">{n}</span>
      <h3 className="mt-3 font-bold text-ink">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{desc}</p>
    </div>
  );
}
