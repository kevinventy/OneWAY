import { cn } from '@/lib/utils';
import { TONE_CLASS, type Tone } from '@/lib/labels';
import { Star } from 'lucide-react';

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return <span className={cn('chip', TONE_CLASS[tone], className)}>{children}</span>;
}

export function Avatar({
  name,
  color = '#1d3df5',
  size = 36,
}: {
  name: string;
  color?: string;
  size?: number;
}) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ background: color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </span>
  );
}

export function Stars({ value, count, size = 14 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-amber-500">
      <Star size={size} className="fill-amber-400 stroke-amber-400" />
      <span className="font-semibold text-ink">{value > 0 ? value.toFixed(1) : '—'}</span>
      {count != null && <span className="text-xs text-ink-muted">({count})</span>}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
  tone = 'blue',
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-ink-muted">{label}</span>
        {icon && <span className={cn('rounded-lg p-1.5', TONE_CLASS[tone])}>{icon}</span>}
      </div>
      <div className="mt-2 text-2xl font-bold text-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-muted">{hint}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      {icon && <div className="text-brand-400">{icon}</div>}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}
