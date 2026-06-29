'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const DEMO = [
  { label: 'Chargeur', email: 'chargeur@oneway.mg', emoji: '📦' },
  { label: 'Transporteur', email: 'transporteur@oneway.mg', emoji: '🚛' },
  { label: 'Chauffeur', email: 'chauffeur@oneway.mg', emoji: '🧑‍✈️' },
  { label: 'Admin', email: 'admin@oneway.mg', emoji: '🛠️' },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent, creds?: { email: string; password: string }) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds ?? { email, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Connexion impossible');
      window.location.href = '/app';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@email.mg" />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading && <Loader2 size={16} className="animate-spin" />} Se connecter
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-slate-200" /> Comptes de démonstration <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {DEMO.map((d) => (
          <button
            key={d.email}
            onClick={(e) => submit(e, { email: d.email, password: 'oneway123' })}
            disabled={loading}
            className="btn-outline justify-start text-sm"
          >
            <span>{d.emoji}</span> {d.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-ink-muted">Mot de passe démo : <code className="rounded bg-slate-100 px-1">oneway123</code></p>
    </div>
  );
}
