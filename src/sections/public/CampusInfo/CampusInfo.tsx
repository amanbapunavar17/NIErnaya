import React from 'react';
import {
  Building,
  Navigation,
  Compass,
  MapPin,
  Monitor,
} from 'lucide-react';
import { SITE_CONFIG } from '../../../config/site';

export const CampusInfo: React.FC = () => {
  const { northCampusVenue, southCampusVenue } = SITE_CONFIG.contact;

  return (
    <section
      id="campus"
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-20 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto mb-8 sm:mb-14 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/30 bg-[#FF7A30]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7A30]">
            <Compass className="h-3.5 w-3.5" />
            <span>CAMPUS DISTRIBUTION</span>
          </div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
            NORTH & SOUTH CAMPUS
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#8B96A5]">
            {SITE_CONFIG.institution} operates across two campus locations
            supporting the different stages of NIErnaya.
          </p>
        </div>

        {/* Campus cards */}
        <div className="grid grid-cols-1 gap-4 sm:gap-8 md:grid-cols-2">

          {/* North */}
          <article className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border-2 border-[#FF7A30] bg-[#0D1219] p-5 sm:p-8 shadow-xl shadow-[#FF7A30]/10 transition-transform duration-300 hover:-translate-y-1">
            <div className="absolute right-0 top-0 rounded-bl-xl bg-[#FF7A30] px-4 py-1 font-mono text-xs font-black uppercase text-[#07090D]">
              PHASE 3 VENUE
            </div>

            <div>
              <div className="mb-5 flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#FF7A30]/40 bg-[#121A23] text-[#FF7A30]">
                  <Building className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-display text-2xl font-black text-white">
                    NIE NORTH CAMPUS
                  </h3>

                  <span className="font-mono text-xs text-[#36D9FF]">
                    CSE / AIML
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-[#8B96A5]">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#FF7A30]" />
                  <span>{northCampusVenue}</span>
                </div>

                <p>
                  <strong className="text-white">
                    Resident Departments:
                  </strong>{' '}
                  Computer Science & Engineering (CSE) and Artificial
                  Intelligence & Machine Learning (AIML).
                </p>

                <div className="rounded-xl border border-[#FF7A30]/20 bg-[#FF7A30]/5 p-4">
                  <p className="text-xs leading-relaxed text-[#FFB38A]">
                    <strong className="text-[#FF7A30]">
                      Phase 3:
                    </strong>{' '}
                    The Live Data Battle and Grand Finale are conducted
                    completely offline at North Campus.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-mono text-xs text-[#8B96A5]">
                NORTH CAMPUS
              </span>

              <Navigation className="h-4 w-4 text-[#FF7A30]" />
            </div>
          </article>

          {/* South */}
          <article className="group flex flex-col justify-between rounded-3xl border border-white/10 bg-[#0D1219] p-5 sm:p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#36D9FF]/40">
            <div>
              <div className="mb-5 flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#121A23] text-[#36D9FF]">
                  <Building className="h-6 w-6" />
                </div>

                <div>
                  <h3 className="font-display text-2xl font-black text-white">
                    NIE SOUTH CAMPUS
                  </h3>

                  <span className="font-mono text-xs text-[#8B96A5]">
                    ECE / EEE / ME / CV
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-[#8B96A5]">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#36D9FF]" />
                  <span>{southCampusVenue}</span>
                </div>

                <p>
                  <strong className="text-white">
                    Resident Departments:
                  </strong>{' '}
                  Electronics & Communication (ECE), Electrical & Electronics
                  (EEE), Mechanical Engineering (ME), and Civil Engineering
                  (CV).
                </p>

                <div className="rounded-xl border border-[#36D9FF]/20 bg-[#36D9FF]/5 p-4">
                  <p className="flex items-start gap-2 text-xs leading-relaxed text-[#9FEFFF]">
                    <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-[#36D9FF]" />
                    Faculty coordination and event activities are arranged around the official phase schedule.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-mono text-xs text-[#8B96A5]">
                SOUTH CAMPUS
              </span>

              <Navigation className="h-4 w-4 text-[#36D9FF]" />
            </div>
          </article>

        </div>
      </div>
    </section>
  );
};