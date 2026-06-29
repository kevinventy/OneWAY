import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = { title: 'Inscription — ONE WAY' };

export default function RegisterPage({ searchParams }: { searchParams: { role?: string } }) {
  const role = searchParams.role === 'CARRIER' ? 'CARRIER' : 'SHIPPER';
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Créer un compte</h1>
      <p className="mt-1 text-sm text-ink-muted">Rejoignez le réseau ONE WAY en 2 minutes.</p>
      <div className="mt-6">
        <RegisterForm defaultRole={role} />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Déjà inscrit ?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
