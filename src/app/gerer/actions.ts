'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { createCourse, advanceCourse, cancelCourse, courseById, userCanActOnCourse } from '@/lib/courses';
import type { CargoTypeKey, VehicleTypeKey } from '@/data/catalog';

/** Id d'entreprise du gérant connecté (CARRIER → soi-même ; ADMIN → défaut). */
function carrierScope(user: { role: string; id: string }): string | undefined {
  return user.role === 'CARRIER' ? user.id : undefined;
}

export async function createCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CARRIER')) redirect('/connexion?next=/gerer');

  const get = (k: string) => (formData.get(k) as string | null)?.trim() || undefined;

  const shipment = createCourse(
    {
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
    },
    carrierScope(user!),
  );

  revalidatePath('/gerer');
  redirect(`/gerer/course/${shipment.id}`);
}

export async function advanceCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect('/connexion');
  const id = (formData.get('shipmentId') as string | null)?.trim();
  if (!id) return;
  // Autorisation : seul le transporteur propriétaire, son chauffeur affecté, ou un admin.
  const course = courseById(id);
  if (!course || !userCanActOnCourse(user, course.shipment)) redirect('/connexion?next=/gerer');
  advanceCourse(id, user.id);
  revalidatePath(`/gerer/course/${id}`);
  revalidatePath('/gerer');
  revalidatePath('/chauffeur');
}

export async function cancelCourseAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'ADMIN' && user.role !== 'CARRIER')) redirect('/connexion?next=/gerer');
  const id = (formData.get('shipmentId') as string | null)?.trim();
  if (!id) return;
  const course = courseById(id);
  if (!course || !userCanActOnCourse(user, course.shipment)) redirect('/gerer');
  cancelCourse(id, user.id, user.role === 'CARRIER' ? user.id : undefined);
  revalidatePath(`/gerer/course/${id}`);
  revalidatePath('/gerer');
}
