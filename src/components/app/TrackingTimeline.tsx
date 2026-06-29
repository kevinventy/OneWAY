import { dateTimeFr } from '@/lib/format';
import { Camera } from 'lucide-react';
import type { TrackingEvent } from '@/lib/types';

export function TrackingTimeline({ events }: { events: TrackingEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-muted">Aucun événement de suivi pour le moment.</p>;
  }
  return (
    <ol className="relative space-y-4 border-l-2 border-slate-200 pl-5">
      {events.map((e, i) => (
        <li key={e.id} className="relative">
          <span
            className={`absolute -left-[27px] top-1 h-4 w-4 rounded-full border-2 border-white ${
              i === events.length - 1 ? 'bg-amber-500 animate-pulse-dot' : 'bg-brand-600'
            }`}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{e.label}</p>
            <time className="text-xs text-ink-muted">{dateTimeFr(e.createdAt)}</time>
          </div>
          {e.note && <p className="text-sm text-ink-muted">{e.note}</p>}
          {e.photoUrl && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs text-brand-600">
              <Camera size={12} /> Photo jointe
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
