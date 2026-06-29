import { cn } from '@/lib/utils';

/** ONE WAY wordmark : emblème officiel + texte « ONE WAY ». */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <LogoMark className="h-8 w-8" />
      <span className={cn('text-lg leading-none', light ? 'text-white' : 'text-ink')}>
        ONE<span className="text-amber-500"> WAY</span>
      </span>
    </span>
  );
}

/** Emblème officiel (badge carré arrondi) — issu de `public/logo-mark.png`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark.png"
      alt="ONE WAY"
      width={64}
      height={64}
      className={cn('rounded-lg object-contain shadow-sm ring-1 ring-black/5', className)}
    />
  );
}

/** Logo complet (emblème + nom + slogan) pour les grands affichages. */
export function LogoFull({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="ONE WAY — Transport · Livraison · Suivi Digital"
      className={cn('object-contain', className)}
    />
  );
}
