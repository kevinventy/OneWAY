import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { TrackForm } from '@/components/track/TrackForm';
import { COMPANY, telHref } from '@/data/company';
import { PackageSearch, Phone, ArrowLeft } from 'lucide-react';

export const metadata: Metadata = { title: 'Suivre une livraison — ONE WAY' };

export default function SuiviPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white pt-[env(safe-area-inset-top)]">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/"><Logo /></Link>
          <a href={telHref(COMPANY.phoneIntl)} className="btn-ghost px-2.5"><Phone size={18} /></a>
        </div>
      </header>

      <main className="container-app max-w-lg py-12">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <ArrowLeft size={16} /> Accueil
        </Link>

        <div className="card p-6 text-center">
          <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <PackageSearch size={28} />
          </span>
          <h1 className="mt-4 text-xl font-extrabold text-ink">Suivre une livraison</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Entrez le code de suivi reçu par WhatsApp. Aucun compte n&apos;est nécessaire.
          </p>
          <div className="mt-5">
            <TrackForm autoFocus />
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-ink-muted">
          Vous n&apos;avez pas de code ?{' '}
          <a href={telHref(COMPANY.phoneIntl)} className="font-semibold text-brand-600">Contactez ONE WAY</a>
        </p>
      </main>
    </div>
  );
}
