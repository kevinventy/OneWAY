import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { getCurrentUser } from '@/lib/auth';
import { COMPANY } from '@/data/company';
import { Radio, ShieldCheck, MapPin } from 'lucide-react';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect('/app');

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-gradient-to-b from-brand-950 to-brand-800 p-10 text-white lg:flex">
        <Link href="/">
          <Logo light />
        </Link>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Votre marchandise, <span className="text-amber-400">en un sens.</span>
          </h2>
          <p className="mt-3 max-w-sm text-brand-100">
            L&apos;application de pilotage de {COMPANY.legalName} : créez vos courses, affectez vos chauffeurs,
            suivez chaque livraison en temps réel.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-100">
            <li className="flex items-center gap-2"><Radio size={18} className="text-amber-400" /> Suivi en temps réel</li>
            <li className="flex items-center gap-2"><MapPin size={18} className="text-amber-400" /> Kilomètres restants en direct</li>
            <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-amber-400" /> Accès sécurisé par rôle</li>
          </ul>
        </div>
        <p className="text-xs text-brand-200">{COMPANY.legalName} · {COMPANY.city}, {COMPANY.country} {COMPANY.flag}</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <Link href="/">
              <Logo />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
