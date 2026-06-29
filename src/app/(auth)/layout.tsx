import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Logo } from '@/components/brand/Logo';
import { getCurrentUser } from '@/lib/auth';
import { Radio, ShieldCheck, Star } from 'lucide-react';

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
            Le fret, <span className="text-amber-400">en un sens.</span>
          </h2>
          <p className="mt-3 max-w-sm text-brand-100">
            La marketplace qui connecte chargeurs et transporteurs à Madagascar et au-delà.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-100">
            <li className="flex items-center gap-2"><Radio size={18} className="text-amber-400" /> Suivi GPS en temps réel</li>
            <li className="flex items-center gap-2"><ShieldCheck size={18} className="text-amber-400" /> Paiement sécurisé & assurance</li>
            <li className="flex items-center gap-2"><Star size={18} className="text-amber-400" /> Transporteurs vérifiés et notés</li>
          </ul>
        </div>
        <p className="text-xs text-brand-200">One Way SARL · Antananarivo, Madagascar 🇲🇬</p>
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
