'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

/** Barre de suivi par code (sans compte). */
export function TrackForm({ size = 'lg', autoFocus = false }: { size?: 'lg' | 'md'; autoFocus?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/suivi/${encodeURIComponent(c)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full items-center gap-2">
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Code de suivi (ex. OWTOA01)"
        className={size === 'lg'
          ? 'input flex-1 py-3.5 text-center text-lg font-bold tracking-widest sm:text-left'
          : 'input flex-1'}
        aria-label="Code de suivi"
      />
      <button type="submit" className={size === 'lg' ? 'btn-primary px-5 py-3.5' : 'btn-primary'}>
        <Search size={18} />
        <span className="hidden sm:inline">Suivre</span>
      </button>
    </form>
  );
}
