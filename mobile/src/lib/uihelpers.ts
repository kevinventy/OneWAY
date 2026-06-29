import { quickEstimate } from '@/lib/pricing';
import { money } from '@/lib/format';
import type { Freight } from '@/lib/types';

export { money };

/** "≈ 1 650 000 Ar" estimate label for a freight (carrier feed). */
export function quickEstimateLabel(freight: Freight): string {
  return `≈ ${money(quickEstimate(freight.distanceKm, freight.vehicleType, freight.cargoType))}`;
}
