'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/fetcher';
import { STATUS_ACTION, nextCourseStatus } from '@/lib/labels';
import type { CourseStatus } from '@/lib/types';
import { ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';

/** Bouton « étape suivante » (gros, simple) pour gérant ou chauffeur. */
export function AdvanceButton({ courseId, status }: { courseId: string; status: CourseStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = nextCourseStatus(status);
  if (status === 'NOUVELLE') {
    return (
      <p className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-700">
        En attente d&apos;affectation d&apos;un chauffeur.
      </p>
    );
  }
  if (!next) {
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
        <CheckCircle2 size={18} /> Livraison confirmée
      </p>
    );
  }

  const label = STATUS_ACTION[status] ?? 'Étape suivante';
  const isFinal = next === 'LIVREE';

  async function advance() {
    setLoading(true);
    setError(null);
    try {
      await apiPost(`/api/courses/${courseId}/advance`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={advance}
        disabled={loading}
        className={isFinal ? 'btn bg-emerald-600 text-white hover:bg-emerald-700 w-full py-4 text-base' : 'btn-primary w-full py-4 text-base'}
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
        {label}
      </button>
      {error && <p className="text-center text-sm font-medium text-rose-600">{error}</p>}
    </div>
  );
}
