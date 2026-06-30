import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { coursesForOwner, gerantStats } from '@/lib/queries';
import { Stat, EmptyState, SectionTitle } from '@/components/ui';
import { CourseCard } from '@/components/course/CourseCard';
import { moneyCompact } from '@/lib/format';
import { Activity, CheckCircle2, AlertCircle, Wallet, Plus, PackageX } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GerantDashboard() {
  let user;
  try {
    user = await requireRole('GERANT');
  } catch {
    redirect('/app');
  }

  const stats = gerantStats(user.id);
  const courses = coursesForOwner(user.id);
  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Tableau de bord</h1>
          <p className="text-sm text-ink-muted">{user.companyName || 'ONE WAY'}</p>
        </div>
        <Link href="/app/gerant/new" className="btn-primary hidden sm:inline-flex">
          <Plus size={18} /> Nouvelle course
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Courses actives" value={stats.active} icon={<Activity size={16} />} tone="blue" />
        <Stat label="À assigner" value={stats.toAssign} icon={<AlertCircle size={16} />} tone="red" />
        <Stat label="Livrées" value={stats.delivered} icon={<CheckCircle2 size={16} />} tone="green" />
        <Stat label="CA livré" value={moneyCompact(stats.ca)} icon={<Wallet size={16} />} tone="amber" />
      </div>

      {/* Courses en cours */}
      <div>
        <SectionTitle
          title="Courses en cours"
          action={<Link href="/app/gerant/courses" className="text-sm font-semibold text-brand-600">Tout voir</Link>}
        />
        {active.length === 0 ? (
          <EmptyState
            icon={<PackageX size={32} />}
            title="Aucune course active"
            description="Créez une course pour démarrer un transport et générer un code de suivi."
            action={<Link href="/app/gerant/new" className="btn-primary"><Plus size={18} /> Nouvelle course</Link>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((c) => (
              <CourseCard key={c.id} course={c} href={`/app/gerant/course/${c.id}`} />
            ))}
          </div>
        )}
      </div>

      {/* Bouton mobile */}
      <Link href="/app/gerant/new" className="btn-primary w-full sm:hidden">
        <Plus size={18} /> Nouvelle course
      </Link>
    </div>
  );
}
