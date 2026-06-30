import { NextRequest } from 'next/server';
import { handle, ok } from '@/lib/api';
import { requireRole } from '@/lib/auth';
import { coursesForOwner } from '@/lib/queries';
import { createCourse } from '@/lib/services';
import { courseSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** Liste des courses du gérant connecté (cloisonné). */
export async function GET() {
  return handle(async () => {
    const user = await requireRole('GERANT');
    return ok(coursesForOwner(user.id));
  });
}

/** Crée une course (gérant). */
export async function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireRole('GERANT');
    const body = courseSchema.parse(await req.json());
    const course = createCourse(user.id, body);
    return ok(course, { status: 201 });
  });
}
