'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';

export function ReviewForm({ shipmentId, targetName }: { shipmentId: string; targetName: string }) {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, rating, comment }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Envoi impossible');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return <div className="card p-4 text-sm text-emerald-700">Merci ! Votre évaluation de {targetName} a été enregistrée. ⭐</div>;
  }

  return (
    <div className="card p-4">
      <h3 className="font-semibold text-ink">Évaluer {targetName}</h3>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
            <Star size={26} className={(hover || rating) >= n ? 'fill-amber-400 stroke-amber-400' : 'stroke-slate-300'} />
          </button>
        ))}
      </div>
      <textarea className="input mt-3" rows={2} placeholder="Votre commentaire (optionnel)" value={comment} onChange={(e) => setComment(e.target.value)} />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      <button onClick={submit} disabled={loading} className="btn-primary mt-3 w-full">
        {loading && <Loader2 size={16} className="animate-spin" />} Envoyer l’évaluation
      </button>
    </div>
  );
}
