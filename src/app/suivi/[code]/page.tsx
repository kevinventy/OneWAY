import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { TrackForm } from '@/components/track/TrackForm';
import { LiveTracking } from '@/components/track/LiveTracking';
import { trackingByCode } from '@/lib/tracking';
import { COMPANY, telHref } from '@/data/company';
import { ArrowLeft, Phone, SearchX } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Suivi — ONE WAY' };

export default function TrackingResult({ params }: { params: { code: string } }) {
  const code = decodeURIComponent(params.code).toUpperCase();
  const data = trackingByCode(code);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="container-app flex h-14 items-center justify-between">
          <Link href="/"><Logo /></Link>
          <a href={telHref(COMPANY.phoneIntl)} className="btn-ghost px-2.5"><Phone size={18} /></a>
        </div>
      </header>

      <main className="container-app max-w-lg py-6">
        <Link href="/suivi" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted">
          <ArrowLeft size={16} /> Nouveau suivi
        </Link>

        {data ? (
          <LiveTracking initial={data} code={code} />
        ) : (
          <div className="card p-6 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
              <SearchX size={28} />
            </span>
            <h1 className="mt-4 text-lg font-extrabold text-ink">Code introuvable</h1>
            <p className="mt-1 text-sm text-ink-muted">
              Le code <span className="font-mono font-bold text-ink">{code}</span> ne correspond à aucune livraison.
              Vérifiez le code reçu par WhatsApp.
            </p>
            <div className="mt-5">
              <TrackForm size="md" />
            </div>
            <a href={telHref(COMPANY.phoneIntl)} className="btn-outline mt-3 w-full">
              <Phone size={16} /> Contacter ONE WAY
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
