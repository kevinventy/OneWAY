'use client';

import { useState } from 'react';
import { Loader2, PackageCheck, Truck } from 'lucide-react';

type Role = 'SHIPPER' | 'CARRIER';

export function RegisterForm({ defaultRole = 'SHIPPER' }: { defaultRole?: Role }) {
  const [role, setRole] = useState<Role>(defaultRole);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', companyName: '', city: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, ...form, weightKg: undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Inscription impossible');
      window.location.href = '/app';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setRole('SHIPPER')} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-semibold transition ${role === 'SHIPPER' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft'}`}>
          <PackageCheck size={20} /> Chargeur
        </button>
        <button type="button" onClick={() => setRole('CARRIER')} className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-sm font-semibold transition ${role === 'CARRIER' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft'}`}>
          <Truck size={20} /> Transporteur
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Nom complet</label>
          <input className="input" value={form.name} onChange={set('name')} required placeholder="Hery Rakoto" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="vous@email.mg" />
        </div>
        <div>
          <label className="label">Téléphone</label>
          <input className="input" value={form.phone} onChange={set('phone')} required placeholder="+261 34 00 000 00" />
        </div>
        <div>
          <label className="label">{role === 'CARRIER' ? 'Société / Flotte' : 'Société (optionnel)'}</label>
          <input className="input" value={form.companyName} onChange={set('companyName')} placeholder="Trans Express Mada" />
        </div>
        <div>
          <label className="label">Ville</label>
          <input className="input" value={form.city} onChange={set('city')} placeholder="Antananarivo" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Mot de passe</label>
          <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="6 caractères minimum" />
        </div>
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading && <Loader2 size={16} className="animate-spin" />} Créer mon compte
      </button>
      <p className="text-center text-xs text-ink-muted">
        En vous inscrivant, vous acceptez les conditions générales et la politique de confidentialité (RGPD) de ONE WAY.
      </p>
    </form>
  );
}
