'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiPost } from '@/lib/fetcher';
import { LogOut } from 'lucide-react';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      await apiPost('/api/auth/logout');
    } catch {
      /* ignore */
    }
    router.replace('/login');
    router.refresh();
  }

  return (
    <button onClick={logout} disabled={loading} className="btn-ghost px-2.5 py-1.5 text-ink-muted" aria-label="Se déconnecter">
      <LogOut size={18} />
      {!compact && <span className="text-sm">Déconnexion</span>}
    </button>
  );
}
