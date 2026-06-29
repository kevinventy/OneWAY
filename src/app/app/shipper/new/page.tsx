import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { NewFreightForm } from '@/components/app/NewFreightForm';

export const dynamic = 'force-dynamic';

export default async function NewFreightPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== 'SHIPPER') redirect('/app');
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-ink">Publier un fret</h1>
        <p className="text-ink-muted">Décrivez votre besoin, recevez des offres en quelques minutes.</p>
      </div>
      <NewFreightForm />
    </div>
  );
}
