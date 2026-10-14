import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { RULES_DATA } from '../../../config/site';

export const Rules: React.FC = () => {
  const rules = [...RULES_DATA]
    .filter((rule) => rule.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [openIndex, setOpenIndex] = useState<number | null>(
    rules.length > 0 ? 0 : null
  );

  return (
    <section
      id="rules"
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10 sm:mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/30 bg-[#FF7A30]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7A30]">
            <BookOpen className="h-3.5 w-3.5" />
            <span>EVENT GOVERNANCE</span>
          </div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            RULES & GUIDELINES
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#8B96A5] md:text-base">
            Please review the official participation, submission, conduct,
            and event guidelines before registering.
          </p>
        </div>

        {/* Rules */}
        <div className="space-y-4">
          {rules.map((rule, index) => {
            const isOpen = openIndex === index;

            return (
              <article
                key={rule.id}
                className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                  isOpen
                    ? 'border-[#FF7A30] bg-[#0D1219] shadow-md shadow-[#FF7A30]/10'
                    : 'border-white/10 bg-[#0D1219]/70 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() =>
                    setOpenIndex(isOpen ? null : index)
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded border border-[#FF7A30]/30 bg-white/5 px-2 py-0.5 font-mono text-xs font-bold text-[#FF7A30]">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="font-display text-base font-bold text-white md:text-lg">
                      {rule.title}
                    </span>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-[#FF7A30]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#8B96A5]" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 px-5 pb-6 pt-5">
                    <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      CATEGORY: {rule.category}
                    </div>

                    <p className="text-sm leading-relaxed text-[#8B96A5]">
                      {rule.content}
                    </p>
                  </div>
                )}
              </article>
            );
          })}
        </div>

      </div>
    </section>
  );
};