import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Clock,
  Medal,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import type { HackathonResult } from '../../../types';

export const ResultsSection: React.FC = () => {
  const [results, setResults] = useState<HackathonResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadResults = async () => {
      if (!supabase) {
        if (mounted) {
          setResults([]);
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.rpc(
          'get_published_results'
        );

        if (error) {
          console.error('Failed to load published results:', error);
          return;
        }

        if (mounted) {
          setResults((data ?? []) as HackathonResult[]);
        }
      } catch (error) {
        console.error('Results loading error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResults();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section
      id="results"
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/30 bg-[#FF7A30]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7A30]">
            <Trophy className="h-3.5 w-3.5" />
            <span>OFFICIAL RESULTS</span>
          </div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            DATA DETECTIVE CHALLENGE RESULTS
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#8B96A5] md:text-base">
            Official results published by the NIErnaya organizing and
            faculty committee.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mx-auto flex max-w-xl flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0D1219] p-10 text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#36D9FF]" />

            <h3 className="font-display text-lg font-bold text-white">
              CHECKING OFFICIAL RESULTS
            </h3>

            <p className="mt-2 text-xs text-[#8B96A5]">
              Connecting to the NIErnaya results registry...
            </p>
          </div>
        )}

        {/* Pending */}
        {!loading && results.length === 0 && (
          <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-[#0D1219] p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#121A23] text-[#8B96A5]">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>

            <h3 className="font-display text-lg font-bold text-white">
              RESULTS ARE PENDING
            </h3>

            <p className="mt-2 text-xs leading-relaxed text-[#8B96A5]">
              Final results will appear here after the Phase 3 Live Data
              Battle and official result publication by the organizing
              committee.
            </p>
          </div>
        )}

        {/* Published Results */}
        {!loading && results.length > 0 && (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {results.map((result, index) => {
              const isFirst = result.position === '1st';

              return (
                <article
                  key={result.id}
                  className={`flex flex-col justify-between rounded-2xl bg-[#0D1219] p-7 text-center transition-all duration-300 hover:-translate-y-2 ${
                    isFirst
                      ? 'border-2 border-[#FF7A30] shadow-xl shadow-[#FF7A30]/15'
                      : 'border border-white/10 hover:border-[#36D9FF]/40'
                  }`}
                >
                  <div>
                    <div
                      className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
                        isFirst
                          ? 'border border-[#FF7A30]/50 bg-[#121A23] text-[#FF7A30]'
                          : 'border border-white/10 bg-[#121A23] text-[#36D9FF]'
                      }`}
                    >
                      {index === 0 ? (
                        <Trophy className="h-7 w-7" />
                      ) : index === 1 ? (
                        <Medal className="h-7 w-7" />
                      ) : (
                        <Sparkles className="h-7 w-7" />
                      )}
                    </div>

                    <span className="font-mono text-xs font-black uppercase tracking-widest text-[#FF7A30]">
                      {result.position}
                    </span>

                    <h3 className="my-2 font-display text-2xl font-black text-white">
                      {result.team_name}
                    </h3>

                    <div className="font-mono text-xs text-[#36D9FF]">
                      TEAM CODE: {result.team_code}
                    </div>

                    <p className="mt-2 text-xs text-[#8B96A5]">
                      Leader: {result.leader_name}
                    </p>

                    <p className="mt-1 text-[11px] font-mono uppercase text-[#8B96A5]">
                      {result.campus} Campus
                    </p>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-4 font-mono text-xs font-bold text-[#10B981]">
                    {result.prize_title}
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
};