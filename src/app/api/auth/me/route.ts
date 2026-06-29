import { handle, ok } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  return handle(async () => ok(await getCurrentUser()));
}
