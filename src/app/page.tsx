import Link from 'next/link';
import {
  ArrowRight,
  PackageCheck,
  Truck,
  MapPin,
  ShieldCheck,
  Gavel,
  Wallet,
  Star,
  Radio,
  FileText,
  MessageSquare,
  CheckCircle2,
} from 'lucide-react';
import { PublicNav } from '@/components/marketing/PublicNav';
import { Logo } from '@/components/brand/Logo';
import { RouteMap } from '@/components/map/RouteMap';
import { VEHICLE_TYPES, SUBSCRIPTION_PLANS, MARKETPLACE } from '@/data/catalog';
import { KNOWN_ROUTES, findCity } from '@/lib/geo';
import { money, moneyCompact } from '@/lib/format';

export default function LandingPage() {
  const tana = findCity('Antananarivo')!;
  const toam = findCity('Toamasina')!;

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-950 to-brand-800 text-white">
        <div className="container-app grid gap-10 py-14 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div className="animate-slide-up">
            <span className="chip bg-white/10 text-amber-400">🇲🇬 Transport · Livraison · Suivi digital</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Le fret, <span className="text-amber-400">en un sens.</span>
            </h1>
            <p className="mt-4 max-w-lg text-base text-brand-100 sm:text-lg">
              ONE WAY connecte les <strong>chargeurs</strong> et les <strong>transporteurs</strong>.
              Publiez une annonce de fret, recevez des offres, suivez votre marchandise en temps réel
              et payez en toute sécurité — via MVola, Orange Money ou carte.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/register?role=SHIPPER" className="btn-accent text-base">
                <PackageCheck size={18} /> J’expédie une marchandise
              </Link>
              <Link href="/register?role=CARRIER" className="btn bg-white/10 text-white hover:bg-white/20 text-base">
                <Truck size={18} /> Je transporte
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-brand-100">
              <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-amber-400" /> Paiement sécurisé</span>
              <span className="flex items-center gap-1.5"><Radio size={16} className="text-amber-400" /> Suivi GPS temps réel</span>
              <span className="flex items-center gap-1.5"><Star size={16} className="text-amber-400" /> Transporteurs vérifiés</span>
            </div>
          </div>

          {/* Live tracking preview card */}
          <div className="animate-slide-up rounded-2xl bg-white p-3 shadow-pop">
            <RouteMap
              from={{ ...tana, label: 'Antananarivo' }}
              to={{ ...toam, label: 'Toamasina' }}
              current={{ lat: (tana.lat + toam.lat) / 2, lng: (tana.lng + toam.lng) / 2 }}
              progress={0.5}
              className="aspect-[4/3] w-full"
            />
            <div className="flex items-center justify-between p-3 text-ink">
              <div>
                <p className="text-xs text-ink-muted">Expédition EXP-0001</p>
                <p className="font-bold">Tana → Toamasina · 357 km</p>
              </div>
              <span className="chip bg-amber-100 text-amber-600">En transit</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="container-app grid grid-cols-2 gap-4 py-8 sm:grid-cols-4">
          {[
            ['12 %', 'Commission unique, tout compris'],
            ['10', 'Types de véhicules'],
            ['Temps réel', 'Suivi de chaque livraison'],
            ['0,5 %', 'Assurance marchandise'],
          ].map(([n, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-extrabold text-brand-700">{n}</div>
              <div className="mt-1 text-xs text-ink-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="container-app py-16">
        <h2 className="text-center text-3xl font-bold text-ink">Comment ça marche</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-ink-muted">
          De la publication au paiement, ONE WAY pilote tout le cycle de transport.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: <MapPin />, title: '1. Publiez votre fret', text: 'Décrivez la marchandise, les points de chargement/livraison et la date. Obtenez un prix estimé instantané.' },
            { icon: <Gavel />, title: '2. Recevez des offres', text: 'Le matching intelligent propose les meilleurs transporteurs. Prix fixe ou enchères : vous choisissez.' },
            { icon: <Radio />, title: '3. Suivez & payez', text: 'Suivi GPS en temps réel, documents (BL, facture) générés, paiement sécurisé à la livraison.' },
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

      {/* ── Features ─────────────────────────────────────────── */}
      <section className="bg-slate-50 py-16">
        <div className="container-app">
          <h2 className="text-center text-3xl font-bold text-ink">Une plateforme complète</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Truck />, t: 'Matching intelligent', d: 'Algorithme de mise en relation par proximité, capacité, prix et réputation.' },
              { icon: <Radio />, t: 'Suivi temps réel', d: 'Position GPS du chauffeur, étapes de livraison et notifications push/SMS.' },
              { icon: <Gavel />, t: 'Enchères ou prix fixe', d: 'Faites jouer la concurrence ou bloquez un tarif. Vous gardez le contrôle.' },
              { icon: <ShieldCheck />, t: 'KYC & assurance', d: 'Documents véhicule/permis vérifiés, assurance marchandise optionnelle.' },
              { icon: <FileText />, t: 'Documents digitaux', d: 'Devis, bordereau de livraison, facture et preuve de livraison automatisés.' },
              { icon: <MessageSquare />, t: 'Chat intégré', d: 'Communication directe chargeur ↔ transporteur, historique conservé.' },
              { icon: <Wallet />, t: 'Paiement mobile money', d: 'MVola, Orange Money, Airtel Money, Wave, virement ou carte. Acompte 50 %.' },
              { icon: <Star />, t: 'Notation & avis', d: 'Évaluez chaque mission. La réputation construit la confiance du réseau.' },
              { icon: <Truck />, t: 'Gestion de flotte', d: 'Sous-comptes chauffeurs, véhicules, disponibilités et missions en un coup d’œil.' },
            ].map((f) => (
              <div key={f.t} className="card p-5">
                <span className="text-amber-500">{f.icon}</span>
                <h3 className="mt-3 font-bold text-ink">{f.t}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fleet ────────────────────────────────────────────── */}
      <section className="container-app py-16">
        <h2 className="text-center text-3xl font-bold text-ink">Tous les véhicules, tous les volumes</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-ink-muted">
          Du pli urgent au conteneur 40 pieds — une grille tarifaire kilométrique transparente.
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
        <div className="mt-8 text-center">
          <Link href="/calculateur" className="btn-primary">
            Calculer un prix de transport <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Coverage ─────────────────────────────────────────── */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-app grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold">Couverture nationale</h2>
            <p className="mt-2 max-w-md text-brand-100">
              Les grands axes de Madagascar sont pré-calibrés (distances & durées réelles).
              ONE WAY est multi-pays : Afrique francophone, Europe et Maghreb.
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

      {/* ── Pricing / Plans ──────────────────────────────────── */}
      <section className="container-app py-16">
        <h2 className="text-center text-3xl font-bold text-ink">Une tarification simple</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-ink-muted">
          Commission de {Math.round(MARKETPLACE.commissionRate * 100)} % par transaction.
          Passez Premium pour réduire la commission et accéder aux fonctions avancées.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {SUBSCRIPTION_PLANS.map((plan, i) => (
            <div
              key={plan.key}
              className={`card relative p-6 ${i === 1 ? 'ring-2 ring-brand-500' : ''}`}
            >
              {i === 1 && (
                <span className="absolute -top-3 left-6 chip bg-brand-600 text-white">Le plus populaire</span>
              )}
              <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
              <p className="text-xs text-ink-muted">{plan.audience}</p>
              <p className="mt-3 text-3xl font-extrabold text-ink">
                {plan.priceMonthly === 0 ? 'Gratuit' : moneyCompact(plan.priceMonthly)}
                {plan.priceMonthly > 0 && <span className="text-sm font-medium text-ink-muted">/mois</span>}
              </p>
              <ul className="mt-5 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-ink-soft">
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className={`btn mt-6 w-full ${i === 1 ? 'btn-primary' : 'btn-outline'}`}>
                Choisir
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="bg-amber-500">
        <div className="container-app flex flex-col items-center gap-5 py-14 text-center">
          <h2 className="text-3xl font-extrabold text-ink">Prêt à faire bouger vos marchandises ?</h2>
          <p className="max-w-xl text-ink-soft">
            Rejoignez ONE WAY et publiez votre premier fret en moins de 2 minutes.
          </p>
          <Link href="/register" className="btn bg-ink text-white hover:bg-ink-soft text-base">
            Créer mon compte gratuitement <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="bg-ink py-10 text-slate-300">
        <div className="container-app flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo light />
          <p className="text-center text-xs text-slate-400">
            One Way SARL · Transport · Livraison · Suivi Digital · Antananarivo, Madagascar 🇲🇬
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/calculateur" className="hover:text-white">Calculateur</Link>
            <Link href="/login" className="hover:text-white">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
