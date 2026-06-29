'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';

export function KycReview({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'VERIFIED' | 'REJECTED' | null>(null);

  async function set(next: 'VERIFIED' | 'REJECTED') {
    setLoading(next);
    try {
      await fetch(`/api/admin/kyc/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  if (status === 'VERIFIED') return <span className="chip bg-emerald-100 text-emerald-700">Vérifié ✓</span>;
  if (status === 'REJECTED') return <span className="chip bg-rose-100 text-rose-600">Rejeté</span>;

  return (
    <div className="flex gap-2">
      <button onClick={() => set('VERIFIED')} disabled={loading !== null} className="btn bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700">
        {loading === 'VERIFIED' ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Valider
      </button>
      <button onClick={() => set('REJECTED')} disabled={loading !== null} className="btn bg-rose-600 px-3 py-1.5 text-xs text-white hover:bg-rose-700">
        {loading === 'REJECTED' ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Rejeter
      </button>
    </div>
  );
}
