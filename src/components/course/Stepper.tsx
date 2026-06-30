import { STATUS_FLOW, COURSE_STATUS } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { CourseStatus } from '@/lib/types';
import { Check } from 'lucide-react';

/** Indicateur d'étapes d'une course (chargement → livraison). */
export function Stepper({ status }: { status: CourseStatus }) {
  if (status === 'ANNULEE') {
    return (
      <div className="rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-500">
        Course annulée
      </div>
    );
  }
  const current = STATUS_FLOW.indexOf(status);
  // NOUVELLE = avant la première étape.
  const activeIndex = status === 'NOUVELLE' ? -1 : current;

  return (
    <ol className="flex items-stretch gap-1">
      {STATUS_FLOW.map((s, i) => {
        const done = i < activeIndex || status === 'LIVREE';
        const isCurrent = i === activeIndex && status !== 'LIVREE';
        return (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span className={cn('h-1 flex-1 rounded-full', i === 0 ? 'bg-transparent' : done || isCurrent ? 'bg-brand-500' : 'bg-slate-200')} />
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[10px] font-bold',
                  done
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : isCurrent
                      ? 'border-brand-500 bg-white text-brand-600'
                      : 'border-slate-200 bg-white text-slate-300',
                )}
              >
                {done ? <Check size={12} /> : i + 1}
              </span>
              <span className={cn('h-1 flex-1 rounded-full', i === STATUS_FLOW.length - 1 ? 'bg-transparent' : done ? 'bg-brand-500' : 'bg-slate-200')} />
            </div>
            <span className={cn('text-center text-[9px] font-medium leading-tight', isCurrent ? 'text-brand-700' : done ? 'text-ink-soft' : 'text-slate-400')}>
              {COURSE_STATUS[s].label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
