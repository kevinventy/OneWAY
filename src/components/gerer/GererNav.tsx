import Link from 'next/link';
import { LayoutDashboard, Truck, Radio } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';

/** En-tête de l'espace transporteur (gérant / chauffeur). */
export function GererNav({ active }: { active?: 'gerer' | 'chauffeur' }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" aria-label="Accueil One Way">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/gerer"
            className={active === 'gerer' ? 'btn-primary' : 'btn-ghost'}
          >
            <LayoutDashboard size={16} /> <span className="hidden sm:inline">Gérant</span>
          </Link>
          <Link
            href="/chauffeur"
            className={active === 'chauffeur' ? 'btn-primary' : 'btn-ghost'}
          >
            <Truck size={16} /> <span className="hidden sm:inline">Chauffeur</span>
          </Link>
          <Link href="/suivi" className="btn-outline">
            <Radio size={16} /> <span className="hidden sm:inline">Suivi</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
