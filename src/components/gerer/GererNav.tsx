import Link from 'next/link';
import { LayoutDashboard, Truck, Radio, Users } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { LogoutButton } from '@/components/app/LogoutButton';
import type { PublicUser } from '@/lib/types';

/** En-tête de l'espace transporteur (gérant / chauffeur). */
export function GererNav({
  active,
  user,
}: {
  active?: 'gerer' | 'chauffeur' | 'flotte';
  user?: PublicUser | null;
}) {
  const isGerant = user?.role === 'ADMIN' || user?.role === 'CARRIER';

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between gap-2">
        <Link href="/" aria-label="Accueil One Way">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {isGerant && (
            <>
              <Link href="/gerer" className={active === 'gerer' ? 'btn-primary' : 'btn-ghost'}>
                <LayoutDashboard size={16} /> <span className="hidden sm:inline">Tableau de bord</span>
              </Link>
              <Link href="/gerer/flotte" className={active === 'flotte' ? 'btn-primary' : 'btn-ghost'}>
                <Users size={16} /> <span className="hidden sm:inline">Flotte</span>
              </Link>
            </>
          )}
          {user?.role === 'DRIVER' && (
            <Link href="/chauffeur" className={active === 'chauffeur' ? 'btn-primary' : 'btn-ghost'}>
              <Truck size={16} /> <span className="hidden sm:inline">Mes missions</span>
            </Link>
          )}
          <Link href="/suivi" className="btn-outline">
            <Radio size={16} /> <span className="hidden sm:inline">Suivi</span>
          </Link>
          {user && (
            <div className="ml-1 hidden sm:block">
              <LogoutButton compact />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
