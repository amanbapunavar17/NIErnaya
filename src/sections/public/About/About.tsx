import React from 'react';
import {
  Database,
  LineChart,
  Eye,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { SITE_CONFIG } from '../../../config/site';

export const About: React.FC = () => {
  const corePillars = [
    {
      icon: Database,
      number: '01',
      title: 'Problem & Data Formulation',
      description:
        'Identify meaningful analytical problems, discover relevant datasets, validate data availability, and frame clear questions that can be explored through data.',
    },
    {
      icon: LineChart,
      number: '02',
      title: 'Exploration & EDA',
      description:
        'Clean real-world datasets, understand patterns and relationships, perform exploratory analysis, and transform raw information into structured evidence.',
    },
    {
      icon: Eye,
      number: '03',
      title: 'Visualization & Storytelling',
      description:
        'Build clear and engaging visual narratives that communicate analytical findings and help audiences understand what the data is telling them.',
    },
  ];

  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#173A8C]/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FF7A30]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF]">
            <Compass className="h-3.5 w-3.5" />
            <span>EVENT CONCEPT</span>
          </div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            {SITE_CONFIG.aboutConcept.split('. ')[0]}.
            <br />
            <span className="text-[#FF7A30]">
              {SITE_CONFIG.aboutConcept.split('. ')[1]}
            </span>
          </h2>

          <p className="pt-5 text-sm leading-relaxed text-[#8B96A5] md:text-base">
            {SITE_CONFIG.name} is a collegiate Data Analytics & Visualization
            Data Detective Challenge hosted by{' '}
            <span className="font-semibold text-white">
              {SITE_CONFIG.institution}
            </span>
            . The event brings together problem formulation, data exploration,
            analytical thinking, and visual communication in one structured
            challenge.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:gap-8">
          {corePillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article
                key={pillar.number}
                className="group flex flex-col justify-between rounded-2xl border-2 border-white/5 bg-[#0D1219] p-5 sm:p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#FF7A30]/50 hover:shadow-xl hover:shadow-[#FF7A30]/10"
              >
                <div>
                  <div className="mb-7 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF7A30]/30 bg-[#121A23] text-[#FF7A30] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FF7A30] group-hover:text-[#07090D]">
                      <Icon className="h-6 w-6" />
                    </div>

                    <span className="font-mono text-xs font-bold tracking-widest text-[#36D9FF]/60">
                      PILLAR {pillar.number}
                    </span>
                  </div>

                  <h3 className="mb-3 font-display text-xl font-bold text-white transition-colors group-hover:text-[#36D9FF]">
                    {pillar.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-[#8B96A5]">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="font-mono text-xs text-[#8B96A5]">
                    NIErnaya
                  </span>

                  <ArrowUpRight className="h-4 w-4 text-[#FF7A30] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};