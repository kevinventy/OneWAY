import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireUser } from '@/lib/auth';
import { courseById, driverByUser } from '@/lib/queries';
import { advanceCourse } from '@/lib/services';

export const dynamic = 'force-dynamic';

/** Avancer une course d'une étape — gérant propriétaire OU chauffeur assigné. */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const course = courseById(params.id);
    if (!course) return fail(404, 'Course introuvable');
    const isOwner = user.role === 'GERANT' && course.ownerId === user.id;
    const isDriver = user.role === 'CHAUFFEUR' && driverByUser(user.id)?.id === course.driverId;
    if (!isOwner && !isDriver) return fail(404, 'Course introuvable');
    return ok(advanceCourse(params.id, user.id));
  });
}
