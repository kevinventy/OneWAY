import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';
import { Calculator } from 'lucide-react';

export function PublicNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" aria-label="Accueil ONE WAY">
          <Logo />
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <Link href="/calculateur" className="btn-ghost hidden sm:inline-flex">
            <Calculator size={16} /> Calculateur
          </Link>
          <Link href="/login" className="btn-outline">
            Connexion
          </Link>
          <Link href="/register" className="btn-primary">
            Commencer
          </Link>
        </nav>
      </div>
    </header>
  );
}
