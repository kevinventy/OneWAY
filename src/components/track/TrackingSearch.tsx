'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Boîte de suivi publique — saisie d'un code → /suivi/[code].
 * Réutilisée par la vitrine (/apercu) et la page /suivi. Aucun compte requis.
 */
export function TrackingSearch({
  className,
  placeholder = 'Code de suivi — ex. OWMG3456',
  cta = 'Suivre',
  autoFocus = false,
}: {
  className?: string;
  placeholder?: string;
  cta?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c) router.push(`/suivi/${encodeURIComponent(c)}`);
  }

  return (
    <form
      onSubmit={submit}
      className={cn('rounded-2xl bg-white p-2 shadow-pop sm:flex sm:items-center sm:gap-2', className)}
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search size={18} className="shrink-0 text-ink-muted" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full bg-transparent py-3 text-sm uppercase text-ink outline-none placeholder:normal-case placeholder:text-slate-400"
          aria-label="Code de suivi"
        />
      </div>
      <button type="submit" className="btn-accent m-1 w-full text-base sm:w-auto">
        <Radio size={18} /> {cta}
      </button>
    </form>
  );
}
