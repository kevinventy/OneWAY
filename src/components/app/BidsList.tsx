'use client';

import { useState } from 'react';
import { Loader2, Check, Clock, Star, BadgeCheck } from 'lucide-react';
import { money, duration } from '@/lib/format';
import { BID_STATUS } from '@/lib/labels';
import { Badge, Avatar } from '@/components/ui';
import type { BidStatus } from '@/lib/types';

export interface BidRow {
  id: string;
  amount: number;
  etaHours: number;
  message?: string;
  status: BidStatus;
  carrier: {
    name: string;
    companyName?: string;
    rating: number;
    ratingCount: number;
    premium: boolean;
    city?: string;
    avatarColor: string;
  };
}

export function BidsList({ bids, canAccept }: { bids: BidRow[]; canAccept: boolean }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function accept(bidId: string) {
    setError('');
    setLoadingId(bidId);
    try {
      const res = await fetch(`/api/bids/${bidId}/accept`, { method: 'POST' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Action impossible');
      window.location.href = `/app/shipper/tracking/${json.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setLoadingId(null);
    }
  }

  if (bids.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-ink-muted">
        Aucune offre reçue pour l’instant. Les transporteurs sont notifiés — revenez bientôt !
      </div>
    );
  }

  const best = Math.min(...bids.filter((b) => b.status === 'PENDING').map((b) => b.amount));

  return (
    <div className="space-y-3">
      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}
      {bids.map((b) => (
        <div key={b.id} className="card p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={b.carrier.companyName ?? b.carrier.name} color={b.carrier.avatarColor} size={40} />
              <div>
                <p className="flex items-center gap-1.5 font-semibold text-ink">
                  {b.carrier.companyName ?? b.carrier.name}
                  {b.carrier.premium && <BadgeCheck size={15} className="text-brand-600" />}
                </p>
                <p className="flex items-center gap-2 text-xs text-ink-muted">
                  <span className="flex items-center gap-0.5 text-amber-500">
                    <Star size={12} className="fill-amber-400 stroke-amber-400" />
                    <span className="font-semibold text-ink">{b.carrier.rating.toFixed(1)}</span>
                    <span>({b.carrier.ratingCount})</span>
                  </span>
                  {b.carrier.city && <span>· {b.carrier.city}</span>}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-ink">{money(b.amount)}</p>
              {b.amount === best && b.status === 'PENDING' && <Badge tone="green">Meilleure offre</Badge>}
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
            <span className="flex items-center gap-1"><Clock size={13} /> Délai {duration(b.etaHours)}</span>
            {b.status !== 'PENDING' && <Badge tone={BID_STATUS[b.status].tone}>{BID_STATUS[b.status].label}</Badge>}
          </div>

          {b.message && <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-ink-soft">“{b.message}”</p>}

          {canAccept && b.status === 'PENDING' && (
            <button onClick={() => accept(b.id)} disabled={loadingId !== null} className="btn-primary mt-3 w-full">
              {loadingId === b.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Accepter cette offre
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
