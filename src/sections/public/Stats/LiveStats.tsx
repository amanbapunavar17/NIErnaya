import React from 'react';
import {
  CalendarDays,
  Users,
  Building2,
  Trophy,
  Layers,
  MapPin,
} from 'lucide-react';
import { SITE_CONFIG, PRIZES_DATA } from '../../../config/site';

export const LiveStats: React.FC = () => {
  const totalPrizePool = PRIZES_DATA.reduce(
    (total, prize) => total + prize.amount_num,
    0
  );

  const statCards = [
    {
      label: 'EVENT PHASES',
      value: '03',
      icon: Layers,
      color: 'text-[#36D9FF]',
      border: 'border-[#36D9FF]/30',
      subtext: 'Progressive data challenge',
    },
    {
      label: 'TEAM SIZE',
      value: '2–3',
      icon: Users,
      color: 'text-[#FF7A30]',
      border: 'border-[#FF7A30]/30',
      subtext: 'Members per squad',
    },
    {
      label: 'ELIGIBLE YEAR',
      value: '2ND',
      icon: CalendarDays,
      color: 'text-[#8B5CF6]',
      border: 'border-[#8B5CF6]/30',
      subtext: '3rd Semester students',
    },
    {
      label: 'CAMPUSES',
      value: '02',
      icon: Building2,
      color: 'text-[#36D9FF]',
      border: 'border-[#36D9FF]/30',
      subtext: 'North + South Campus',
    },
    {
      label: 'PRIZE POOL',
      value: `₹${totalPrizePool.toLocaleString('en-IN')}`,
      icon: Trophy,
      color: 'text-[#10B981]',
      border: 'border-[#10B981]/30',
      subtext: 'Total cash awards',
    },
    {
      label: 'FINALE VENUE',
      value: 'NORTH',
      icon: MapPin,
      color: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/30',
      subtext: 'Offline Phase 3',
    },
  ];

  return (
    <section className="relative border-y border-white/5 bg-[#07090D] px-4 py-14 md:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF]">
              <Layers className="h-4 w-4 text-[#FF7A30]" />
              <span>EVENT TELEMETRY</span>
            </div>

            <h2 className="font-display text-2xl font-black text-[#F5F7FA] md:text-3xl">
              NIErnaya AT A GLANCE
            </h2>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0D1219] px-3.5 py-1.5 font-mono text-xs text-[#8B96A5]">
            {SITE_CONFIG.institution}
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`group flex flex-col justify-between rounded-xl border ${card.border} bg-[#0D1219] p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-bold leading-tight tracking-wider text-[#8B96A5]">
                    {card.label}
                  </span>

                  <Icon className={`h-4 w-4 shrink-0 ${card.color}`} />
                </div>

                <div>
                  <div className="font-display text-2xl font-black tracking-tight text-white md:text-3xl">
                    {card.value}
                  </div>

                  <div className="mt-0.5 font-mono text-[10px] text-[#8B96A5]/80">
                    {card.subtext}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};