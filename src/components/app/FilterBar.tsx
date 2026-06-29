'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { CARGO_TYPES, VEHICLE_TYPES } from '@/data/catalog';

export function FilterBar() {
  const router = useRouter();
  const params = useSearchParams();

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`/app/carrier?${next.toString()}`);
  }

  return (
    <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          className="input pl-9"
          placeholder="Rechercher (ville, marchandise…)"
          defaultValue={params.get('q') ?? ''}
          onChange={(e) => setParam('q', e.target.value)}
        />
      </div>
      <select className="input sm:w-44" value={params.get('vehicle') ?? ''} onChange={(e) => setParam('vehicle', e.target.value)}>
        <option value="">Tous véhicules</option>
        {VEHICLE_TYPES.map((v) => (
          <option key={v.key} value={v.key}>{v.label}</option>
        ))}
      </select>
      <select className="input sm:w-44" value={params.get('cargo') ?? ''} onChange={(e) => setParam('cargo', e.target.value)}>
        <option value="">Toute marchandise</option>
        {CARGO_TYPES.map((c) => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}
