'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/fetcher';
import { UserCheck, Loader2 } from 'lucide-react';

export interface AssignableDriver {
  id: string;
  name: string;
  status: string;
  vehicleName?: string;
  available: boolean;
}

export function AssignDriver({ courseId, drivers }: { courseId: string; drivers: AssignableDriver[] }) {
  const router = useRouter();
  const [driverId, setDriverId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function assign() {
    if (!driverId) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost(`/api/courses/${courseId}/assign`, { driverId });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Affectation impossible');
    } finally {
      setLoading(false);
    }
  }

  if (drivers.length === 0) {
    return (
      <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-ink-muted">
        Aucun chauffeur enregistré. Ajoutez un chauffeur dans la Flotte.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="label">Affecter un chauffeur</label>
      <select className="input" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
        <option value="">— Choisir un chauffeur —</option>
        {drivers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
            {d.vehicleName ? ` · ${d.vehicleName}` : ''}
            {d.available ? '' : ' (en mission)'}
          </option>
        ))}
      </select>
      {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
      <button onClick={assign} disabled={!driverId || loading} className="btn-primary w-full">
        {loading ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
        Affecter &amp; démarrer
      </button>
    </div>
  );
}
