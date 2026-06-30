import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { coursesForOwner, driverById } from '@/lib/queries';
import { EmptyState, SectionTitle } from '@/components/ui';
import { CourseCard } from '@/components/course/CourseCard';
import type { Course } from '@/lib/types';
import { Plus, PackageX } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GerantCourses() {
  let user;
  try {
    user = await requireRole('GERANT');
  } catch {
    redirect('/app');
  }

  const courses = coursesForOwner(user.id);
  const toAssign = courses.filter((c) => c.status === 'NOUVELLE');
  const active = courses.filter((c) => !['LIVREE', 'ANNULEE', 'NOUVELLE'].includes(c.status));
  const done = courses.filter((c) => ['LIVREE', 'ANNULEE'].includes(c.status));

  const card = (c: Course) => (
    <CourseCard key={c.id} course={c} href={`/app/gerant/course/${c.id}`} driverName={driverById(c.driverId)?.name} />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-ink">Courses</h1>
        <Link href="/app/gerant/new" className="btn-primary"><Plus size={18} /><span className="hidden sm:inline">Nouvelle</span></Link>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={<PackageX size={32} />}
          title="Aucune course"
          description="Commencez par créer votre première course."
          action={<Link href="/app/gerant/new" className="btn-primary"><Plus size={18} /> Nouvelle course</Link>}
        />
      ) : (
        <>
          {toAssign.length > 0 && (
            <section>
              <SectionTitle title={`À assigner (${toAssign.length})`} />
              <div className="grid gap-3 sm:grid-cols-2">{toAssign.map(card)}</div>
            </section>
          )}
          {active.length > 0 && (
            <section>
              <SectionTitle title={`En cours (${active.length})`} />
              <div className="grid gap-3 sm:grid-cols-2">{active.map(card)}</div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <SectionTitle title={`Terminées (${done.length})`} />
              <div className="grid gap-3 sm:grid-cols-2">{done.map(card)}</div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
