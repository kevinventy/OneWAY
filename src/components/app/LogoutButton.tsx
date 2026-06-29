'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }
  return (
    <button onClick={logout} className="btn-outline w-full text-rose-600">
      <LogOut size={16} /> Se déconnecter
    </button>
  );
}
