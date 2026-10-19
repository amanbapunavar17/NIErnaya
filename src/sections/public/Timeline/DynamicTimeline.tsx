/**
 * ================================================================
 * DynamicTimeline.tsx — Enhanced Journey Stations & Chronology
 * ================================================================
 * Effects added:
 * - 3D Perspective Tilt on timeline station cards with cursor-following radial glow
 * - Glowing date badges with 3D depth and illuminated borders
 * - Dynamic scroll progress vehicle with gentle floating animation and glowing cyan trail
 * - Interactive station carousel pagination with spring physics
 * - Full Supabase realtime channel updates preserved with zero breaking changes
 * ================================================================
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CarFront,
} from 'lucide-react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';

import {
  supabase,
  isSupabaseConfigured,
} from '../../../lib/supabase/client';

type TimelineStatus =
  | 'upcoming'
  | 'active'
  | 'completed';

type TimelineEvent = {
  id: string;
  phase_id: string | null;
  station_number: string;
  title: string;
  description: string | null;
  event_date: string | null;
  status: TimelineStatus;
  sort_order: number;
  public_visible: boolean;
};

const FALLBACK_EVENTS: TimelineEvent[] = [
  {
    id: 'station-01',
    phase_id: null,
    station_number: 'EVENT 01',
    title: 'Registrations Open',
    description:
      'Team registration portal goes live. Form your squad of 2–3 students from 2nd year (3rd sem) NIE.',
    event_date: '2026-10-17',
    status: 'upcoming',
    sort_order: 1,
    public_visible: true,
  },
  {
    id: 'station-02',
    phase_id: null,
    station_number: 'EVENT 02',
    title: 'Registration Deadline & Locking',
    description:
      'Final deadline to complete team registration and verify team details.',
    event_date: '2026-10-25',
    status: 'upcoming',
    sort_order: 2,
    public_visible: true,
  },
  {
    id: 'station-03',
    phase_id: null,
    station_number: 'EVENT 03',
    title: 'Phase 1: Data Hunt Launch',
    description:
      'Problem formulation requirements and dataset discovery challenges are officially initiated.',
    event_date: '2026-10-28',
    status: 'upcoming',
    sort_order: 3,
    public_visible: true,
  },
  {
    id: 'station-04',
    phase_id: null,
    station_number: 'EVENT 04',
    title: 'Shortlisted Teams Announcement',
    description:
      'Shortlisted teams are announced and advance to Phase 2 Data Lab.',
    event_date: '2026-11-04',
    status: 'upcoming',
    sort_order: 4,
    public_visible: true,
  },
  {
    id: 'station-05',
    phase_id: null,
    station_number: 'EVENT 05',
    title: 'Phase 2: Data Lab & Visualization',
    description:
      'Intense EDA phase with faculty syncs, visual prototype audits, and statistical validation.',
    event_date: '2026-11-11',
    status: 'upcoming',
    sort_order: 5,
    public_visible: true,
  },
  {
    id: 'station-06',
    phase_id: null,
    station_number: 'EVENT 06',
    title: 'Phase 3: Live Data Battle',
    description:
      'Live data problem-solving and team presentations at NIE North Campus.',
    event_date: '2026-11-20',
    status: 'upcoming',
    sort_order: 6,
    public_visible: true,
  },
  {
    id: 'station-07',
    phase_id: null,
    station_number: 'EVENT 07',
    title: 'Grand Valedictory & Prize Distribution',
    description:
      'Final presentations, jury deliberation, certificate issuance, and ₹10,000 cash prize honors.',
    event_date: null,
    status: 'upcoming',
    sort_order: 7,
    public_visible: true,
  },
];

const parseDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getLiveStatus = (event: TimelineEvent): TimelineStatus => event.status;

const getDateBadge = (value: string | null) => {
  const date = parseDate(value);
  if (!date) {
    return {
      day: 'TBA',
      month: 'STATION',
      year: null,
    };
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = date
    .toLocaleDateString('en-IN', { month: 'short' })
    .toUpperCase();
  const year = String(date.getFullYear());

  return { day, month, year };
};

/* 3D Tilt Component for Station Cards */
const StationTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className, glowColor = '#36D9FF' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);

  const rX = useSpring(useTransform(posY, [-0.5, 0.5], [6, -6]), {
    stiffness: 260,
    damping: 24,
  });
  const rY = useSpring(useTransform(posX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 260,
    damping: 24,
  });

  const gx = useSpring(useTransform(posX, [-0.5, 0.5], [0, 100]), {
    stiffness: 260,
    damping: 24,
  });
  const gy = useSpring(useTransform(posY, [-0.5, 0.5], [0, 100]), {
    stiffness: 260,
    damping: 24,
  });
  const glowBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}16 0%, transparent 68%)`;

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      posX.set((e.clientX - r.left) / r.width - 0.5);
      posY.set((e.clientY - r.top) / r.height - 0.5);
    },
    [posX, posY]
  );

  const onLeave = useCallback(() => {
    posX.set(0);
    posY.set(0);
  }, [posX, posY]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 950 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className ?? ''}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
};

export const DynamicTimeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>(FALLBACK_EVENTS);
  const [activeIndex, setActiveIndex] = useState(0);
  const [live, setLive] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const loadTimeline = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('timeline_events')
        .select(`
          id,
          phase_id,
          station_number,
          title,
          description,
          event_date,
          status,
          sort_order,
          public_visible
        `)
        .eq('public_visible', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents(data as TimelineEvent[]);
        setLive(true);
      }
    } catch (error) {
      console.error('[DynamicTimeline] Failed to load timeline:', error);
      setLive(false);
    }
  }, []);

  useEffect(() => {
    const updateScrollProgress = () => {
      const section = document.getElementById('timeline');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const total = rect.height + viewportHeight;
      const travelled = viewportHeight - rect.top;
      const progress = Math.max(0, Math.min(1, travelled / total));
      setScrollProgress(progress);
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);
    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  useEffect(() => {
    void loadTimeline();

    if (!isSupabaseConfigured || !supabase) return;

    const channel = supabase
      .channel('public-timeline-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'timeline_events' },
        () => {
          void loadTimeline();
        }
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [loadTimeline]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setEvents((current) => [...current]);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const visibleEvents = useMemo(
    () =>
      events
        .filter((event) => event.public_visible)
        .sort((a, b) => a.sort_order - b.sort_order),
    [events]
  );

  useEffect(() => {
    if (activeIndex >= visibleEvents.length) {
      setActiveIndex(Math.max(0, visibleEvents.length - 1));
    }
  }, [activeIndex, visibleEvents.length]);

  const visibleCards = visibleEvents.slice(activeIndex, activeIndex + 4);
  const canPrevious = activeIndex > 0;
  const canNext = activeIndex + 4 < visibleEvents.length;

  return (
    <section
      id="timeline"
      className="relative bg-[#05070A] px-4 py-14 sm:py-24 sm:px-8 lg:px-12 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#173A8C]/15 blur-[130px]" />
      <div className="pointer-events-none absolute -right-40 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#FF7A30]/10 blur-[130px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* HEADER */}
        <div className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]"
          >
            <CalendarDays className="h-3.5 w-3.5 animate-pulse" />
            EVENT TIMELINE
          </motion.div>

          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            THE EVENT JOURNEY
          </h2>

          <div className="mt-4 flex justify-center">
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#66717F]">
              <span
                className={`h-2 w-2 rounded-full ${
                  live ? 'bg-green-400 animate-ping' : 'bg-[#FF7A30]'
                }`}
              />
              {live ? 'LIVE FROM SUPABASE' : 'EVENT CONFIGURATION'}
            </span>
          </div>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {visibleCards.map((event, index) => {
            const badge = getDateBadge(event.event_date);
            const status = getLiveStatus(event);
            const glowColor =
              status === 'active'
                ? '#10B981'
                : status === 'completed'
                  ? '#36D9FF'
                  : '#FF7A30';

            return (
              <StationTiltCard
                key={event.id}
                glowColor={glowColor}
                className="h-full"
              >
                <motion.article
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  className="flex h-full min-h-0 sm:min-h-[310px] flex-col justify-between rounded-2xl border border-white/10 bg-[#0B1016]/90 p-4 sm:p-6 backdrop-blur-md transition-all hover:border-[#36D9FF]/40 hover:shadow-xl hover:shadow-black/50"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#FF7A30]">
                        EVENT {String(event.sort_order).padStart(2, '0')}
                      </span>

                      <div className="flex gap-1">
                        <span className="h-2 w-2 rounded-full bg-white/20" />
                        <span className="h-2 w-2 rounded-full bg-white/20" />
                        <span className="h-2 w-2 rounded-full bg-[#FF7A30]" />
                      </div>
                    </div>

                    <div className="mt-5 sm:mt-8 flex items-center gap-3">
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#FF7A30] bg-[#07090D] shadow-md shadow-[#FF7A30]/15">
                        <span className="font-display text-xl font-black text-white">
                          {badge.day}
                        </span>
                        <span className="font-mono text-[8px] font-bold text-[#FF7A30]">
                          {badge.month}
                        </span>
                      </div>

                      <div>
                        {badge.year ? (
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[#8B96A5]">
                            YEAR {badge.year}
                          </p>
                        ) : (
                          <p className="font-mono text-[9px] uppercase tracking-wider text-[#8B96A5]">
                            DATE TO BE ANNOUNCED
                          </p>
                        )}

                        <h3 className="mt-1 font-display text-base font-bold leading-tight text-white">
                          {event.title}
                        </h3>
                      </div>
                    </div>

                    <p className="mt-4 sm:mt-6 text-xs leading-5 text-[#8B96A5]">
                      {event.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#8B96A5]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status === 'active'
                              ? 'bg-green-400'
                              : status === 'completed'
                                ? 'bg-[#36D9FF]'
                                : 'bg-[#8B96A5]'
                          }`}
                        />
                        {status}
                      </span>

                      <CalendarDays className="h-4 w-4 text-[#66717F]" />
                    </div>
                  </div>
                </motion.article>
              </StationTiltCard>
            );
          })}
        </div>

        {/* TIMELINE BAR */}
        <div className="relative mt-10 sm:mt-16">
          <div className="h-1 rounded-full bg-[#18222D]" />

          <motion.div
            aria-label="Timeline journey vehicle"
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#36D9FF]/50 bg-[#071019] p-2 text-[#36D9FF] shadow-lg shadow-[#36D9FF]/25"
            style={{ left: `${scrollProgress * 100}%` }}
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CarFront className="h-5 w-5" />
          </motion.div>

          <div
            className="absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-[#FF7A30] to-[#36D9FF] transition-all duration-500 shadow-sm shadow-[#36D9FF]/50"
            style={{
              width:
                visibleEvents.length > 1
                  ? `${Math.min(
                      100,
                      (activeIndex / (visibleEvents.length - 1)) * 100
                    )}%`
                  : '0%',
            }}
          />

          <div className="absolute left-0 top-1/2 flex w-full -translate-y-1/2 justify-between">
            {visibleEvents.map((event, index) => (
              <button
                key={event.id}
                type="button"
                aria-label={`Go to ${event.title}`}
                onClick={() =>
                  setActiveIndex(
                    Math.min(index, Math.max(0, visibleEvents.length - 4))
                  )
                }
                className={`h-4 w-4 rounded-full border-2 transition-all ${
                  index >= activeIndex && index < activeIndex + 4
                    ? 'border-[#FF7A30] bg-[#05070A] scale-110 shadow-sm shadow-[#FF7A30]/50'
                    : 'border-[#34404D] bg-[#05070A]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CONTROLS */}
        <div className="mt-12 flex items-center justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!canPrevious}
              onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#FF7A30] text-white transition-all hover:bg-[#FF7A30]/15 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 shadow-md shadow-[#FF7A30]/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              disabled={!canNext}
              onClick={() =>
                setActiveIndex(
                  Math.min(visibleEvents.length - 4, activeIndex + 1)
                )
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#FF7A30] text-white transition-all hover:bg-[#FF7A30]/15 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 shadow-md shadow-[#FF7A30]/10"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="font-mono text-xs text-[#8B96A5]">
            <span className="text-white font-bold">
              {Math.min(activeIndex + 1, visibleEvents.length)}
            </span>{' '}
            / {visibleEvents.length} STATIONS
          </div>
        </div>
      </div>
    </section>
  );
};

export default DynamicTimeline;