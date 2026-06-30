import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { driverByUser, coursesForDriver } from '@/lib/queries';
import { CourseCard } from '@/components/course/CourseCard';
import { EmptyState, SectionTitle } from '@/components/ui';
import { Coffee, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ChauffeurHome() {
  let user;
  try {
    user = await requireRole('CHAUFFEUR');
  } catch {
    redirect('/app');
  }

  const driver = driverByUser(user.id);
  const courses = coursesForDriver(user.id);
  const active = courses.filter((c) => !['LIVREE', 'ANNULEE'].includes(c.status));
  const done = courses.filter((c) => ['LIVREE', 'ANNULEE'].includes(c.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Bonjour {user.name.split(' ')[0]} 👋</h1>
        <p className="text-sm text-ink-muted">
          {active.length > 0 ? `${active.length} mission${active.length > 1 ? 's' : ''} en cours` : 'Aucune mission en cours'}
        </p>
      </div>

      {!driver && (
        <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Votre compte n&apos;est rattaché à aucun chauffeur. Contactez votre gérant.
        </p>
      )}

      {active.length === 0 && done.length === 0 ? (
        <EmptyState icon={<Coffee size={32} />} title="Pas de mission pour le moment" description="Vos missions s'afficheront ici dès qu'une course vous sera affectée." />
      ) : (
        <>
          {active.length > 0 && (
            <section>
              <SectionTitle title="Missions en cours" />
              <div className="space-y-3">
                {active.map((c) => (
                  <CourseCard key={c.id} course={c} href={`/app/chauffeur/course/${c.id}`} showPrice={false} />
                ))}
              </div>
            </section>
          )}
          {done.length > 0 && (
            <section>
              <SectionTitle title="Terminées" />
              <div className="space-y-3">
                {done.map((c) => (
                  <CourseCard key={c.id} course={c} href={`/app/chauffeur/course/${c.id}`} showPrice={false} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
