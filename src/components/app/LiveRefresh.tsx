'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Polls the server component tree to reflect live tracking updates. */
export function LiveRefresh({ intervalMs = 10000, enabled = true }: { intervalMs?: number; enabled?: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, enabled]);
  return null;
}
