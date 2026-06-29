'use client';

import { useMemo, useState } from 'react';
import { CITIES, estimateRoute } from '@/lib/geo';
import { VEHICLE_TYPES, CARGO_TYPES, suggestVehicle, type VehicleTypeKey, type CargoTypeKey } from '@/data/catalog';
import { computeQuote } from '@/lib/pricing';
import { money } from '@/lib/format';
import { RouteMap } from '@/components/map/RouteMap';
import { Truck, Sparkles } from 'lucide-react';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition ${
        checked ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-ink-soft'
      }`}
    >
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

export function Calculator({ embedded = false }: { embedded?: boolean }) {
  const [from, setFrom] = useState('Antananarivo');
  const [to, setTo] = useState('Toamasina');
  const [vehicle, setVehicle] = useState<VehicleTypeKey>('CAMION_5T');
  const [cargo, setCargo] = useState<CargoTypeKey>('GENERAL');
  const [weight, setWeight] = useState(4000);
  const [declaredValue, setDeclaredValue] = useState(20_000_000);
  const [handlingPickup, setHandlingPickup] = useState(true);
  const [handlingDelivery, setHandlingDelivery] = useState(true);
  const [express, setExpress] = useState(false);
  const [night, setNight] = useState(false);
  const [ruralRoad, setRuralRoad] = useState(false);
  const [insurance, setInsurance] = useState(true);
  const [vat, setVat] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [manualDistance, setManualDistance] = useState<number | null>(null);

  const route = useMemo(() => estimateRoute(from, to), [from, to]);
  const distance = manualDistance ?? route.distanceKm;

  const quote = useMemo(
    () =>
      computeQuote({
        distanceKm: distance,
        vehicleType: vehicle,
        cargoType: cargo,
        weightKg: weight,
        declaredValue,
        handlingPickup,
        handlingDelivery,
        express,
        night,
        ruralRoad,
        insurance,
        discountPct: discount,
        vat,
      }),
    [distance, vehicle, cargo, weight, declaredValue, handlingPickup, handlingDelivery, express, night, ruralRoad, insurance, discount, vat],
  );

  const suggested = suggestVehicle(weight);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      {/* Inputs */}
      <div className="lg:col-span-3 space-y-4">
        <div className="card p-4">
          <h3 className="mb-3 font-bold text-ink">Trajet</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Point de chargement</label>
              <input className="input" list="cities" value={from} onChange={(e) => { setFrom(e.target.value); setManualDistance(null); }} />
            </div>
            <div>
              <label className="label">Point de livraison</label>
              <input className="input" list="cities" value={to} onChange={(e) => { setTo(e.target.value); setManualDistance(null); }} />
            </div>
            <datalist id="cities">
              {CITIES.map((c) => (
                <option key={c.name} value={c.name} />
              ))}
            </datalist>
            <div>
              <label className="label">Distance (km) {route.source === 'known' && <span className="text-xs text-emerald-600">· réel</span>}</label>
              <input className="input" type="number" value={distance} onChange={(e) => setManualDistance(Number(e.target.value))} />
            </div>
            <div>
              <label className="label">Durée estimée</label>
              <input className="input bg-slate-50" value={route.durationH ? `${route.durationH} h` : '—'} readOnly />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 font-bold text-ink">Marchandise & véhicule</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Type de véhicule</label>
              <select className="input" value={vehicle} onChange={(e) => setVehicle(e.target.value as VehicleTypeKey)}>
                {VEHICLE_TYPES.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.emoji} {v.label} · {v.capacityLabel}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type de marchandise</label>
              <select className="input" value={cargo} onChange={(e) => setCargo(e.target.value as CargoTypeKey)}>
                {CARGO_TYPES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.emoji} {c.label} (×{c.coefficient})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Poids (kg)</label>
              <input className="input" type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} />
              {suggested.key !== vehicle && (
                <button type="button" onClick={() => setVehicle(suggested.key)} className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600 hover:underline">
                  <Sparkles size={12} /> Suggéré : {suggested.label}
                </button>
              )}
            </div>
            <div>
              <label className="label">Valeur déclarée (Ar)</label>
              <input className="input" type="number" value={declaredValue} onChange={(e) => setDeclaredValue(Number(e.target.value))} />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h3 className="mb-3 font-bold text-ink">Options & majorations</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            <Toggle label="Manutention chargement" checked={handlingPickup} onChange={setHandlingPickup} />
            <Toggle label="Manutention déchargement" checked={handlingDelivery} onChange={setHandlingDelivery} />
            <Toggle label="Service express (+30 %)" checked={express} onChange={setExpress} />
            <Toggle label="Livraison de nuit (+20 %)" checked={night} onChange={setNight} />
            <Toggle label="Pistes / zones rurales (+15 %)" checked={ruralRoad} onChange={setRuralRoad} />
            <Toggle label="Assurance marchandise (0,5 %)" checked={insurance} onChange={setInsurance} />
            <Toggle label="Appliquer la TVA 20 %" checked={vat} onChange={setVat} />
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <span className="text-ink-soft">Remise (%)</span>
              <input className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right" type="number" min={0} max={100} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} />
            </div>
          </div>
        </div>
      </div>

      {/* Result */}
      <div className="lg:col-span-2 space-y-4">
        <RouteMap
          from={{ ...(route.from ?? CITIES[0]), label: from }}
          to={{ ...(route.to ?? CITIES[1]), label: to }}
          className="aspect-[4/3] w-full"
        />
        <div className="card overflow-hidden">
          <div className="bg-brand-950 p-4 text-white">
            <p className="text-xs text-brand-200">Total estimé TTC</p>
            <p className="text-3xl font-extrabold">{money(quote.totalTTC)}</p>
            <p className="mt-1 text-xs text-brand-200">
              {distance} km · {money(quote.pricePerKm)}/km · {quote.meta.vehicleLabel}
            </p>
          </div>
          <div className="divide-y divide-slate-100 p-4 text-sm">
            {quote.lines.map((l) => (
              <div key={l.key} className="flex items-center justify-between py-1.5">
                <span className="text-ink-muted">{l.label}</span>
                <span className="font-medium text-ink">{money(l.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between py-1.5 font-semibold">
              <span>Sous-total HT</span>
              <span>{money(quote.subtotalHT)}</span>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex items-center justify-between py-1.5 text-emerald-600">
                <span>Remise {quote.discountPct} %</span>
                <span>− {money(quote.discountAmount)}</span>
              </div>
            )}
            {quote.vatAmount > 0 && (
              <div className="flex items-center justify-between py-1.5">
                <span className="text-ink-muted">TVA 20 %</span>
                <span className="font-medium">{money(quote.vatAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 text-base font-extrabold text-brand-700">
              <span>Total TTC</span>
              <span>{money(quote.totalTTC)}</span>
            </div>
          </div>
          {!embedded && (
            <div className="border-t border-slate-100 p-4">
              <a href="/register?role=SHIPPER" className="btn-primary w-full">
                <Truck size={16} /> Publier ce fret sur ONE WAY
              </a>
              <p className="mt-2 text-center text-xs text-ink-muted">
                Estimation indicative — le prix final dépend des offres des transporteurs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
