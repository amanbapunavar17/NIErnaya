import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CarFront,
} from 'lucide-react';

import { motion } from 'framer-motion';

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
    title:
      'Registration Deadline & Locking',
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
    title:
      'Phase 1: Data Hunt Launch',
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
    title:
      'Shortlisted Teams Announcement',
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
    title:
      'Phase 2: Data Lab & Visualization',
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
    title:
      'Phase 3: Live Data Battle',
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
    title:
      'Grand Valedictory & Prize Distribution',
    description:
      'Final presentations, jury deliberation, certificate issuance, and ₹10,000 cash prize honors.',
    event_date: null,
    status: 'upcoming',
    sort_order: 7,
    public_visible: true,
  },
];

const parseDate = (
  value: string | null
) => {
  if (!value) return null;

  const date = new Date(
    `${value.slice(0, 10)}T00:00:00`
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const getLiveStatus = (event: TimelineEvent): TimelineStatus => event.status;

const getDateBadge = (
  value: string | null
) => {
  const date = parseDate(value);

  if (!date) {
    return {
      day: '--',
      month: 'TBD',
      year: '',
    };
  }

  return {
    day: String(
      date.getDate()
    ).padStart(2, '0'),

    month:
      date
        .toLocaleDateString(
          'en-IN',
          { month: 'short' }
        )
        .toUpperCase(),

    year: String(
      date.getFullYear()
    ),
  };
};

export const DynamicTimeline: React.FC = () => {
  const [events, setEvents] =
    useState<TimelineEvent[]>(
      FALLBACK_EVENTS
    );

  const [activeIndex, setActiveIndex] =
    useState(0);

  const [live, setLive] =
    useState(false);

  const [scrollProgress, setScrollProgress] = useState(0);

  const loadTimeline = useCallback(
    async () => {
      if (
        !isSupabaseConfigured ||
        !supabase
      ) {
        return;
      }

      try {
        const {
          data,
          error,
        } = await supabase
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
          .order('sort_order', {
            ascending: true,
          });

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          setEvents(
            data as TimelineEvent[]
          );
          setLive(true);
        }
      } catch (error) {
        console.error(
          '[DynamicTimeline] Failed to load timeline:',
          error
        );

        setLive(false);
      }
    },
    []
  );

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

    if (
      !isSupabaseConfigured ||
      !supabase
    ) {
      return;
    }

    const channel = supabase
      .channel(
        'public-timeline-live'
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_events',
        },
        () => {
          void loadTimeline();
        }
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(
        channel
      );
    };
  }, [loadTimeline]);

  /*
   * Keep the current timeline state fresh if
   * the browser stays open while the date changes.
   */
  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setEvents((current) => [
          ...current,
        ]);
      }, 60_000);

    return () =>
      window.clearInterval(timer);
  }, []);

  const visibleEvents =
    useMemo(
      () =>
        events
          .filter(
            (event) =>
              event.public_visible
          )
          .sort(
            (a, b) =>
              a.sort_order -
              b.sort_order
          ),
      [events]
    );

  useEffect(() => {
    if (
      activeIndex >=
      visibleEvents.length
    ) {
      setActiveIndex(
        Math.max(
          0,
          visibleEvents.length - 1
        )
      );
    }
  }, [
    activeIndex,
    visibleEvents.length,
  ]);

  const visibleCards =
    visibleEvents.slice(
      activeIndex,
      activeIndex + 4
    );

  const canPrevious =
    activeIndex > 0;

  const canNext =
    activeIndex + 4 <
    visibleEvents.length;

  return (
    <section
      id="timeline"
      className="relative bg-[#05070A] px-4 py-14 sm:py-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-12 text-center">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]">
            <CalendarDays className="h-3.5 w-3.5" />
            EVENT TIMELINE
          </div>

          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">
            THE EVENT JOURNEY
          </h2>

          <div className="mt-4 flex justify-center">
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#66717F]">
              <span
                className={`h-2 w-2 rounded-full ${
                  live
                    ? 'bg-green-400'
                    : 'bg-[#FF7A30]'
                }`}
              />

              {live
                ? 'LIVE FROM SUPABASE'
                : 'EVENT CONFIGURATION'}
            </span>
          </div>
        </div>

        {/* CARDS */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">

          {visibleCards.map(
            (event, index) => {
              const badge =
                getDateBadge(
                  event.event_date
                );

              const status =
                getLiveStatus(event);

              return (
                <motion.article
                  key={event.id}
                  initial={{
                    opacity: 0,
                    y: 20,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.45,
                    delay:
                      index * 0.06,
                  }}
                  className="min-h-0 sm:min-h-[310px] rounded-2xl border border-white/10 bg-[#0B1016] p-4 sm:p-6 transition-all hover:border-[#36D9FF]/30"
                >

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

                    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-[#FF7A30] bg-[#07090D]">
                      <span className="font-display text-xl font-black text-white">
                        {badge.day}
                      </span>

                      <span className="font-mono text-[8px] font-bold text-[#FF7A30]">
                        {badge.month}
                      </span>
                    </div>

                    <div>
                      {badge.year ? (
                        <p className="font-mono text-[9px] uppercase tracking-wider text-[#8B96A5]">YEAR {badge.year}</p>
                      ) : (
                        <p className="font-mono text-[9px] uppercase tracking-wider text-[#8B96A5]">DATE TO BE ANNOUNCED</p>
                      )}

                      <h3 className="mt-1 font-display text-base font-bold leading-tight text-white">
                        {event.title}
                      </h3>
                    </div>

                  </div>

                  <p className="mt-4 sm:mt-6 text-xs leading-5 text-[#8B96A5]">
                    {event.description}
                  </p>

                  <div className="mt-6 border-t border-white/10 pt-4">

                    <div className="flex items-center justify-between">

                      <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#8B96A5]">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            status ===
                            'active'
                              ? 'bg-green-400'
                              : status ===
                                  'completed'
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
              );
            }
          )}

        </div>

        {/* TIMELINE BAR */}

        <div className="relative mt-10 sm:mt-16">

          <div className="h-1 rounded-full bg-[#18222D]" />

          <motion.div
            aria-label="Timeline journey vehicle"
            className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#36D9FF]/50 bg-[#071019] p-2 text-[#36D9FF] shadow-lg shadow-[#36D9FF]/20"
            style={{ left: `${scrollProgress * 100}%` }}
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <CarFront className="h-5 w-5" />
          </motion.div>

          <div
            className="absolute left-0 top-0 h-1 rounded-full bg-gradient-to-r from-[#FF7A30] to-[#36D9FF] transition-all duration-500"
            style={{
              width:
                visibleEvents.length > 1
                  ? `${Math.min(
                      100,
                      (activeIndex /
                        (visibleEvents.length -
                          1)) *
                        100
                    )}%`
                  : '0%',
            }}
          />

          <div className="absolute left-0 top-1/2 flex w-full -translate-y-1/2 justify-between">

            {visibleEvents.map(
              (event, index) => (
                <button
                  key={event.id}
                  type="button"
                  aria-label={`Go to ${event.title}`}
                  onClick={() =>
                    setActiveIndex(
                      Math.min(
                        index,
                        Math.max(
                          0,
                          visibleEvents.length -
                            4
                        )
                      )
                    )
                  }
                  className={`h-4 w-4 rounded-full border-2 transition-all ${
                    index >=
                    activeIndex &&
                    index <
                      activeIndex + 4
                      ? 'border-[#FF7A30] bg-[#05070A]'
                      : 'border-[#34404D] bg-[#05070A]'
                  }`}
                />
              )
            )}

          </div>
        </div>

        {/* CONTROLS */}

        <div className="mt-12 flex items-center justify-between">

          <div className="flex gap-3">

            <button
              type="button"
              disabled={!canPrevious}
              onClick={() =>
                setActiveIndex(
                  Math.max(
                    0,
                    activeIndex - 1
                  )
                )
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#FF7A30] text-white transition-all hover:bg-[#FF7A30]/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              disabled={!canNext}
              onClick={() =>
                setActiveIndex(
                  Math.min(
                    visibleEvents.length -
                      4,
                    activeIndex + 1
                  )
                )
              }
              className="flex h-12 w-12 items-center justify-center rounded-full border border-[#FF7A30] text-white transition-all hover:bg-[#FF7A30]/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

          </div>

          <div className="font-mono text-xs text-[#8B96A5]">
            <span className="text-white">
              {Math.min(
                activeIndex + 1,
                visibleEvents.length
              )}
            </span>{' '}
            /{' '}
            {visibleEvents.length}{' '}
            STATIONS
          </div>

        </div>

      </div>
    </section>
  );
};

export default DynamicTimeline;