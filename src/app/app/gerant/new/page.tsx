import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { NewCourseForm } from '@/components/gerant/NewCourseForm';

export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  try {
    await requireRole('GERANT');
  } catch {
    redirect('/app');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Nouvelle course</h1>
        <p className="text-sm text-ink-muted">
          Le prix et la distance sont calculés automatiquement. Un code de suivi sera généré pour le client.
        </p>
      </div>
      <NewCourseForm />
    </div>
  );
}
