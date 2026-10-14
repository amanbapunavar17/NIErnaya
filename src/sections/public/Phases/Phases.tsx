import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  CalendarDays,
  MapPin,
  Search,
  FlaskConical,
  Gavel,
  Radio,
} from 'lucide-react';

import { motion } from 'framer-motion';

import {
  supabase,
  isSupabaseConfigured,
} from '../../../lib/supabase/client';

type PhaseStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'hidden';

type Phase = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  focus: string;
  description: string;
  campus_info: string | null;
  status: PhaseStatus;
  sort_order: number;
  public_visible: boolean;
};

const FALLBACK_PHASES: Phase[] = [
  {
    id: 'phase-1',
    name: 'PHASE 1',
    slug: 'data-hunt',
    start_date: '2026-10-28',
    end_date: '2026-10-28',
    focus:
      'Problem Identification & Data Acquisition',
    description:
      'Teams formulate analytical problem statements, identify disparate data sources, validate data accessibility, and submit their initial approach pitch.',
    campus_info:
      'Team problem definition and data acquisition',
    status: 'upcoming',
    sort_order: 1,
    public_visible: true,
  },
  {
    id: 'phase-2',
    name: 'PHASE 2',
    slug: 'data-lab-war',
    start_date: '2026-11-11',
    end_date: '2026-11-11',
    focus:
      'Data Cleaning, EDA & Visualization War',
    description:
      'Perform advanced data wrangling, missing-value imputation, exploratory data analysis, and craft high-impact interactive visual dashboards.',
    campus_info:
      'Data cleaning, exploratory analysis, and visualization',
    status: 'upcoming',
    sort_order: 2,
    public_visible: true,
  },
  {
    id: 'phase-3',
    name: 'PHASE 3',
    slug: 'live-battle',
    start_date: '2026-11-20',
    end_date: '2026-11-20',
    focus:
      'Live Data Battle & Grand Finale',
    description:
      'Shortlisted finalist teams solve the live data challenge, build clear visual narratives, and present their findings.',
    campus_info:
      'NIE North Campus, Koorgalli, Mysuru',
    status: 'upcoming',
    sort_order: 3,
    public_visible: true,
  },
];

const phaseIcon = (slug: string) => {
  if (slug.includes('data-hunt')) {
    return Search;
  }

  if (slug.includes('data-lab')) {
    return FlaskConical;
  }

  return Gavel;
};

const parseDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? null
    : date;
};

const formatDateRange = (
  start: string,
  end: string
) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (!startDate || !endDate) {
    return `${start} – ${end}`;
  }

  const startDay =
    startDate.getDate();

  const endDay =
    endDate.getDate();

  const startMonth =
    startDate.toLocaleDateString(
      'en-IN',
      { month: 'long' }
    );

  const endMonth =
    endDate.toLocaleDateString(
      'en-IN',
      { month: 'long' }
    );

  if (startDay === endDay && startMonth === endMonth) {
    return `${startDay} ${startMonth}`;
  }

  if (startMonth === endMonth) {
    return `${startDay}th – ${endDay}th ${endMonth}`;
  }

  return `${startDay}th ${startMonth} – ${endDay}th ${endMonth}`;
};

const effectiveStatus = (
  phase: Phase
): Exclude<PhaseStatus, 'hidden'> =>
  phase.status === 'hidden' ? 'upcoming' : phase.status;

export const Phases: React.FC = () => {
  const [phases, setPhases] =
    useState<Phase[]>(FALLBACK_PHASES);

  const [loading, setLoading] =
    useState(true);

  const [live, setLive] =
    useState(false);

  const loadPhases = useCallback(
    async () => {
      if (
        !isSupabaseConfigured ||
        !supabase
      ) {
        setLoading(false);
        return;
      }

      try {
        const {
          data,
          error,
        } = await supabase
          .from('phases')
          .select(`
            id,
            name,
            slug,
            start_date,
            end_date,
            focus,
            description,
            campus_info,
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
          setPhases(data as Phase[]);
          setLive(true);
        }
      } catch (error) {
        console.error(
          '[Phases] Failed to load phases:',
          error
        );

        setLive(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadPhases();

    if (
      !isSupabaseConfigured ||
      !supabase
    ) {
      return;
    }

    const channel = supabase
      .channel('public-phases-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phases',
        },
        () => {
          void loadPhases();
        }
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(
        channel
      );
    };
  }, [loadPhases]);

  /*
   * Recalculate date-based status at midnight / when
   * the browser remains open across a date boundary.
   */
  useEffect(() => {
    const timer =
      window.setInterval(() => {
        setPhases((current) => [
          ...current,
        ]);
      }, 60_000);

    return () =>
      window.clearInterval(timer);
  }, []);

  const visiblePhases = useMemo(
    () =>
      phases
        .filter(
          (phase) =>
            phase.public_visible &&
            phase.status !== 'hidden'
        )
        .sort(
          (a, b) =>
            a.sort_order -
            b.sort_order
        ),
    [phases]
  );

  return (
    <section
      id="phases"
      className="relative bg-[#05070A] px-4 py-14 sm:py-24 sm:px-8 lg:px-12"
    >
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-10 sm:mb-16 text-center">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]">
            <Radio className="h-3.5 w-3.5" />
            THE EVENT JOURNEY
          </div>

          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            THE THREE CRITICAL PHASES
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-sm leading-6 text-[#8B96A5] sm:text-base">
            Move from problem identification and data
            discovery to the live finale at NIE North
            Campus.
          </p>

          <div className="mt-5 flex justify-center">
            <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-wider text-[#66717F]">
              <span
                className={`h-2 w-2 rounded-full ${
                  live
                    ? 'bg-green-400'
                    : 'bg-[#FF7A30]'
                }`}
              />

              {loading
                ? 'SYNCING EVENT CONFIGURATION'
                : live
                  ? 'LIVE FROM SUPABASE'
                  : 'USING EVENT CONFIGURATION'}
            </span>
          </div>
        </div>

        {/* PHASE CARDS */}

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">

          {visiblePhases.map(
            (phase, index) => {
              const Icon =
                phaseIcon(
                  phase.slug
                );

              const status =
                effectiveStatus(
                  phase
                );

              const isFinale =
                index ===
                visiblePhases.length -
                  1;

              return (
                <motion.article
                  key={phase.id}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.6,
                    delay:
                      index * 0.1,
                  }}
                  className={`relative overflow-hidden rounded-2xl border bg-[#0D1219] p-5 sm:p-8 transition-all ${
                    isFinale
                      ? 'border-[#FF7A30] shadow-2xl shadow-[#FF7A30]/10'
                      : 'border-white/10 hover:border-[#36D9FF]/30'
                  }`}
                >

                  {isFinale && (
                    <div className="absolute right-[-38px] top-6 rotate-45 bg-[#FF7A30] px-10 py-2 font-mono text-[9px] font-black uppercase tracking-widest text-[#05070A]">
                      100% OFFLINE
                    </div>
                  )}

                  <div className="flex items-center justify-between">

                    <span className="rounded-md border border-[#FF7A30]/30 bg-[#FF7A30]/10 px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#FF7A30]">
                      {phase.name}
                    </span>

                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#121A23]">
                      <Icon className="h-5 w-5 text-[#36D9FF]" />
                    </div>

                  </div>

                  <h3 className="mt-5 sm:mt-9 max-w-[90%] font-display text-2xl font-black leading-tight text-white">
                    {phase.focus}
                  </h3>

                  <div className="mt-5 flex items-center gap-2 font-mono text-xs font-bold text-[#36D9FF]">
                    <CalendarDays className="h-4 w-4" />

                    {formatDateRange(
                      phase.start_date,
                      phase.end_date
                    )}
                  </div>

                  <p className="mt-4 sm:mt-6 sm:min-h-[92px] text-sm leading-6 text-[#8B96A5]">
                    {phase.description}
                  </p>

                  <div className="mt-6 border-t border-white/10 pt-5">

                    <div className="flex items-start gap-2 font-mono text-xs font-bold text-[#D9E1E8]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#8B96A5]" />

                      <span>
                        {phase.campus_info ||
                          'Event participation details will be announced.'}
                      </span>
                    </div>

                    <div className="mt-5 flex items-center justify-between">

                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#66717F]">
                        STATUS:{' '}
                        <span
                          className={
                            status ===
                            'active'
                              ? 'text-green-400'
                              : status ===
                                  'completed'
                                ? 'text-[#36D9FF]'
                                : 'text-[#36D9FF]'
                          }
                        >
                          {status}
                        </span>
                      </span>

                      <span className="font-mono text-[10px] text-[#66717F]">
                        PHASE{' '}
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          '0'
                        )}
                      </span>

                    </div>

                  </div>

                </motion.article>
              );
            }
          )}

        </div>
      </div>
    </section>
  );
};

export default Phases;