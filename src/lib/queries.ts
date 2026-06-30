import 'server-only';
import { db } from './db';
import { kmRemaining, toPublicUser, type Course, type Driver, type PublicUser, type Vehicle } from './types';

export function userById(id?: string): PublicUser | undefined {
  if (!id) return undefined;
  const u = db().users.find((x) => x.id === id);
  return u ? toPublicUser(u) : undefined;
}

export function courseById(id: string): Course | undefined {
  return db().courses.find((c) => c.id === id);
}

/** Courses d'un gérant (cloisonnement). */
export function coursesForOwner(ownerId: string): Course[] {
  return db()
    .courses.filter((c) => c.ownerId === ownerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function driverByUser(userId: string): Driver | undefined {
  return db().drivers.find((d) => d.userId === userId);
}

/** Courses affectées à un chauffeur (via son compte). */
export function coursesForDriver(driverUserId: string): Course[] {
  const driver = driverByUser(driverUserId);
  if (!driver) return [];
  return db()
    .courses.filter((c) => c.driverId === driver.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function eventsFor(courseId: string) {
  return db()
    .events.filter((e) => e.courseId === courseId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function vehiclesFor(ownerId: string): Vehicle[] {
  return db().vehicles.filter((v) => v.ownerId === ownerId);
}
export function driversFor(ownerId: string): Driver[] {
  return db().drivers.filter((d) => d.ownerId === ownerId);
}
export function driverById(id?: string): Driver | undefined {
  return id ? db().drivers.find((d) => d.id === id) : undefined;
}
export function vehicleById(id?: string): Vehicle | undefined {
  return id ? db().vehicles.find((v) => v.id === id) : undefined;
}

export function notificationsFor(userId: string) {
  return db()
    .notifications.filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function unreadNotifications(userId: string): number {
  return db().notifications.filter((n) => n.userId === userId && !n.read).length;
}

export interface GerantStats {
  active: number;
  delivered: number;
  toAssign: number;
  ca: number;
  vehicles: number;
  drivers: number;
}
export function gerantStats(ownerId: string): GerantStats {
  const courses = db().courses.filter((c) => c.ownerId === ownerId);
  const done = courses.filter((c) => c.status === 'LIVREE');
  return {
    active: courses.filter((c) => !['LIVREE', 'ANNULEE', 'NOUVELLE'].includes(c.status)).length,
    delivered: done.length,
    toAssign: courses.filter((c) => c.status === 'NOUVELLE').length,
    ca: done.reduce((s, c) => s + c.price, 0),
    vehicles: db().vehicles.filter((v) => v.ownerId === ownerId).length,
    drivers: db().drivers.filter((d) => d.ownerId === ownerId).length,
  };
}

export { kmRemaining };
