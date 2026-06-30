import Link from 'next/link';
import { Badge } from '@/components/ui';
import { COURSE_STATUS } from '@/lib/labels';
import { kmRemaining, type Course } from '@/lib/types';
import { money, km } from '@/lib/format';
import { ArrowRight, MapPin, Navigation, User } from 'lucide-react';

/** Carte course (listes gérant & chauffeur). */
export function CourseCard({
  course,
  href,
  driverName,
  showPrice = true,
}: {
  course: Course;
  href: string;
  driverName?: string;
  showPrice?: boolean;
}) {
  const st = COURSE_STATUS[course.status];
  const active = !['LIVREE', 'ANNULEE', 'NOUVELLE'].includes(course.status);
  const remaining = kmRemaining(course);

  return (
    <Link href={href} className="card block p-4 transition hover:border-brand-200 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink">{course.reference}</span>
        <Badge tone={st.tone}>{st.label}</Badge>
      </div>

      <div className="mt-2 flex items-center gap-2 text-sm">
        <MapPin size={15} className="shrink-0 text-emerald-600" />
        <span className="font-medium text-ink">{course.pickup.city}</span>
        <ArrowRight size={14} className="shrink-0 text-ink-muted" />
        <span className="font-medium text-ink">{course.delivery.city}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <User size={13} /> {driverName ?? course.client.name}
        </span>
        {active ? (
          <span className="flex items-center gap-1 font-semibold text-brand-700">
            <Navigation size={13} /> {km(remaining)} restants
          </span>
        ) : showPrice ? (
          <span className="font-semibold text-ink">{money(course.price)}</span>
        ) : (
          <span>{km(course.distanceKm)}</span>
        )}
      </div>
    </Link>
  );
}
