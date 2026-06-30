'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiPost } from '@/lib/fetcher';
import { CITIES, buildCourseRoute, type City } from '@/lib/geo';
import { quickEstimate } from '@/lib/pricing';
import { VEHICLE_TYPES, CARGO_TYPES, suggestVehicle, type VehicleTypeKey, type CargoTypeKey } from '@/data/catalog';
import { money, km, duration } from '@/lib/format';
import { Route, Loader2, Send } from 'lucide-react';

const cityByName = (name: string): City | undefined => CITIES.find((c) => c.name === name);

export function NewCourseForm() {
  const router = useRouter();

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [fromCity, setFromCity] = useState('Antananarivo');
  const [fromAddr, setFromAddr] = useState('');
  const [toCity, setToCity] = useState('Toamasina');
  const [toAddr, setToAddr] = useState('');
  const [cargoType, setCargoType] = useState<CargoTypeKey>('GENERAL');
  const [cargoDescription, setCargoDescription] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleTypeKey>('CAMION_3T');
  const [autoVehicle, setAutoVehicle] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weight = Number(weightKg) || 0;
  const effectiveVehicle: VehicleTypeKey = autoVehicle && weight > 0 ? suggestVehicle(weight).key : vehicleType;

  const preview = useMemo(() => {
    const from = cityByName(fromCity);
    const to = cityByName(toCity);
    if (!from || !to || from.name === to.name) return null;
    const route = buildCourseRoute(from.name, from, to.name, to);
    const price = quickEstimate(route.distanceKm, effectiveVehicle, cargoType);
    return { distanceKm: route.distanceKm, durationH: route.durationH, price };
  }, [fromCity, toCity, effectiveVehicle, cargoType]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const from = cityByName(fromCity);
    const to = cityByName(toCity);
    if (!from || !to) {
      setError('Sélectionnez un point de départ et d’arrivée');
      return;
    }
    if (from.name === to.name) {
      setError('Le départ et l’arrivée doivent être différents');
      return;
    }
    if (weight <= 0) {
      setError('Indiquez le poids de la marchandise');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const course = await apiPost('/api/courses', {
        client: { name: clientName, phone: clientPhone },
        cargoType,
        cargoDescription,
        weightKg: weight,
        vehicleType: effectiveVehicle,
        pickup: { address: fromAddr || from.name, city: from.name, lat: from.lat, lng: from.lng },
        delivery: { address: toAddr || to.name, city: to.name, lat: to.lat, lng: to.lng },
      });
      router.push(`/app/gerant/course/${course.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création impossible');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Client */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Client</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Nom du client</label>
            <input className="input" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Société ABC" required />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input className="input" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+261 34 ..." required />
          </div>
        </div>
      </section>

      {/* Trajet */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Trajet</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Ville de départ</label>
            <select className="input" value={fromCity} onChange={(e) => setFromCity(e.target.value)}>
              {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Adresse de chargement</label>
            <input className="input" value={fromAddr} onChange={(e) => setFromAddr(e.target.value)} placeholder="Quartier, point de repère" />
          </div>
          <div>
            <label className="label">Ville d’arrivée</label>
            <select className="input" value={toCity} onChange={(e) => setToCity(e.target.value)}>
              {CITIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Adresse de livraison</label>
            <input className="input" value={toAddr} onChange={(e) => setToAddr(e.target.value)} placeholder="Quartier, point de repère" />
          </div>
        </div>
      </section>

      {/* Marchandise */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">Marchandise</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Type de marchandise</label>
            <select className="input" value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoTypeKey)}>
              {CARGO_TYPES.map((c) => <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Poids (kg)</label>
            <input className="input" type="number" min={1} value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="4200" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <input className="input" value={cargoDescription} onChange={(e) => setCargoDescription(e.target.value)} placeholder="12 palettes, sacs de ciment…" required />
          </div>
          <div className="sm:col-span-2">
            <label className="label flex items-center justify-between">
              <span>Véhicule</span>
              <label className="flex items-center gap-1.5 text-xs font-normal text-ink-muted">
                <input type="checkbox" checked={autoVehicle} onChange={(e) => setAutoVehicle(e.target.checked)} />
                Choix automatique selon le poids
              </label>
            </label>
            <select
              className="input disabled:bg-slate-50"
              value={effectiveVehicle}
              onChange={(e) => setVehicleType(e.target.value as VehicleTypeKey)}
              disabled={autoVehicle}
            >
              {VEHICLE_TYPES.map((v) => <option key={v.key} value={v.key}>{v.emoji} {v.label} ({v.capacityLabel})</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* Estimation */}
      {preview && (
        <section className="card border-brand-100 bg-brand-50/50 p-4">
          <div className="flex items-center gap-2 text-brand-700">
            <Route size={18} />
            <h2 className="text-sm font-bold">Estimation automatique</h2>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-ink-muted">Distance</p>
              <p className="text-lg font-extrabold text-ink">{km(preview.distanceKm)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Durée</p>
              <p className="text-lg font-extrabold text-ink">{duration(preview.durationH)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-muted">Prix</p>
              <p className="text-lg font-extrabold text-brand-700">{money(preview.price)}</p>
            </div>
          </div>
        </section>
      )}

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{error}</p>}

      <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={loading}>
        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
        Créer la course &amp; générer le code
      </button>
    </form>
  );
}
