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
      <circle cx="16" cy="16" r="15" fill="#16224d" />
      {/* route : marquages centraux */}
      <rect x="15.1" y="22" width="1.8" height="3.4" rx="0.9" fill="#ffffff" opacity="0.9" />
      <rect x="15.2" y="18" width="1.6" height="2.6" rx="0.8" fill="#ffffff" opacity="0.6" />
      {/* flèche orange "sens unique" */}
      <path d="M16 5.5 L22.5 13 H18.6 V21 H13.4 V13 H9.5 Z" fill="#f07d1a" />
    </svg>
  );
}
