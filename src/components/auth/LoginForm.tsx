'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/fetcher';
import { LogIn, Loader2 } from 'lucide-react';

const DEMO = [
  { role: 'Gérant', email: 'gerant@oneway.mg' },
  { role: 'Chauffeur', email: 'chauffeur@oneway.mg' },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/auth/login', { email, password });
      router.replace('/app');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
      setLoading(false);
    }
  }

  function fill(demoEmail: string) {
    setEmail(demoEmail);
    setPassword('oneway123');
    setError(null);
  }

  return (
    <div className="card p-6">
      <h1 className="text-xl font-extrabold text-ink">Connexion</h1>
      <p className="mt-1 text-sm text-ink-muted">Espace gérant &amp; chauffeur ONE WAY.</p>

      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            className="input"
            placeholder="vous@oneway.mg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <LogIn size={18} />}
          Se connecter
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Comptes de démonstration</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {DEMO.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => fill(d.email)}
              className="btn-outline flex-col items-start gap-0 py-2 text-left"
            >
              <span className="text-sm font-semibold text-ink">{d.role}</span>
              <span className="text-[11px] text-ink-muted">{d.email}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">Mot de passe : <span className="font-semibold">oneway123</span></p>
      </div>
    </div>
  );
}
