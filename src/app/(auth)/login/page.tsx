import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = { title: 'Connexion — ONE WAY' };

export default function LoginPage() {
  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-2xl font-bold text-ink">Connexion</h1>
      <p className="mt-1 text-sm text-ink-muted">Ravi de vous revoir sur ONE WAY.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-ink-muted">
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-semibold text-brand-600 hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
