'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiDelete } from '@/lib/fetcher';
import { Ban, Loader2 } from 'lucide-react';

export function CancelCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`/api/courses/${courseId}`);
      router.refresh();
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Annulation impossible');
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="btn-outline w-full text-rose-600">
        <Ban size={16} /> Annuler la course
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-xl border border-rose-200 bg-rose-50 p-3">
      <p className="text-sm font-medium text-rose-700">Confirmer l&apos;annulation de cette course ?</p>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex gap-2">
        <button onClick={cancel} disabled={loading} className="btn bg-rose-600 text-white hover:bg-rose-700 flex-1">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />} Oui, annuler
        </button>
        <button onClick={() => setConfirming(false)} disabled={loading} className="btn-ghost flex-1">
          Retour
        </button>
      </div>
    </div>
  );
}
