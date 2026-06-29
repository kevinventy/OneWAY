'use client';

/**
 * Vitrine ADAPTÉE (maquette) — orientée transporteur unique :
 *  - Gérant : pilote son activité
 *  - Chauffeur : reçoit ses missions
 *  - Client : suit sa livraison en temps réel, SANS compte
 *
 * Page de démonstration séparée (route /apercu) pour comparer avant/après
 * avec la vitrine marketplace existante (/). Aucun élément « place de marché »
 * (commission, enchères, abonnements) — One Way SARL transporte elle-même.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Radio,
  ShieldCheck,
  PhoneCall,
  Camera,
  MapPin,
  Truck,
  LayoutDashboard,
  PackageCheck,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Smartphone,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { RouteMap } from '@/components/map/RouteMap';
import { VEHICLE_TYPES } from '@/data/catalog';
import { KNOWN_ROUTES, findCity, lerpPoint } from '@/lib/geo';
import { money } from '@/lib/format';

export default function ApercuVitrine() {
  const tana = findCity('Antananarivo')!;
  const toam = findCity('Toamasina')!;

  // Petit camion qui avance en boucle sur l'axe Tana → Toamasina (effet « live »).
  const [progress, setProgress] = useState(0.42);
  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 0.98 ? 0.05 : +(p + 0.012).toFixed(3)));
    }, 700);
    return () => clearInterval(id);
  }, []);
  const current = lerpPoint(tana, toam, progress);

  const [code, setCode] = useState('');

  return (
    <div className="min-h-screen bg-white">
      {/* ── Nav simplifiée (transporteur, pas marketplace) ───────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/apercu" aria-label="Accueil One Way">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <a href="#suivi" className="btn-ghost hidden sm:inline-flex">
              <Radio size={16} /> Suivre ma livraison
            </a>
            <a href="#devis" className="btn-outline">
              Demander un devis
            </a>
            <Link href="/login" className="btn-primary">
              Espace pro
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero : SUIVI au centre ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 to-brand-800 text-white">
        <div className="container-app grid gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="animate-slide-up">
            <span className="chip bg-white/10 text-amber-400">🇲🇬 One Way SARL · Transport routier · Antananarivo</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Votre marchandise, <span className="text-amber-400">suivie en temps réel.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-brand-100 sm:text-lg">
              Votre transporteur de confiance à Madagascar. Confiez-nous vos marchandises et
              <strong> suivez votre camion en direct</strong> — du chargement à la livraison.
              Pas besoin de compte : un simple code suffit.
            </p>

            {/* Boîte de suivi — l'élément central pour le CLIENT */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-7 rounded-2xl bg-white p-2 shadow-pop sm:flex sm:items-center sm:gap-2"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search size={18} className="shrink-0 text-ink-muted" />
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Code de suivi — ex. OW-2026-0481"
                  className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-slate-400"
                  aria-label="Code de suivi"
                />
              </div>
              <a href="#suivi" className="btn-accent m-1 w-full text-base sm:w-auto">
                <Radio size={18} /> Suivre
              </a>
            </form>
            <p className="mt-2 text-xs text-brand-200">
              Vous avez reçu votre code par SMS ou WhatsApp à l'enlèvement.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-100">
              <span className="flex items-center gap-1.5"><Radio size={16} className="text-amber-400" /> Suivi GPS en direct</span>
              <span className="flex items-center gap-1.5"><Camera size={16} className="text-amber-400" /> Preuve de livraison</span>
              <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-amber-400" /> Marchandise assurée</span>
            </div>
          </div>

          {/* Aperçu carte live */}
          <div className="animate-slide-up rounded-2xl bg-white p-3 shadow-pop">
            <RouteMap
              from={{ ...tana, label: 'Antananarivo' }}
              to={{ ...toam, label: 'Toamasina' }}
              current={current}
              progress={progress}
              className="aspect-[4/3] w-full"
            />
            <div className="flex items-center justify-between p-3 text-ink">
              <div>
                <p className="text-xs text-ink-muted">Suivi OW-2026-0481</p>
                <p className="font-bold">Tana → Toamasina · 357 km</p>
              </div>
              <span className="chip bg-amber-100 text-amber-600">
                <Truck size={13} /> En route
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Suivi détaillé (résultat) ────────────────────────────── */}
      <section id="suivi" className="border-b border-slate-200 bg-slate-50 py-16">
        <div className="container-app">
          <h2 className="text-center text-3xl font-bold text-ink">Où est ma livraison ?</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-ink-muted">
            Le client voit en temps réel l'avancement de son camion — sans application à installer, sans compte.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            {/* Carte temps réel */}
            <div className="card overflow-hidden">
              <RouteMap
                from={{ ...tana, label: 'Chargement · Antananarivo' }}
                to={{ ...toam, label: 'Livraison · Toamasina' }}
                current={current}
                progress={progress}
                className="aspect-[16/10] w-full rounded-none border-0"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs text-ink-muted">Camion · MAN 19T · AB-1234-TBB</p>
                  <p className="font-bold text-ink">Arrivée estimée aujourd'hui · 14h30</p>
                </div>
                <a href="#" className="btn-outline">
                  <PhoneCall size={16} /> Appeler le chauffeur
                </a>
              </div>
            </div>

            {/* Timeline d'états */}
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-ink-muted">Suivi</p>
                  <p className="text-lg font-bold text-ink">OW-2026-0481</p>
                </div>
                <span className="chip bg-amber-100 text-amber-600">
                  <Truck size={13} /> En route · {Math.round(progress * 100)}%
                </span>
              </div>

              <ol className="mt-6 space-y-5">
                {[
                  { done: true, icon: <PackageCheck size={16} />, t: 'Commande confirmée', s: 'Antananarivo · 08h10' },
                  { done: true, icon: <Camera size={16} />, t: 'Marchandise chargée', s: 'Photo + bon de chargement · 09h05' },
                  { done: false, live: true, icon: <Truck size={16} />, t: 'En route vers Toamasina', s: 'Position mise à jour il y a 1 min' },
                  { done: false, icon: <CheckCircle2 size={16} />, t: 'Livré + preuve de livraison', s: 'En attente · ~14h30' },
                ].map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        step.done
                          ? 'bg-emerald-100 text-emerald-600'
                          : step.live
                            ? 'bg-amber-100 text-amber-600 animate-pulse-dot'
                            : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {step.icon}
                    </span>
                    <div>
                      <p className={`font-semibold ${step.done || step.live ? 'text-ink' : 'text-ink-muted'}`}>{step.t}</p>
                      <p className="text-xs text-ink-muted">{step.s}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="mt-6 flex items-center gap-2 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
                <MessageCircle size={16} className="shrink-0" />
                Une question ? Écrivez-nous sur WhatsApp, on vous répond.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pour qui : 3 utilisateurs ────────────────────────────── */}
      <section className="container-app py-16">
        <h2 className="text-center text-3xl font-bold text-ink">Une app, trois usages</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-ink-muted">
          Pensée pour ceux qui font tourner le transport, et pour ceux qui l'attendent.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <LayoutDashboard />,
              tag: 'Gérant',
              title: 'Je pilote mon activité',
              points: ['Créer & affecter les courses', 'Suivre tous mes camions', 'Revenus, impayés, rentabilité', 'Papiers & assurances du parc'],
            },
            {
              icon: <Truck />,
              tag: 'Chauffeur',
              title: 'Je reçois mes missions',
              points: ['Mes courses du jour', 'Navigation vers le client', 'Photo + signature à la livraison', 'Marche même sans réseau'],
            },
            {
              icon: <Smartphone />,
              tag: 'Client',
              title: 'Je suis ma livraison',
              points: ['Suivi en direct sur la carte', 'Sans compte, juste un code', 'Heure d\'arrivée estimée', 'Preuve de livraison reçue'],
            },
          ].map((r) => (
            <div key={r.tag} className="card p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  {r.icon}
                </div>
                <span className="chip bg-amber-100 text-amber-600">{r.tag}</span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-ink">{r.title}</h3>
              <ul className="mt-3 space-y-2">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-ink-soft">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comment suivre (client) ──────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="container-app">
          <h2 className="text-center text-3xl font-bold text-ink">Suivre en 3 étapes</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              { icon: <Smartphone />, title: '1. Recevez votre code', text: 'À l\'enlèvement, vous recevez un code de suivi par SMS ou WhatsApp.' },
              { icon: <Search />, title: '2. Ouvrez le lien', text: 'Cliquez sur le lien ou saisissez le code sur cette page. Aucune installation.' },
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
        </div>
      </section>

      {/* ── Notre flotte (pas de marketplace) ────────────────────── */}
      <section className="container-app py-16">
        <h2 className="text-center text-3xl font-bold text-ink">Notre flotte</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-ink-muted">
          Du petit colis au conteneur — un tarif kilométrique clair, sans surprise.
        </p>
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {VEHICLE_TYPES.map((v) => (
            <div key={v.key} className="card p-4 text-center">
              <div className="text-3xl">{v.emoji}</div>
              <h3 className="mt-2 text-sm font-bold text-ink">{v.label}</h3>
              <p className="text-xs text-ink-muted">{v.capacityLabel}</p>
              <p className="mt-2 text-xs font-semibold text-brand-600">{money(v.ratePerKm)}/km</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Couverture nationale ─────────────────────────────────── */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">Nous desservons tout Madagascar</h2>
            <p className="mt-2 max-w-md text-brand-100">
              Les grands axes sont pré-calibrés (distances & durées réelles). Antananarivo,
              Toamasina, Mahajanga, Fianarantsoa, Toliara et plus encore.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {KNOWN_ROUTES.slice(0, 8).map((r) => (
                <li key={`${r.from}-${r.to}`} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm">
                  <span>{r.from} → {r.to}</span>
                  <span className="text-amber-400">{r.distanceKm} km</span>
                </li>
              ))}
            </ul>
          </div>
          <RouteMap
            from={{ ...findCity('Antananarivo')!, label: 'Hub Antananarivo' }}
            to={{ ...findCity('Mahajanga')!, label: 'Mahajanga' }}
            className="aspect-square w-full bg-white"
          />
        </div>
      </section>

      {/* ── CTA devis / pro ──────────────────────────────────────── */}
      <section id="devis" className="bg-amber-500">
        <div className="container-app flex flex-col items-center gap-5 py-14 text-center">
          <h2 className="text-3xl font-extrabold text-ink">Vous avez une marchandise à transporter ?</h2>
          <p className="max-w-xl text-ink-soft">
            Confiez votre transport à One Way SARL. Devis rapide, suivi en temps réel et preuve de livraison à chaque course.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="#" className="btn bg-ink text-white hover:bg-ink-soft text-base">
              <MessageCircle size={18} /> Demander un devis sur WhatsApp
            </a>
            <a href="tel:+261000000000" className="btn bg-white text-ink hover:bg-slate-100 text-base">
              <PhoneCall size={18} /> Nous appeler
            </a>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-ink-soft">
            <Clock size={15} /> Réponse en moins de 30 minutes (heures ouvrées)
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="bg-ink py-10 text-slate-300">
        <div className="container-app flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo light />
          <p className="text-center text-xs text-slate-400">
            One Way SARL · Transport · Livraison · Suivi Digital · Antananarivo, Madagascar 🇲🇬
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#suivi" className="hover:text-white">Suivi</a>
            <Link href="/login" className="hover:text-white">Espace pro</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
