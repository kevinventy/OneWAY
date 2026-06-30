import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GererNav } from '@/components/gerer/GererNav';
import { NewCourseForm } from '@/components/gerer/NewCourseForm';
import { availableDrivers } from '@/lib/courses';

export const dynamic = 'force-dynamic';

export default function NouvelleCourse() {
  const drivers = availableDrivers();
  return (
    <div className="min-h-screen bg-slate-50">
      <GererNav active="gerer" />
      <div className="container-app py-8">
        <Link href="/gerer" className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={16} /> Tableau de bord
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-ink">Nouvelle course</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Définissez le point de départ et d'arrivée — la distance, la durée et le prix se calculent automatiquement.
        </p>
        <NewCourseForm drivers={drivers} />
      </div>
    </div>
  );
}
