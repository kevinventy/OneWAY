'use client';

import { useState } from 'react';
import { Loader2, Gavel } from 'lucide-react';
import { money } from '@/lib/format';

interface VehicleOption {
  id: string;
  label: string;
}

export function BidForm({
  freightId,
  suggestedPrice,
  vehicles,
  existing,
}: {
  freightId: string;
  suggestedPrice: number;
  vehicles: VehicleOption[];
  existing?: { amount: number; etaHours: number; message?: string; vehicleId?: string } | null;
}) {
  const [amount, setAmount] = useState(existing?.amount ?? suggestedPrice);
  const [etaHours, setEtaHours] = useState(existing?.etaHours ?? 6);
  const [message, setMessage] = useState(existing?.message ?? '');
  const [vehicleId, setVehicleId] = useState(existing?.vehicleId ?? vehicles[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/freight/${freightId}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, etaHours, message, vehicleId: vehicleId || undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Offre impossible');
      setDone(true);
      setTimeout(() => (window.location.href = '/app/carrier/missions'), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoading(false);
    }
  }

  if (done) {
    return <div className="card p-4 text-sm text-emerald-700">✅ Offre envoyée ! Le chargeur en est notifié.</div>;
  }

  return (
    <div className="card p-4">
      <h3 className="flex items-center gap-2 font-bold text-ink"><Gavel size={18} className="text-amber-500" /> {existing ? 'Modifier mon offre' : 'Proposer un prix'}</h3>
      <div className="mt-3 space-y-3">
        <div>
          <label className="label">Votre prix (Ar)</label>
          <input className="input" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <p className="mt-1 text-xs text-ink-muted">Estimation ONE WAY : {money(suggestedPrice)}</p>
        </div>
        <div>
          <label className="label">Délai de livraison (heures)</label>
          <input className="input" type="number" value={etaHours} onChange={(e) => setEtaHours(Number(e.target.value))} />
        </div>
        {vehicles.length > 0 && (
          <div>
            <label className="label">Véhicule affecté</label>
            <select className="input" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.label}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label">Message (optionnel)</label>
          <textarea className="input" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Disponibilité, expérience sur l’axe…" />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <button onClick={submit} disabled={loading} className="btn-primary w-full">
          {loading && <Loader2 size={16} className="animate-spin" />} {existing ? 'Mettre à jour' : 'Envoyer l’offre'}
        </button>
      </div>
    </div>
  );
}
