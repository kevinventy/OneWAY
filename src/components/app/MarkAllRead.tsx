'use client';

import { useRouter } from 'next/navigation';
import { CheckCheck } from 'lucide-react';

export function MarkAllRead() {
  const router = useRouter();
  async function run() {
    await fetch('/api/notifications', { method: 'PATCH' });
    router.refresh();
  }
  return (
    <button onClick={run} className="btn-ghost text-sm">
      <CheckCheck size={16} /> Tout marquer comme lu
    </button>
  );
}
