import { NextRequest } from 'next/server';
import { handle, ok, fail } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { courseById } from '@/lib/queries';
import { assignCourse } from '@/lib/services';
import { assignSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Affecter un chauffeur à une course (gérant propriétaire). */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireRole('GERANT');
    const { driverId } = assignSchema.parse(await req.json());
    const course = courseById(params.id);
    if (!course || course.ownerId !== user.id) return fail(404, 'Course introuvable');
    // assignCourse re-vérifie ownerId du chauffeur ET de la course (cloisonnement).
    return ok(assignCourse(params.id, driverId, user.id));
  });
}
