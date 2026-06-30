'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createCourse, advanceCourse } from '@/lib/courses';
import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';

export async function createCourseAction(formData: FormData) {
  const get = (k: string) => (formData.get(k) as string | null)?.trim() || undefined;

  const shipment = createCourse({
    fromCity: get('fromCity') ?? '',
    toCity: get('toCity') ?? '',
    title: get('title') ?? '',
    cargoType: (get('cargoType') as CargoTypeKey) ?? 'GENERAL',
    weightKg: Number(get('weightKg') ?? '0') || 0,
    vehicleType: (get('vehicleType') as VehicleTypeKey) ?? 'CAMION_3T',
    driverId: get('driverId'),
    clientName: get('clientName'),
    clientPhone: get('clientPhone'),
    insurance: get('insurance') === 'on',
    declaredValue: get('declaredValue') ? Number(get('declaredValue')) : undefined,
  });

  revalidatePath('/gerer');
  redirect(`/gerer/course/${shipment.id}`);
}

export async function advanceCourseAction(formData: FormData) {
  const id = (formData.get('shipmentId') as string | null)?.trim();
  if (id) {
    advanceCourse(id);
    revalidatePath(`/gerer/course/${id}`);
    revalidatePath('/gerer');
    revalidatePath('/chauffeur');
  }
}
