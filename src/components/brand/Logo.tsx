import { cn } from '@/lib/utils';

/** ONE WAY wordmark with a "one-way road sign" arrow glyph. */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-extrabold tracking-tight', className)}>
      <LogoMark className="h-7 w-7" />
      <span className={cn('text-lg leading-none', light ? 'text-white' : 'text-ink')}>
        ONE<span className="text-amber-500"> WAY</span>
      </span>
    </span>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden role="img">
      <rect x="1" y="1" width="30" height="30" rx="9" fill="#141a57" />
      <path
        d="M16 6l6 6h-4v14h-4V12h-4l6-6z"
        fill="#ff9500"
        transform="rotate(90 16 16)"
      />
    </svg>
  );
}
