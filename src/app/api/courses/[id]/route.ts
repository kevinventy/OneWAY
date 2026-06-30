import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireUser, requireRole } from '@/lib/auth';
import { courseById, driverByUser } from '@/lib/queries';
import { cancelCourse } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** Détail d'une course — gérant propriétaire OU chauffeur assigné uniquement. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const course = courseById(params.id);
    // 404 (et non 403) pour ne pas révéler l'existence d'une course tierce (anti-IDOR).
    if (!course) return fail(404, 'Course introuvable');
    const allowed =
      (user.role === 'GERANT' && course.ownerId === user.id) ||
      (user.role === 'CHAUFFEUR' && driverByUser(user.id)?.id === course.driverId);
    if (!allowed) return fail(404, 'Course introuvable');
    return ok(course);
  });
}

/** Annulation d'une course (gérant propriétaire). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireRole('GERANT');
    const course = courseById(params.id);
    if (!course || course.ownerId !== user.id) return fail(404, 'Course introuvable');
    return ok(cancelCourse(params.id, user.id));
  });
}
