'use client';

import { useMemo, useState } from 'react';
import { MapPin, Flag, Truck, Package, Banknote, Route } from 'lucide-react';
import { createCourseAction } from '@/app/gerer/actions';
import { CITIES, estimateRoute } from '@/lib/geo';
import { computeQuote } from '@/lib/pricing';
import { VEHICLE_TYPES, CARGO_TYPES, suggestVehicle } from '@/data/catalog';
import type { VehicleTypeKey, CargoTypeKey } from '@/data/catalog';
import { money } from '@/lib/format';

const CITY_NAMES = CITIES.map((c) => c.name);

export function NewCourseForm({ drivers }: { drivers: { id: string; name: string }[] }) {
  const [fromCity, setFromCity] = useState('Antananarivo');
  const [toCity, setToCity] = useState('Toamasina');
  const [weightKg, setWeightKg] = useState(2000);
  const [vehicleType, setVehicleType] = useState<VehicleTypeKey>('CAMION_3T');
  const [cargoType, setCargoType] = useState<CargoTypeKey>('GENERAL');
  const [insurance, setInsurance] = useState(false);
  const [declaredValue, setDeclaredValue] = useState(0);

  const route = useMemo(
    () => (fromCity && toCity && fromCity !== toCity ? estimateRoute(fromCity, toCity) : null),
    [fromCity, toCity],
  );

  const quote = useMemo(() => {
    if (!route) return null;
    return computeQuote(
      {
        distanceKm: route.distanceKm,
        vehicleType,
        cargoType,
        weightKg,
        handlingPickup: true,
        handlingDelivery: true,
        insurance,
        declaredValue,
        vat: false,
      },
      0,
    );
  }, [route, vehicleType, cargoType, weightKg, insurance, declaredValue]);

  const suggested = suggestVehicle(weightKg);

  return (
    <form action={createCourseAction} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        {/* Itinéraire */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Route size={18} className="text-brand-600" /> Itinéraire
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label flex items-center gap-1.5">
                <MapPin size={14} className="text-emerald-600" /> Point de départ
              </label>
              <select name="fromCity" value={fromCity} onChange={(e) => setFromCity(e.target.value)} className="input">
                {CITY_NAMES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-1.5">
                <Flag size={14} className="text-rose-600" /> Point d'arrivée
              </label>
              <select name="toCity" value={toCity} onChange={(e) => setToCity(e.target.value)} className="input">
                {CITY_NAMES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {route && (
            <p className="mt-3 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
              <Truck size={15} /> <strong>{route.distanceKm} km</strong> · ≈ {route.durationH} h de route
            </p>
          )}
          {fromCity === toCity && (
            <p className="mt-3 text-sm text-rose-600">Le départ et l'arrivée doivent être différents.</p>
          )}
        </div>

        {/* Marchandise */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Package size={18} className="text-brand-600" /> Marchandise
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="label">Désignation</label>
              <input name="title" placeholder={`${fromCity} → ${toCity}`} className="input" />
            </div>
            <div>
              <label className="label">Type de marchandise</label>
              <select name="cargoType" value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoTypeKey)} className="input">
                {CARGO_TYPES.map((c) => (
                  <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Poids (kg)</label>
              <input
                name="weightKg"
                type="number"
                min={0}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value) || 0)}
                className="input"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Véhicule</label>
              <select name="vehicleType" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleTypeKey)} className="input">
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.key} value={v.key}>{v.emoji} {v.label} · {v.capacityLabel}</option>
                ))}
              </select>
              {suggested.key !== vehicleType && (
                <button
                  type="button"
                  onClick={() => setVehicleType(suggested.key)}
                  className="mt-1.5 text-xs text-brand-600 hover:underline"
                >
                  Suggéré pour {weightKg} kg : {suggested.emoji} {suggested.label} — appliquer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chauffeur & client */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Truck size={18} className="text-brand-600" /> Chauffeur & client
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Chauffeur</label>
              <select name="driverId" className="input" defaultValue={drivers[0]?.id ?? ''}>
                <option value="">— Non assigné —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div />
            <div>
              <label className="label">Nom du client</label>
              <input name="clientName" placeholder="Ex. Rakoto SARL" className="input" />
            </div>
            <div>
              <label className="label">Téléphone client</label>
              <input name="clientPhone" placeholder="034 00 000 00" className="input" />
            </div>
          </div>
        </div>
      </div>

      {/* Récapitulatif / prix */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Banknote size={18} className="text-brand-600" /> Récapitulatif
          </h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-muted">Trajet</dt>
              <dd className="font-medium text-ink">{fromCity} → {toCity}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Distance</dt>
              <dd className="font-medium text-ink">{route ? `${route.distanceKm} km` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Durée estimée</dt>
              <dd className="font-medium text-ink">{route ? `≈ ${route.durationH} h` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">Véhicule</dt>
              <dd className="font-medium text-ink">{VEHICLE_TYPES.find((v) => v.key === vehicleType)?.label}</dd>
            </div>
          </dl>

          <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
            <input type="checkbox" name="insurance" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} />
            Assurer la marchandise (0,5 %)
          </label>
          {insurance && (
            <input
              name="declaredValue"
              type="number"
              min={0}
              value={declaredValue}
              onChange={(e) => setDeclaredValue(Number(e.target.value) || 0)}
              placeholder="Valeur déclarée (Ar)"
              className="input mt-2"
            />
          )}

          <div className="mt-4 rounded-xl bg-brand-950 p-4 text-white">
            <p className="text-xs text-brand-200">Prix de la course</p>
            <p className="text-2xl font-extrabold">{quote ? money(quote.totalTTC) : '—'}</p>
            {quote && route && (
              <p className="text-xs text-brand-200">≈ {money(quote.pricePerKm)}/km sur {route.distanceKm} km</p>
            )}
          </div>

          <button type="submit" disabled={!route} className="btn-primary mt-4 w-full disabled:opacity-50">
            Créer la course
          </button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            Un code de suivi est généré automatiquement pour le client.
          </p>
        </div>
      </div>
    </form>
  );
}
