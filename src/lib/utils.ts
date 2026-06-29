import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Generate a short, human-friendly id (server + client safe). */
export function nanoId(prefix = ''): string {
  const s = Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  return prefix ? `${prefix}_${s}` : s;
}

/** Sequential reference, e.g. OW-0042. */
export function sequenceRef(prefix: string, n: number, pad = 4): string {
  return `${prefix}-${String(n).padStart(pad, '0')}`;
}
