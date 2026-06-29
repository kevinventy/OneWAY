'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Camera, CheckCircle2, Navigation } from 'lucide-react';
import { STATUS_ACTION, STATUS_FLOW, STATUS_LABEL, nextStatus } from '@/lib/flow';
import type { ShipmentStatus } from '@/lib/types';

export function AdvanceControls({ shipmentId, status }: { shipmentId: string; status: ShipmentStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');
  const [withPhoto, setWithPhoto] = useState(false);
  const [error, setError] = useState('');
  const next = nextStatus(status);
  const currentIndex = STATUS_FLOW.indexOf(status);

  async function advance() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note || undefined, photoUrl: withPhoto ? 'photo://capture.jpg' : undefined }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Action impossible');
      setNote('');
      setWithPhoto(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-4">
      <h3 className="flex items-center gap-2 font-bold text-ink"><Navigation size={18} className="text-brand-600" /> Avancement de la mission</h3>

      {/* Stepper */}
      <div className="mt-3 flex items-center gap-1">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= currentIndex ? 'bg-amber-500' : 'bg-slate-200'}`} />
        ))}
      </div>
      <p className="mt-2 text-sm font-medium text-ink">État actuel : {STATUS_LABEL[status]}</p>

      {next ? (
        <div className="mt-3 space-y-3">
          <input className="input" placeholder="Note (optionnel) — ex : route coupée, RAS…" value={note} onChange={(e) => setNote(e.target.value)} />
          <button
            type="button"
            onClick={() => setWithPhoto((p) => !p)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium ${withPhoto ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-ink-soft'}`}
          >
            <Camera size={16} /> {withPhoto ? 'Photo jointe ✓' : 'Joindre une photo (chargement/état)'}
          </button>
          {error && <p className="text-sm text-rose-600">{error}</p>}
          <button onClick={advance} disabled={loading} className="btn-accent w-full">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} {STATUS_ACTION[status] ?? `Passer à : ${STATUS_LABEL[next]}`}
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">✅ Mission livrée et terminée.</div>
      )}
    </div>
  );
}
