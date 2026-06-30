'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Package, PlusCircle, Truck, ClipboardList } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: 'dashboard' | 'courses' | 'new' | 'fleet' | 'missions';
}

const ICONS = {
  dashboard: LayoutDashboard,
  courses: Package,
  new: PlusCircle,
  fleet: Truck,
  missions: ClipboardList,
};

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition',
                  active ? 'text-brand-600' : 'text-ink-muted',
                )}
              >
                <Icon size={22} className={active ? 'fill-brand-50' : ''} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SideNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="hidden md:block">
      <ul className="space-y-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || (item.href !== '/app' && pathname.startsWith(item.href));
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                  active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-100',
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
