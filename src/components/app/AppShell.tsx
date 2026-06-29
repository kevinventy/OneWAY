'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  PlusCircle,
  Radio,
  Truck,
  Boxes,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Bell,
  LogOut,
  Map,
  ClipboardList,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui';
import { ROLE_LABEL } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { PublicUser } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV: Record<string, NavItem[]> = {
  SHIPPER: [
    { href: '/app/shipper', label: 'Accueil', icon: <Home size={20} /> },
    { href: '/app/shipper/new', label: 'Publier', icon: <PlusCircle size={20} /> },
    { href: '/app/shipper/shipments', label: 'Suivi', icon: <Radio size={20} /> },
    { href: '/app/account', label: 'Compte', icon: <Avatar name="" size={20} /> },
  ],
  CARRIER: [
    { href: '/app/carrier', label: 'Fret', icon: <Boxes size={20} /> },
    { href: '/app/carrier/missions', label: 'Missions', icon: <ClipboardList size={20} /> },
    { href: '/app/carrier/fleet', label: 'Flotte', icon: <Truck size={20} /> },
    { href: '/app/account', label: 'Compte', icon: <Avatar name="" size={20} /> },
  ],
  DRIVER: [
    { href: '/app/driver', label: 'Missions', icon: <Map size={20} /> },
    { href: '/app/account', label: 'Compte', icon: <Avatar name="" size={20} /> },
  ],
  ADMIN: [
    { href: '/app/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { href: '/app/admin/kyc', label: 'KYC', icon: <ShieldCheck size={20} /> },
    { href: '/app/admin/users', label: 'Utilisateurs', icon: <Users size={20} /> },
    { href: '/app/account', label: 'Compte', icon: <Avatar name="" size={20} /> },
  ],
};

export function AppShell({
  user,
  unread,
  children,
}: {
  user: PublicUser;
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV[user.role] ?? [];

  const isActive = (href: string) =>
    href === `/app/${user.role.toLowerCase()}` ? pathname === href : pathname.startsWith(href);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-app flex h-16 items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/app/notifications" className="relative rounded-xl p-2 hover:bg-slate-100" aria-label="Notifications">
              <Bell size={20} className="text-ink-soft" />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 hover:bg-slate-100">
                <Avatar name={user.name} color={user.avatarColor} size={32} />
                <span className="hidden text-sm font-semibold text-ink sm:block">{user.name.split(' ')[0]}</span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop">
                  <div className="px-3 py-2">
                    <p className="text-sm font-semibold text-ink">{user.companyName || user.name}</p>
                    <p className="text-xs text-ink-muted">{ROLE_LABEL[user.role]}</p>
                  </div>
                  <Link href="/app/account" onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">
                    Mon compte
                  </Link>
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                    <LogOut size={16} /> Se déconnecter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container-app flex gap-6 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="sticky top-20 space-y-1">
            {items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  isActive(it.href) ? 'bg-brand-600 text-white shadow-sm' : 'text-ink-soft hover:bg-slate-100',
                )}
              >
                {it.icon}
                {it.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 pb-24 lg:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[11px] font-medium transition',
                isActive(it.href) ? 'text-brand-600' : 'text-ink-muted',
              )}
            >
              {it.icon}
              {it.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* click-away for menu */}
      {menuOpen && <button className="fixed inset-0 z-30 cursor-default" aria-hidden onClick={() => setMenuOpen(false)} />}
    </div>
  );
}
