import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { ProLoginForm } from '@/components/auth/ProLoginForm';

export const metadata = { title: 'Espace pro — One Way' };
export const dynamic = 'force-dynamic';

/** N'accepte qu'un chemin interne relatif (anti open-redirect). */
function safeNext(raw?: string): string | undefined {
  if (!raw || typeof raw !== 'string') return undefined;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return undefined;
  return raw;
}

export default function ConnexionPage({ searchParams }: { searchParams: { next?: string } }) {
  const next = safeNext(typeof searchParams.next === 'string' ? searchParams.next : undefined);
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-app flex h-16 items-center">
          <Link href="/" aria-label="Accueil One Way">
            <Logo />
          </Link>
        </div>
      </header>
      <main className="container-app flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-ink">Espace pro</h1>
            <p className="mt-1 text-sm text-ink-muted">Connexion gérant ou chauffeur.</p>
            <div className="mt-6">
              <ProLoginForm next={next} />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-ink-muted">
            Vous suivez une livraison ?{' '}
            <Link href="/suivi" className="font-semibold text-brand-600 hover:underline">
              Suivre un colis
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
