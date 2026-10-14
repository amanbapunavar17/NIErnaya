import React from 'react';
import { BrainCircuit, Bot, Cpu, Activity, TrendingUp, Sparkles, Layers, ArrowUpRight } from 'lucide-react';
type ThemeItem = { id: string; iconName: string; title: string; subtitle: string; tag: string; description: string };
const DATA_DETECTIVE_CHALLENGE_THEMES: ThemeItem[] = [];

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  BrainCircuit,
  Bot,
  Cpu,
  Activity,
  TrendingUp,
  Sparkles
};

export const Themes: React.FC = () => {
  return (
    <section id="themes" className="py-14 sm:py-24 px-4 md:px-8 bg-[#07090D] relative">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FF7A30]/10 border border-[#FF7A30]/30 text-[#FF7A30] font-mono text-xs font-bold uppercase tracking-widest">
            <Layers className="w-3.5 h-3.5" />
            <span>SPECIALIZED DOMAINS</span>
          </div>

          <h2 className="font-display font-black text-3xl sm:text-5xl text-white tracking-tight">
            DATA DETECTIVE CHALLENGE THEMES & TRACKS
          </h2>

          <p className="text-sm md:text-base text-[#8B96A5]">
            Select an analytical frontier to unleash your data models, statistical exploratory pipelines, and high-impact visual presentations.
          </p>
        </div>

        {/* 6 Theme Cards with Retro-Modern Orange Rim Aesthetic (from user reference) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {DATA_DETECTIVE_CHALLENGE_THEMES.map((theme) => {
            const Icon = iconMap[theme.iconName] || Sparkles;
            return (
              <div
                key={theme.id}
                className="theme-card-retro p-6 sm:p-7 flex flex-col justify-between group cursor-default"
              >
                {/* Top Corner Tab Badge */}
                <div className="absolute top-0 left-0 bg-[#07090D] px-4 py-1.5 theme-tab-badge flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#FF7A30]" />
                  <span className="font-mono text-xs font-black tracking-wider text-white">
                    {theme.title}
                  </span>
                </div>

                {/* Main Icon Visual Presentation */}
                <div className="pt-8 pb-4 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-[#121A23] border border-[#FF7A30]/30 flex items-center justify-center text-[#FF7A30] group-hover:scale-110 group-hover:border-[#36D9FF] group-hover:text-[#36D9FF] transition-all duration-300 shadow-inner">
                    <Icon className="w-12 h-12 stroke-[1.5]" />
                  </div>
                </div>

                {/* Subtitle and Content */}
                <div className="space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#36D9FF] tracking-wider">
                      {theme.subtitle}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#8B96A5]">
                      {theme.tag}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-[#8B96A5] leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Bottom Footer Accent */}
                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono text-[#8B96A5]">
                  <span>2ND YEAR (3RD SEM)</span>
                  <span className="text-[#FF7A30] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    EXPLORE <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
