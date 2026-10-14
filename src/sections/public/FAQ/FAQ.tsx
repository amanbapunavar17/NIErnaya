import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';
import { FAQ_DATA } from '../../../config/site';

export const FAQ: React.FC = () => {
  const faqs = FAQ_DATA.filter((faq) => faq.published);

  const [openId, setOpenId] = useState<string | null>(
    faqs[0]?.id ?? null
  );

  return (
    <section
      id="faq"
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-4xl">

        {/* Header */}
        <div className="mb-10 sm:mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF]">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>CLARIFICATIONS</span>
          </div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#8B96A5] md:text-base">
            Everything you need to know about eligibility, teams, accounts,
            team registration, submissions, and faculty allocation.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-4">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <article
                key={faq.id}
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
                    setOpenId(isOpen ? null : faq.id)
                  }
                  className="flex w-full items-center justify-between gap-4 p-6 text-left"
                >
                  <div className="flex items-start gap-4">
                    <span className="mt-0.5 font-mono text-xs font-bold text-[#FF7A30]">
                      {String(faq.sort_order).padStart(2, '0')}
                    </span>

                    <span className="font-display text-base font-bold text-white md:text-lg">
                      {faq.question}
                    </span>
                  </div>

                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 shrink-0 text-[#FF7A30]" />
                  ) : (
                    <ChevronDown className="h-5 w-5 shrink-0 text-[#8B96A5]" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-white/5 px-6 pb-6 pt-5">
                    <div className="flex gap-4">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#36D9FF]" />

                      <div>
                        <p className="text-sm leading-relaxed text-[#8B96A5]">
                          {faq.answer}
                        </p>

                        <div className="mt-4 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                          CATEGORY: {faq.category}
                        </div>
                      </div>
                    </div>
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