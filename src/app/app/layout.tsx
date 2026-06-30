import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/labels';
import { Logo } from '@/components/brand/Logo';
import { Avatar } from '@/components/ui';
import { LogoutButton } from '@/components/app/LogoutButton';
import { BottomNav, SideNav, type NavItem } from '@/components/app/BottomNav';

const GERANT_NAV: NavItem[] = [
  { href: '/app/gerant', label: 'Tableau', icon: 'dashboard' },
  { href: '/app/gerant/courses', label: 'Courses', icon: 'courses' },
  { href: '/app/gerant/new', label: 'Nouvelle', icon: 'new' },
  { href: '/app/gerant/fleet', label: 'Flotte', icon: 'fleet' },
];

const CHAUFFEUR_NAV: NavItem[] = [
  { href: '/app/chauffeur', label: 'Mes missions', icon: 'missions' },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const nav = user.role === 'GERANT' ? GERANT_NAV : CHAUFFEUR_NAV;
  const home = user.role === 'GERANT' ? '/app/gerant' : '/app/chauffeur';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="container-app flex h-14 items-center justify-between gap-3">
          <Link href={home}>
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name={user.name} color={user.avatarColor} size={32} />
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">{user.name}</p>
                <p className="text-[11px] text-ink-muted">{user.companyName || ROLE_LABEL[user.role]}</p>
              </div>
            </div>
            <LogoutButton compact />
          </div>
        </div>
      </header>

      <div className="container-app grid gap-6 py-5 md:grid-cols-[200px_1fr]">
        {/* Desktop side nav */}
        <aside className="md:sticky md:top-20 md:self-start">
          <SideNav items={nav} />
        </aside>

        {/* Content */}
        <main className="min-w-0 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNav items={nav} />
    </div>
  );
}
