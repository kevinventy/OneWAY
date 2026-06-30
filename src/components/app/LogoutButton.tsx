'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton({ compact = false }: { compact?: boolean }) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  if (compact) {
    return (
      <button onClick={logout} className="btn-ghost text-rose-600" aria-label="Se déconnecter" title="Se déconnecter">
        <LogOut size={16} /> <span className="hidden lg:inline">Quitter</span>
      </button>
    );
  }
  return (
    <button onClick={logout} className="btn-outline w-full text-rose-600">
      <LogOut size={16} /> Se déconnecter
    </button>
  );
}
