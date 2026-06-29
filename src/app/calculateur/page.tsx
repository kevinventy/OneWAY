import { PublicNav } from '@/components/marketing/PublicNav';
import { Calculator } from '@/components/calculator/Calculator';

export const metadata = { title: 'Calculateur de prix — ONE WAY' };

export default function CalculateurPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      <main className="container-app py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">Calculateur de prix de transport</h1>
          <p className="mt-1 text-ink-muted">
            Obtenez une estimation instantanée selon la grille tarifaire ONE WAY (Madagascar).
          </p>
        </div>
        <Calculator />
      </main>
    </div>
  );
}
