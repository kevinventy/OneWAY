'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { CITIES, estimateRoute, findCity } from '@/lib/geo';
import { VEHICLE_TYPES, CARGO_TYPES, suggestVehicle, type VehicleTypeKey, type CargoTypeKey } from '@/data/catalog';
import { computeQuote } from '@/lib/pricing';
import { money, km } from '@/lib/format';
import { RouteMap } from '@/components/map/RouteMap';

const STEPS = ['Marchandise', 'Itinéraire', 'Prix & publication'];

export function NewFreightForm() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [title, setTitle] = useState('');
  const [cargoType, setCargoType] = useState<CargoTypeKey>('GENERAL');
  const [weightKg, setWeightKg] = useState(1000);
  const [volumeM3, setVolumeM3] = useState(0);
  const [dimensions, setDimensions] = useState('');
  const [declaredValue, setDeclaredValue] = useState(5_000_000);
  const [insurance, setInsurance] = useState(true);

  // Step 2
  const [fromCity, setFromCity] = useState('Antananarivo');
  const [fromAddress, setFromAddress] = useState('');
  const [toCity, setToCity] = useState('Toamasina');
  const [toAddress, setToAddress] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [urgency, setUrgency] = useState<'STANDARD' | 'EXPRESS' | 'FLEXIBLE'>('STANDARD');

  // Step 3
  const [pricingMode, setPricingMode] = useState<'FIXED' | 'AUCTION'>('FIXED');
  const [vehicleType, setVehicleType] = useState<VehicleTypeKey>('CAMION_3T');
  const [budget, setBudget] = useState<number | null>(null);

  const route = useMemo(() => estimateRoute(fromCity, toCity), [fromCity, toCity]);
  const quote = useMemo(
    () =>
      computeQuote({
        distanceKm: route.distanceKm,
        vehicleType,
        cargoType,
        weightKg,
        declaredValue,
        handlingPickup: true,
        handlingDelivery: true,
        express: urgency === 'EXPRESS',
        insurance,
        vat: false,
      }),
    [route.distanceKm, vehicleType, cargoType, weightKg, declaredValue, urgency, insurance],
  );
  const effectiveBudget = budget ?? quote.totalTTC;
  const suggested = suggestVehicle(weightKg);

  function next() {
    setError('');
    if (step === 0 && !title.trim()) return setError('Donnez un titre à votre annonce.');
    if (step === 1 && (!fromCity || !toCity || !pickupDate)) return setError('Renseignez le trajet et la date de chargement.');
    if (step === 0 && weightKg <= 0) return setError('Indiquez un poids valide.');
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  async function submit() {
    setError('');
    setSubmitting(true);
    try {
      const from = findCity(fromCity) ?? CITIES[0];
      const to = findCity(toCity) ?? CITIES[1];
      const payload = {
        title,
        cargoType,
        weightKg,
        volumeM3: volumeM3 || undefined,
        dimensions: dimensions || undefined,
        photos: [],
        pickup: { address: fromAddress || from.name, city: from.name, lat: from.lat, lng: from.lng },
        delivery: { address: toAddress || to.name, city: to.name, lat: to.lat, lng: to.lng },
        pickupDate: new Date(pickupDate).toISOString(),
        urgency,
        pricingMode,
        vehicleType,
        declaredValue,
        insurance,
        budget: effectiveBudget,
      };
      const res = await fetch('/api/freight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Publication impossible');
      window.location.href = `/app/shipper/freight/${json.data.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* Stepper */}
        <ol className="mb-5 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-slate-200 text-ink-muted'}`}>
                {i < step ? <Check size={14} /> : i + 1}
              </span>
              <span className={`hidden text-sm font-medium sm:block ${i === step ? 'text-ink' : 'text-ink-muted'}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-slate-200" />}
            </li>
          ))}
        </ol>

        <div className="card p-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="label">Titre de l’annonce</label>
                <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Palettes marchandises générales" />
              </div>
              <div>
                <label className="label">Type de marchandise</label>
                <select className="input" value={cargoType} onChange={(e) => setCargoType(e.target.value as CargoTypeKey)}>
                  {CARGO_TYPES.map((c) => (
                    <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="label">Poids (kg)</label>
                  <input className="input" type="number" value={weightKg} onChange={(e) => setWeightKg(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Volume (m³)</label>
                  <input className="input" type="number" value={volumeM3} onChange={(e) => setVolumeM3(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Dimensions</label>
                  <input className="input" value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="12 palettes" />
                </div>
              </div>
              <div>
                <label className="label">Valeur déclarée (Ar)</label>
                <input className="input" type="number" value={declaredValue} onChange={(e) => setDeclaredValue(Number(e.target.value))} />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} /> Assurer la marchandise (0,5 % de la valeur déclarée)
              </label>
              <p className="rounded-lg bg-slate-50 p-3 text-xs text-ink-muted">📷 L’ajout de photos sera disponible — l’upload S3 est prévu (voir roadmap).</p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Ville de chargement</label>
                  <input className="input" list="cities-f" value={fromCity} onChange={(e) => setFromCity(e.target.value)} />
                </div>
                <div>
                  <label className="label">Adresse de chargement</label>
                  <input className="input" value={fromAddress} onChange={(e) => setFromAddress(e.target.value)} placeholder="Quartier, repère" />
                </div>
                <div>
                  <label className="label">Ville de livraison</label>
                  <input className="input" list="cities-f" value={toCity} onChange={(e) => setToCity(e.target.value)} />
                </div>
                <div>
                  <label className="label">Adresse de livraison</label>
                  <input className="input" value={toAddress} onChange={(e) => setToAddress(e.target.value)} placeholder="Quartier, repère" />
                </div>
                <datalist id="cities-f">
                  {CITIES.map((c) => <option key={c.name} value={c.name} />)}
                </datalist>
                <div>
                  <label className="label">Date de chargement</label>
                  <input className="input" type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} />
                </div>
                <div>
                  <label className="label">Urgence</label>
                  <select className="input" value={urgency} onChange={(e) => setUrgency(e.target.value as typeof urgency)}>
                    <option value="STANDARD">Standard</option>
                    <option value="EXPRESS">Express (J+1)</option>
                    <option value="FLEXIBLE">Flexible</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
                <span>Distance estimée</span>
                <strong>{km(route.distanceKm)} · {route.durationH ? `${route.durationH} h` : '—'}</strong>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="label">Mode de tarification</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['FIXED', 'AUCTION'] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setPricingMode(m)} className={`rounded-xl border p-3 text-sm font-semibold ${pricingMode === m ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft'}`}>
                      {m === 'FIXED' ? '💰 Prix fixe' : '⚖️ Enchères'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Véhicule requis {suggested.key !== vehicleType && <button type="button" className="text-xs text-brand-600 hover:underline" onClick={() => setVehicleType(suggested.key)}>· Suggéré : {suggested.label}</button>}</label>
                <select className="input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value as VehicleTypeKey)}>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v.key} value={v.key}>{v.emoji} {v.label} · {v.capacityLabel}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{pricingMode === 'AUCTION' ? 'Budget de départ (Ar)' : 'Prix proposé (Ar)'}</label>
                <input className="input" type="number" value={effectiveBudget} onChange={(e) => setBudget(Number(e.target.value))} />
                <p className="mt-1 text-xs text-ink-muted">Estimation ONE WAY : <strong>{money(quote.totalTTC)}</strong> ({money(quote.pricePerKm)}/km)</p>
              </div>
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            {step > 0 ? (
              <button onClick={() => setStep((s) => s - 1)} className="btn-ghost"><ArrowLeft size={16} /> Retour</button>
            ) : <span />}
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="btn-primary">Continuer <ArrowRight size={16} /></button>
            ) : (
              <button onClick={submit} disabled={submitting} className="btn-primary">
                {submitting && <Loader2 size={16} className="animate-spin" />} Publier le fret
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live preview */}
      <aside className="space-y-4">
        <RouteMap from={{ ...(route.from ?? CITIES[0]), label: fromCity }} to={{ ...(route.to ?? CITIES[1]), label: toCity }} className="aspect-square w-full" />
        <div className="card p-4">
          <p className="text-xs text-ink-muted">Aperçu du devis</p>
          <p className="text-2xl font-bold text-ink">{money(effectiveBudget)}</p>
          <div className="mt-2 space-y-1 text-xs text-ink-muted">
            <div className="flex justify-between"><span>Distance</span><span>{km(route.distanceKm)}</span></div>
            <div className="flex justify-between"><span>Véhicule</span><span>{VEHICLE_TYPES.find((v) => v.key === vehicleType)?.label}</span></div>
            <div className="flex justify-between"><span>Marchandise</span><span>{CARGO_TYPES.find((c) => c.key === cargoType)?.label}</span></div>
          </div>
        </div>
      </aside>
    </div>
  );
}
